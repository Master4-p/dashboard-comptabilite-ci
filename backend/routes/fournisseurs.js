const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/fournisseurs — lister avec filtres
router.get('/', async (req, res) => {
  try {
    const { search, statut, categorie } = req.query;
    let sql = 'SELECT f.*, s.name as supplier_name FROM fournisseurs f LEFT JOIN suppliers s ON f.supplier_id = s.id WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (f.fournisseur LIKE ? OR f.numero LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
      sql += ' AND f.statut = ?';
      params.push(statut);
    }
    if (categorie) {
      sql += ' AND f.categorie = ?';
      params.push(categorie);
    }

    sql += ' ORDER BY f.date_depense DESC';

    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fournisseurs — créer
router.post('/', async (req, res) => {
  try {
    const { type, numero, fournisseur, supplier_id, categorie, montant, date_depense, date_echeance, statut, montant_acompte, notes, pj_filename, pj_path } = req.body;
    const result = await dbRun(
      `INSERT INTO fournisseurs (type, numero, fournisseur, supplier_id, categorie, montant, date_depense, date_echeance, statut, montant_acompte, notes, pj_filename, pj_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, numero || null, fournisseur, supplier_id || null, categorie || null, montant, date_depense, date_echeance || null, statut, montant_acompte || 0, notes || '', pj_filename || null, pj_path || null]
    );
    const row = await dbGet('SELECT * FROM fournisseurs WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fournisseurs/:id — modifier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, numero, fournisseur, supplier_id, categorie, montant, date_depense, date_echeance, statut, montant_acompte, notes, pj_filename, pj_path } = req.body;
    await dbRun(
      `UPDATE fournisseurs SET type=?, numero=?, fournisseur=?, supplier_id=?, categorie=?, montant=?, date_depense=?, date_echeance=?, statut=?, montant_acompte=?, notes=?, pj_filename=?, pj_path=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [type, numero || null, fournisseur, supplier_id || null, categorie || null, montant, date_depense, date_echeance || null, statut, montant_acompte || 0, notes || '', pj_filename || null, pj_path || null, id]
    );
    const row = await dbGet('SELECT * FROM fournisseurs WHERE id = ?', [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fournisseurs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM fournisseurs WHERE id = ?', [id]);
    res.json({ deleted: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/fournisseurs/:id/statut — changer statut
router.patch('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, montant_acompte } = req.body;
    let updates = 'statut = ?';
    const params = [statut];
    if (montant_acompte !== undefined) {
      updates += ', montant_acompte = ?';
      params.push(montant_acompte);
    }
    params.push(id);
    await dbRun(`UPDATE fournisseurs SET ${updates}, updated_at=CURRENT_TIMESTAMP WHERE id = ?`, params);
    const row = await dbGet('SELECT * FROM fournisseurs WHERE id = ?', [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fournisseurs/stats — statistiques (DOIT être avant /:id)
router.get('/stats/global', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        SUM(CASE WHEN statut != 'payee' THEN montant - montant_acompte ELSE 0 END) as a_payer,
        SUM(CASE WHEN statut = 'payee' THEN montant ELSE 0 END) as paye,
        SUM(montant_acompte) as acompte_verse
      FROM fournisseurs
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fournisseurs/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT f.*, s.name as supplier_name FROM fournisseurs f LEFT JOIN suppliers s ON f.supplier_id = s.id WHERE f.id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Document non trouvé' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
