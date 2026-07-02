// Couche d'accès aux données.
// - Si DATABASE_URL est défini : PostgreSQL (Supabase) via le package pg.
// - Sinon : repli SQLite local (développement), comportement historique inchangé.
// L'interface exportée reste identique : dbAll, dbRun, dbGet.
const path = require('path');
const fs = require('fs');

// Charge backend/.env s'il existe (DATABASE_URL en local, jamais commité)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

let db = null;
let DB_PATH = null;
let dbAll, dbRun, dbGet;

if (DATABASE_URL) {
  // ============================ PostgreSQL ============================
  const { Pool, types } = require('pg');

  // SQLite renvoie des nombres ; pg renvoie int8 (COUNT/SUM) et numeric en
  // chaînes. On les parse en nombres pour garder le même comportement.
  types.setTypeParser(20, (v) => parseInt(v, 10));   // int8
  types.setTypeParser(1700, (v) => parseFloat(v));   // numeric

  const isLocalDb = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 5,
  });
  db = pool;

  // Traduit le SQL écrit pour SQLite vers PostgreSQL :
  //  - placeholders '?' -> $1..$n (hors littéraux entre quotes)
  //  - CURRENT_TIMESTAMP -> texte UTC au format SQLite 'YYYY-MM-DD HH:MI:SS'
  //    (les colonnes created_at/updated_at restent en TEXT)
  function toPgSql(sql) {
    let out = '';
    let n = 0;
    let inString = false;
    for (const ch of sql) {
      if (ch === "'") {
        inString = !inString;
        out += ch;
      } else if (ch === '?' && !inString) {
        out += '$' + (++n);
      } else {
        out += ch;
      }
    }
    return out.replace(
      /\bCURRENT_TIMESTAMP\b/g,
      "to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')"
    );
  }

  dbAll = async (sql, params = []) => {
    const result = await pool.query(toPgSql(sql), params);
    return result.rows;
  };

  dbGet = async (sql, params = []) => {
    const result = await pool.query(toPgSql(sql), params);
    return result.rows[0];
  };

  dbRun = async (sql, params = []) => {
    let text = toPgSql(sql);
    const isInsert = /^\s*INSERT\b/i.test(text);
    if (isInsert && !/\bRETURNING\b/i.test(text)) {
      text += ' RETURNING id';
    }
    const result = await pool.query(text, params);
    return {
      id: isInsert && result.rows[0] ? result.rows[0].id : undefined,
      changes: result.rowCount,
    };
  };

  // Applique les migrations supabase/migrations/*.sql (idempotentes) au démarrage,
  // puis lance le backfill — même séquence qu'en SQLite.
  const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

  async function initPg() {
    if (fs.existsSync(MIGRATIONS_DIR)) {
      const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
      for (const file of files) {
        try {
          await pool.query(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
        } catch (err) {
          err.migrationFile = file;
          throw err;
        }
      }
    }
    console.log('Connecté à PostgreSQL — schéma vérifié');
    await backfillData();
  }

  initPg().catch((err) => {
    console.error('=== Échec initialisation PostgreSQL ===');
    if (err.migrationFile) console.error('Fichier migration :', err.migrationFile);
    console.error('code    :', err.code);
    console.error('message :', err.message);
    console.error('detail  :', err.detail);
    if (err.position) console.error('position:', err.position);
    console.error('stack   :', err.stack);
    // AggregateError (échec de connexion multi-adresses) : détail des sous-erreurs
    if (Array.isArray(err.errors)) {
      err.errors.forEach((e) => console.error('  sous-erreur:', e.code, e.message));
    }
    // DATABASE_URL est défini : on refuse de démarrer sans base opérationnelle
    process.exit(1);
  });
} else {
  // ============================== SQLite ==============================
  const sqlite3 = require('sqlite3').verbose();

  const DATA_DIR = path.join(__dirname, 'data');
  DB_PATH = path.join(DATA_DIR, 'comptabilite.db');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Erreur ouverture DB:', err.message);
    } else {
      console.log('Connecté à SQLite:', DB_PATH);
      initSchema();
      setTimeout(() => {
        backfillData().catch(e => console.error('Backfill failed:', e));
      }, 100);
    }
  });

  function initSchema() {
    db.serialize(() => {
      // Existing tables (preserved)
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT CHECK(type IN ('facture', 'proforma')) NOT NULL,
          numero TEXT UNIQUE NOT NULL,
          client TEXT NOT NULL,
          customer_id INTEGER,
          montant INTEGER NOT NULL,
          date_emission TEXT NOT NULL,
          date_relance TEXT,
          statut TEXT CHECK(statut IN ('brouillon', 'envoye', 'relance', 'acompte', 'solde', 'annule')) NOT NULL DEFAULT 'brouillon',
          montant_acompte INTEGER DEFAULT 0,
          notes TEXT,
          pj_filename TEXT,
          pj_path TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS fournisseurs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT CHECK(type IN ('facture_fournisseur', 'depense')) NOT NULL,
          numero TEXT,
          fournisseur TEXT NOT NULL,
          supplier_id INTEGER,
          categorie TEXT,
          montant INTEGER NOT NULL,
          date_depense TEXT NOT NULL,
          date_echeance TEXT,
          statut TEXT CHECK(statut IN ('impayee', 'acompte_verse', 'payee', 'annule')) NOT NULL DEFAULT 'impayee',
          montant_acompte INTEGER DEFAULT 0,
          notes TEXT,
          pj_filename TEXT,
          pj_path TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: customers master table
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT CHECK(type IN ('entreprise', 'particulier')) NOT NULL DEFAULT 'entreprise',
          name TEXT NOT NULL,
          contact_name TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          city TEXT,
          country TEXT DEFAULT 'Cote dIvoire',
          tax_id TEXT,
          rccm TEXT,
          default_payment_terms_days INTEGER DEFAULT 30,
          notes TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: suppliers master table
      db.run(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT,
          contact_name TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          tax_id TEXT,
          rccm TEXT,
          notes TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: document line items
      db.run(`
        CREATE TABLE IF NOT EXISTS document_line_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          document_type TEXT CHECK(document_type IN ('facture', 'proforma', 'facture_fournisseur', 'depense')) NOT NULL,
          description TEXT NOT NULL,
          quantity REAL DEFAULT 1,
          unit TEXT DEFAULT 'unité',
          unit_price INTEGER NOT NULL,
          discount_type TEXT CHECK(discount_type IN ('none', 'percent', 'fixed')) DEFAULT 'none',
          discount_value REAL DEFAULT 0,
          tax_rate REAL DEFAULT 0,
          line_subtotal INTEGER NOT NULL,
          line_tax INTEGER DEFAULT 0,
          line_total INTEGER NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: customer payments
      db.run(`
        CREATE TABLE IF NOT EXISTS customer_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          payment_date TEXT NOT NULL,
          amount INTEGER NOT NULL,
          payment_method TEXT DEFAULT 'virement',
          reference TEXT,
          receiving_account TEXT,
          attachment_filename TEXT,
          attachment_path TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: supplier disbursements
      db.run(`
        CREATE TABLE IF NOT EXISTS supplier_disbursements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          expense_id INTEGER NOT NULL,
          supplier_id INTEGER NOT NULL,
          payment_date TEXT NOT NULL,
          amount INTEGER NOT NULL,
          payment_method TEXT DEFAULT 'virement',
          reference TEXT,
          source_account TEXT,
          attachment_filename TEXT,
          attachment_path TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // New: numbering sequences
      db.run(`
        CREATE TABLE IF NOT EXISTS numbering_sequences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prefix TEXT NOT NULL,
          year INTEGER NOT NULL,
          last_number INTEGER DEFAULT 0,
          UNIQUE(prefix, year)
        )
      `);

      // Migration: add customer_id to clients if not exists
      db.run(`ALTER TABLE clients ADD COLUMN customer_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column')) console.log('Migration clients.customer_id:', err ? err.message : 'ok');
      });
      // Migration: add supplier_id to fournisseurs if not exists
      db.run(`ALTER TABLE fournisseurs ADD COLUMN supplier_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column')) console.log('Migration fournisseurs.supplier_id:', err ? err.message : 'ok');
      });
      // Migration: expand statut check for clients
      db.run(`ALTER TABLE clients ADD COLUMN date_validite TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) console.log('Migration clients.date_validite:', err ? err.message : 'ok');
      });
      // Migration: expand statut check for fournisseurs (already has annule)
      // No additional migration needed for statut expansion in SQLite (CHECK constraints are only validated on insert/update)

      console.log('Schéma initialisé');
    });
  }

  // Promisify helpers
  dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
}

