#!/usr/bin/env node
// Migration ponctuelle des données SQLite -> PostgreSQL (Supabase).
//
// Usage :
//   node scripts/migrate-sqlite-to-pg.js              # refuse si les tables PG ne sont pas vides
//   node scripts/migrate-sqlite-to-pg.js --truncate   # vide d'abord les tables PG (TRUNCATE ... CASCADE)
//
// - Lit backend/data/comptabilite.db en LECTURE SEULE (jamais modifié).
// - Insère dans PostgreSQL via DATABASE_URL (env ou backend/.env), dans UNE transaction.
// - Préserve les ids d'origine, puis resynchronise les séquences d'identité.
// - Arrêtez le serveur (node server.js) avant de lancer la migration.
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERREUR : DATABASE_URL non défini (env ou backend/.env). Aucune donnée migrée.');
  process.exit(1);
}

const SQLITE_PATH = path.join(__dirname, '..', 'data', 'comptabilite.db');
if (!fs.existsSync(SQLITE_PATH)) {
  console.error('ERREUR : fichier SQLite introuvable :', SQLITE_PATH);
  process.exit(1);
}

const TRUNCATE = process.argv.includes('--truncate');

const sqlite3 = require('sqlite3');
const { Pool } = require('pg');

// Ordre d'import respectant les dépendances (tables maîtres d'abord)
const TABLES = [
  {
    name: 'customers',
    columns: ['id', 'type', 'name', 'contact_name', 'phone', 'email', 'address', 'city', 'country',
      'tax_id', 'rccm', 'default_payment_terms_days', 'notes', 'is_active', 'created_at', 'updated_at'],
  },
  {
    name: 'suppliers',
    columns: ['id', 'name', 'category', 'contact_name', 'phone', 'email', 'address',
      'tax_id', 'rccm', 'notes', 'is_active', 'created_at', 'updated_at'],
  },
  {
    name: 'clients',
    columns: ['id', 'type', 'numero', 'client', 'customer_id', 'montant', 'date_emission', 'date_relance',
      'date_validite', 'statut', 'montant_acompte', 'notes', 'pj_filename', 'pj_path', 'created_at', 'updated_at'],
  },
  {
    name: 'fournisseurs',
    columns: ['id', 'type', 'numero', 'fournisseur', 'supplier_id', 'categorie', 'montant', 'date_depense',
      'date_echeance', 'statut', 'montant_acompte', 'notes', 'pj_filename', 'pj_path', 'created_at', 'updated_at'],
  },
  {
    name: 'document_line_items',
    columns: ['id', 'document_id', 'document_type', 'description', 'quantity', 'unit', 'unit_price',
      'discount_type', 'discount_value', 'tax_rate', 'line_subtotal', 'line_tax', 'line_total', 'sort_order', 'created_at'],
  },
  {
    name: 'customer_payments',
    columns: ['id', 'invoice_id', 'customer_id', 'payment_date', 'amount', 'payment_method', 'reference',
      'receiving_account', 'attachment_filename', 'attachment_path', 'notes', 'created_at'],
  },
  {
    name: 'supplier_disbursements',
    columns: ['id', 'expense_id', 'supplier_id', 'payment_date', 'amount', 'payment_method', 'reference',
      'source_account', 'attachment_filename', 'attachment_path', 'notes', 'created_at'],
  },
  {
    name: 'numbering_sequences',
    columns: ['id', 'prefix', 'year', 'last_number'],
  },
];

function sqliteAll(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function printPgError(err) {
  console.error('code    :', err.code);
  console.error('message :', err.message);
  console.error('detail  :', err.detail);
  if (Array.isArray(err.errors)) {
    err.errors.forEach((e) => console.error('  sous-erreur:', e.code, e.message));
  }
}

async function main() {
  const sqlite = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);
  const isLocalDb = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 1,
  });

  const pg = await pool.connect();
  try {
    // Garde anti-double-import : toutes les tables cibles doivent être vides
    const nonEmpty = [];
    for (const t of TABLES) {
      const r = await pg.query(`SELECT COUNT(*)::int AS n FROM ${t.name}`);
      if (r.rows[0].n > 0) nonEmpty.push(`${t.name} (${r.rows[0].n} lignes)`);
    }
    if (nonEmpty.length > 0 && !TRUNCATE) {
      console.error('ABANDON : les tables PostgreSQL suivantes contiennent déjà des données :');
      nonEmpty.forEach((t) => console.error('  -', t));
      console.error('Relancez avec --truncate pour les vider d\'abord (ATTENTION : destructif côté PostgreSQL),');
      console.error('ou videz-les manuellement. Aucune donnée n\'a été modifiée.');
      process.exit(2);
    }

    await pg.query('BEGIN');

    if (nonEmpty.length > 0 && TRUNCATE) {
      console.log('TRUNCATE des tables cibles (--truncate) :', nonEmpty.join(', '));
      await pg.query(`TRUNCATE ${TABLES.map((t) => t.name).join(', ')} RESTART IDENTITY CASCADE`);
    }

    // Import table par table, ids préservés
    const report = {};
    for (const t of TABLES) {
      const rows = await sqliteAll(sqlite, `SELECT * FROM ${t.name}`);
      const placeholders = t.columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO ${t.name} (${t.columns.join(', ')}) VALUES (${placeholders})`;
      for (const row of rows) {
        const values = t.columns.map((c) => (row[c] === undefined ? null : row[c]));
        await pg.query(insertSql, values);
      }
      report[t.name] = rows.length;
    }

    // Resynchronisation des séquences d'identité sur MAX(id)
    for (const t of TABLES) {
      await pg.query(
        `SELECT setval(pg_get_serial_sequence('${t.name}', 'id'),
                COALESCE((SELECT MAX(id) FROM ${t.name}), 0) + 1, false)`
      );
    }

    await pg.query('COMMIT');

    console.log('=== Migration terminée avec succès ===');
    Object.entries(report).forEach(([table, n]) => console.log(`  ${table}: ${n} ligne(s) importée(s)`));
    console.log('Séquences resynchronisées. Vérifiez avec : node scripts/verify-migration.js');
  } catch (err) {
    await pg.query('ROLLBACK').catch(() => {});
    console.error('=== Échec migration — transaction annulée, PostgreSQL inchangé ===');
    printPgError(err);
    process.exitCode = 1;
  } finally {
    pg.release();
    await pool.end();
    sqlite.close();
  }
}

main().catch((err) => {
  console.error('=== Échec migration ===');
  printPgError(err);
  process.exit(1);
});
