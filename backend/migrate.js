const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/comptabilite.db');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function migrate() {
  try {
    await run('BEGIN TRANSACTION');
    await run(`CREATE TABLE clients_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('facture', 'proforma')) NOT NULL,
      numero TEXT UNIQUE NOT NULL,
      client TEXT NOT NULL,
      customer_id INTEGER,
      montant INTEGER NOT NULL,
      date_emission TEXT NOT NULL,
      date_relance TEXT,
      date_validite TEXT,
      statut TEXT CHECK(statut IN ('brouillon', 'envoye', 'relance', 'acompte', 'solde', 'annule')) NOT NULL DEFAULT 'brouillon',
      montant_acompte INTEGER DEFAULT 0,
      notes TEXT,
      pj_filename TEXT,
      pj_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    await run('INSERT INTO clients_new SELECT id, type, numero, client, customer_id, montant, date_emission, date_relance, date_validite, statut, montant_acompte, notes, pj_filename, pj_path, created_at, updated_at FROM clients');
    await run('DROP TABLE clients');
    await run('ALTER TABLE clients_new RENAME TO clients');
    
    await run(`CREATE TABLE fournisseurs_new (
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
    )`);
    await run('INSERT INTO fournisseurs_new SELECT id, type, numero, fournisseur, supplier_id, categorie, montant, date_depense, date_echeance, statut, montant_acompte, notes, pj_filename, pj_path, created_at, updated_at FROM fournisseurs');
    await run('DROP TABLE fournisseurs');
    await run('ALTER TABLE fournisseurs_new RENAME TO fournisseurs');
    await run('COMMIT');
    console.log('Migration OK');
  } catch (e) {
    console.error('Error:', e.message);
    await run('ROLLBACK').catch(() => {});
  } finally {
    db.close();
  }
}

migrate();
