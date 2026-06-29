const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/clients — lister avec filtres
router.get('/', async (req, res) => {
  try {
    const { search, statut, type } = req.query;
    let sql = 'SELECT c.*, cu.name as customer_name FROM clients c LEFT JOIN customers cu ON c.customer_id = cu.id WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (c.client LIKE ? OR c.numero LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
      sql += ' AND c.statut = ?';
      params.push(statut);
    }
    if (type) {
      sql += ' AND c.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY c.date_emission DESC';

    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients — créer
router.post('/', async (req, res) => {
  try {
    const { type, numero, client, customer_id, montant, date_emission, date_relance, statut, montant_acompte, notes, pj_filename, pj_path } = req.body;
    const result = await dbRun(
      `INSERT INTO clients (type, numero, client, customer_id, montant, date_emission, date_relance, statut, montant_acompte, notes, pj_filename, pj_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, numero, client, customer_id || null, montant, date_emission, date_relance || null, statut, montant_acompte || 0, notes || '', pj_filename || null, pj_path || null]
    );
    const row = await dbGet('SELECT * FROM clients WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/:id — modifier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, numero, client, customer_id, montant, date_emission, date_relance, statut, montant_acompte, notes, pj_filename, pj_path } = req.body;
    await dbRun(
      `UPDATE clients SET type=?, numero=?, client=?, customer_id=?, montant=?, date_emission=?, date_relance=?, statut=?, montant_acompte=?, notes=?, pj_filename=?, pj_path=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [type, numero, client, customer_id || null, montant, date_emission, date_relance || null, statut, montant_acompte || 0, notes || '', pj_filename || null, pj_path || null, id]
    );
    const row = await dbGet('SELECT * FROM clients WHERE id = ?', [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet('SELECT pj_path FROM clients WHERE id = ?', [id]);
    await dbRun('DELETE FROM clients WHERE id = ?', [id]);
    res.json({ deleted: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/clients/:id/statut — changer statut
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
    await dbRun(`UPDATE clients SET ${updates}, updated_at=CURRENT_TIMESTAMP WHERE id = ?`, params);
    const row = await dbGet('SELECT * FROM clients WHERE id = ?', [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/stats — statistiques (DOIT être avant /:id)
router.get('/stats/global', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT
        SUM(CASE WHEN type='facture' AND statut != 'solde' THEN montant - montant_acompte ELSE 0 END) as attente,
        SUM(CASE WHEN type='facture' AND statut = 'solde' THEN montant ELSE 0 END) as solde,
        SUM(CASE WHEN type='facture' THEN montant_acompte ELSE 0 END) as acompte,
        SUM(CASE WHEN type='proforma' THEN montant ELSE 0 END) as proformas,
        COUNT(CASE WHEN type='facture' AND statut != 'solde' AND statut = 'relance' THEN 1 END) as relances_statut,
        COUNT(CASE WHEN type='facture' AND statut != 'solde' AND date_emission < date('now', '-30 days') THEN 1 END) as relances_30j
      FROM clients
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT c.*, cu.name as customer_name FROM clients c LEFT JOIN customers cu ON c.customer_id = cu.id WHERE c.id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Document non trouvé' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
