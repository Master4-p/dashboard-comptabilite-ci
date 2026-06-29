const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/suppliers — list all suppliers with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR contact_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY name ASC';
    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/suppliers/:id — get one supplier with aggregates
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) return res.status(404).json({ error: 'Fournisseur non trouvé' });
    // Aggregates
    const expenses = await dbAll('SELECT COUNT(*) as count, SUM(montant) as total, SUM(montant_acompte) as paid FROM fournisseurs WHERE supplier_id = ? AND type = \'depense\'', [id]);
    const invoices = await dbAll('SELECT COUNT(*) as count, SUM(montant) as total, SUM(montant_acompte) as paid FROM fournisseurs WHERE supplier_id = ? AND type = \'facture_fournisseur\'', [id]);
    const disbursements = await dbAll('SELECT SUM(amount) as total FROM supplier_disbursements WHERE supplier_id = ?', [id]);
    res.json({
      ...supplier,
      expenses_count: expenses[0]?.count || 0,
      expenses_total: expenses[0]?.total || 0,
      expenses_paid: expenses[0]?.paid || 0,
      invoices_count: invoices[0]?.count || 0,
      invoices_total: invoices[0]?.total || 0,
      invoices_paid: invoices[0]?.paid || 0,
      disbursements_total: disbursements[0]?.total || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers — create
router.post('/', async (req, res) => {
  try {
    const { name, category, contact_name, phone, email, address, tax_id, rccm, notes } = req.body;
    const result = await dbRun(
      `INSERT INTO suppliers (name, category, contact_name, phone, email, address, tax_id, rccm, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category || null, contact_name || null, phone || null, email || null, address || null, tax_id || null, rccm || null, notes || null]
    );
    const row = await dbGet('SELECT * FROM suppliers WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/suppliers/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, contact_name, phone, email, address, tax_id, rccm, notes, is_active } = req.body;
    await dbRun(
      `UPDATE suppliers SET name=?, category=?, contact_name=?, phone=?, email=?, address=?, tax_id=?, rccm=?, notes=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [name, category || null, contact_name || null, phone || null, email || null, address || null, tax_id || null, rccm || null, notes || null, is_active !== undefined ? is_active : 1, id]
    );
    const row = await dbGet('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if supplier has expenses or invoices
    const expenses = await dbGet('SELECT COUNT(*) as count FROM fournisseurs WHERE supplier_id = ?', [id]);
    if (expenses.count > 0) {
      return res.status(400).json({ error: 'Ce fournisseur a des dépenses/factures associées. Supprimez d\'abord les dépenses.' });
    }
    await dbRun('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ deleted: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
