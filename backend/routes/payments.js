const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/payments — list all customer payments
router.get('/', async (req, res) => {
  try {
    const { invoice_id, customer_id } = req.query;
    let sql = 'SELECT p.*, c.numero as invoice_numero, c.client as customer_name FROM customer_payments p LEFT JOIN clients c ON p.invoice_id = c.id WHERE 1=1';
    const params = [];
    if (invoice_id) { sql += ' AND p.invoice_id = ?'; params.push(invoice_id); }
    if (customer_id) { sql += ' AND p.customer_id = ?'; params.push(customer_id); }
    sql += ' ORDER BY p.payment_date DESC';
    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/payments/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM customer_payments WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Paiement non trouvé' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payments — create a payment
router.post('/', async (req, res) => {
  try {
    const { invoice_id, customer_id, payment_date, amount, payment_method, reference, receiving_account, notes } = req.body;
    // Validate invoice exists
    const invoice = await dbGet('SELECT * FROM clients WHERE id = ? AND type = \'facture\'', [invoice_id]);
    if (!invoice) return res.status(404).json({ error: 'Facture non trouvée' });
    // Check if payment exceeds remaining balance
    const totalPaid = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE invoice_id = ?', [invoice_id]);
    const remaining = invoice.montant - (totalPaid.total || 0);
    if (amount > remaining) {
      return res.status(400).json({ error: `Le montant dépasse le solde restant (${remaining} FCFA)` });
    }
    // Create payment
    const result = await dbRun(
      `INSERT INTO customer_payments (invoice_id, customer_id, payment_date, amount, payment_method, reference, receiving_account, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_id, customer_id, payment_date, amount, payment_method || 'virement', reference || null, receiving_account || null, notes || null]
    );
    // Update invoice paid amount
    const newTotalPaid = (totalPaid.total || 0) + amount;
    const newStatut = newTotalPaid >= invoice.montant ? 'solde' : (newTotalPaid > 0 ? 'acompte' : invoice.statut);
    await dbRun('UPDATE clients SET montant_acompte = ?, statut = ? WHERE id = ?', [newTotalPaid, newStatut, invoice_id]);
    const row = await dbGet('SELECT * FROM customer_payments WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await dbGet('SELECT * FROM customer_payments WHERE id = ?', [id]);
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    await dbRun('DELETE FROM customer_payments WHERE id = ?', [id]);
    // Recalculate invoice paid amount
    const totalPaid = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM customer_payments WHERE invoice_id = ?', [payment.invoice_id]);
    const invoice = await dbGet('SELECT * FROM clients WHERE id = ?', [payment.invoice_id]);
    const newStatut = totalPaid.total >= invoice.montant ? 'solde' : (totalPaid.total > 0 ? 'acompte' : 'envoye');
    await dbRun('UPDATE clients SET montant_acompte = ?, statut = ? WHERE id = ?', [totalPaid.total, newStatut, payment.invoice_id]);
    res.json({ deleted: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
