const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/customers — list all customers with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
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

// GET /api/customers/:id — get one customer with aggregates
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) return res.status(404).json({ error: 'Client non trouvé' });
    // Aggregates
    const invoices = await dbAll('SELECT COUNT(*) as count, SUM(montant) as total, SUM(montant_acompte) as paid FROM clients WHERE customer_id = ? AND type = \'facture\'', [id]);
    const proformas = await dbAll('SELECT COUNT(*) as count, SUM(montant) as total FROM clients WHERE customer_id = ? AND type = \'proforma\'', [id]);
    const payments = await dbAll('SELECT SUM(amount) as total FROM customer_payments WHERE customer_id = ?', [id]);
    res.json({
      ...customer,
      invoices_count: invoices[0]?.count || 0,
      invoices_total: invoices[0]?.total || 0,
      invoices_paid: invoices[0]?.paid || 0,
      proformas_count: proformas[0]?.count || 0,
      proformas_total: proformas[0]?.total || 0,
      payments_total: payments[0]?.total || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/customers — create
router.post('/', async (req, res) => {
  try {
    const { type, name, contact_name, phone, email, address, city, country, tax_id, rccm, default_payment_terms_days, notes } = req.body;
    const result = await dbRun(
      `INSERT INTO customers (type, name, contact_name, phone, email, address, city, country, tax_id, rccm, default_payment_terms_days, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type || 'entreprise', name, contact_name || null, phone || null, email || null, address || null, city || null, country || 'Cote dIvoire', tax_id || null, rccm || null, default_payment_terms_days || 30, notes || null]
    );
    const row = await dbGet('SELECT * FROM customers WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/customers/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, contact_name, phone, email, address, city, country, tax_id, rccm, default_payment_terms_days, notes, is_active } = req.body;
    await dbRun(
      `UPDATE customers SET type=?, name=?, contact_name=?, phone=?, email=?, address=?, city=?, country=?, tax_id=?, rccm=?, default_payment_terms_days=?, notes=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [type || 'entreprise', name, contact_name || null, phone || null, email || null, address || null, city || null, country || 'Cote dIvoire', tax_id || null, rccm || null, default_payment_terms_days || 30, notes || null, is_active !== undefined ? is_active : 1, id]
    );
    const row = await dbGet('SELECT * FROM customers WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if customer has invoices
    const invoices = await dbGet('SELECT COUNT(*) as count FROM clients WHERE customer_id = ?', [id]);
    if (invoices.count > 0) {
      return res.status(400).json({ error: 'Ce client a des factures associées. Supprimez d\'abord les factures.' });
    }
    await dbRun('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ deleted: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
