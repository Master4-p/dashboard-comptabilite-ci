#!/usr/bin/env node
// Vérification post-migration : compare SQLite et PostgreSQL
// (nombre de lignes, MAX(id), sommes des montants).
//
// Usage : node scripts/verify-migration.js
// Sort avec le code 0 si tout correspond, 1 sinon.
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERREUR : DATABASE_URL non défini (env ou backend/.env).');
  process.exit(1);
}

const SQLITE_PATH = path.join(__dirname, '..', 'data', 'comptabilite.db');
if (!fs.existsSync(SQLITE_PATH)) {
  console.error('ERREUR : fichier SQLite introuvable :', SQLITE_PATH);
  process.exit(1);
}

const sqlite3 = require('sqlite3');
const { Pool } = require('pg');

// [table, expression agrégée supplémentaire (portable SQLite/PG) ou null]
const CHECKS = [
  ['customers', null],
  ['suppliers', null],
  ['clients', 'COALESCE(SUM(montant), 0)'],
  ['fournisseurs', 'COALESCE(SUM(montant), 0)'],
  ['document_line_items', 'COALESCE(SUM(line_total), 0)'],
  ['customer_payments', 'COALESCE(SUM(amount), 0)'],
  ['supplier_disbursements', 'COALESCE(SUM(amount), 0)'],
  ['numbering_sequences', 'COALESCE(SUM(last_number), 0)'],
];

function sqliteGet(db, sql) {
  return new Promise((resolve, reject) => {
    db.get(sql, [], (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function main() {
  const sqlite = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);
  const isLocalDb = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 1,
  });

  let mismatches = 0;
  console.log('table                      | métrique | SQLite       | PostgreSQL   | statut');
  console.log('---------------------------|----------|--------------|--------------|-------');

  try {
    for (const [table, sumExpr] of CHECKS) {
      const sql = `SELECT COUNT(*) AS n, COALESCE(MAX(id), 0) AS max_id${sumExpr ? `, ${sumExpr} AS total` : ''} FROM ${table}`;
      const s = await sqliteGet(sqlite, sql);
      const p = (await pool.query(sql)).rows[0];

      const metrics = [['lignes', Number(s.n), Number(p.n)], ['max id', Number(s.max_id), Number(p.max_id)]];
      if (sumExpr) metrics.push(['somme', Number(s.total), Number(p.total)]);

      for (const [label, sv, pv] of metrics) {
        const ok = sv === pv;
        if (!ok) mismatches++;
        console.log(
          `${table.padEnd(26)} | ${label.padEnd(8)} | ${String(sv).padEnd(12)} | ${String(pv).padEnd(12)} | ${ok ? 'OK' : 'ECART'}`
        );
      }
    }
  } finally {
    await pool.end();
    sqlite.close();
  }

  console.log('');
  if (mismatches === 0) {
    console.log('VERIFICATION OK : SQLite et PostgreSQL correspondent.');
  } else {
    console.error(`VERIFICATION ECHOUEE : ${mismatches} écart(s) détecté(s).`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Erreur vérification :', err.code || '', err.message);
  process.exit(1);
});