// Backfill: migrate existing text-based customers/suppliers to master tables
async function backfillData() {
  const report = {
    customersCreated: 0,
    suppliersCreated: 0,
    invoicesLinked: 0,
    expensesLinked: 0,
    duplicatesSkipped: 0,
    unresolved: 0,
  };

  try {
    // Backfill customers from distinct client names in invoices
    const distinctClients = await dbAll(`SELECT DISTINCT LOWER(TRIM(client)) as normalized, TRIM(client) as display_name FROM clients WHERE client IS NOT NULL AND client != ''`);
    for (const row of distinctClients) {
      const existing = await dbGet(`SELECT id FROM customers WHERE LOWER(TRIM(name)) = ?`, [row.normalized]);
      if (existing) {
        report.duplicatesSkipped++;
        continue;
      }
      const result = await dbRun(
        `INSERT INTO customers (name) VALUES (?)`,
        [row.display_name]
      );
      report.customersCreated++;
      // Link existing invoices to this customer
      const linkResult = await dbRun(
        `UPDATE clients SET customer_id = ? WHERE LOWER(TRIM(client)) = ?`,
        [result.id, row.normalized]
      );
      report.invoicesLinked += linkResult.changes;
    }

    // Backfill suppliers from distinct supplier names in expenses
    const distinctSuppliers = await dbAll(`SELECT DISTINCT LOWER(TRIM(fournisseur)) as normalized, TRIM(fournisseur) as display_name FROM fournisseurs WHERE fournisseur IS NOT NULL AND fournisseur != ''`);
    for (const row of distinctSuppliers) {
      const existing = await dbGet(`SELECT id FROM suppliers WHERE LOWER(TRIM(name)) = ?`, [row.normalized]);
      if (existing) {
        report.duplicatesSkipped++;
        continue;
      }
      const result = await dbRun(
        `INSERT INTO suppliers (name) VALUES (?)`,
        [row.display_name]
      );
      report.suppliersCreated++;
      // Link existing expenses to this supplier
      const linkResult = await dbRun(
        `UPDATE fournisseurs SET supplier_id = ? WHERE LOWER(TRIM(fournisseur)) = ?`,
        [result.id, row.normalized]
      );
      report.expensesLinked += linkResult.changes;
    }

    console.log('Backfill report:', report);
    return report;
  } catch (err) {
    console.error('Backfill error:', err);
    throw err;
  }
}

module.exports = { db, dbAll, dbRun, dbGet, DB_PATH, backfillData };
