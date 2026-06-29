const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/disbursements — list all supplier disbursements
router.get('/', async (req, res) => {
  try {
    const { expense_id, supplier_id } = req.query;
    let sql = 'SELECT d.*, f.numero as expense_numero, f.fournisseur as supplier_name FROM supplier_disbursements d LEFT JOIN fournisseurs f ON d.expense_id = f.id WHERE 1=1';
    const params = [];
    if (expense_id) { sql += ' AND d.expense_id = ?'; params.push(expense_id); }
    if (supplier_id) { sql += ' AND d.supplier_id = ?'; params.push(supplier_id); }
    sql += ' ORDER BY d.payment_date DESC';
    const rows = await dbAll(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/disbursements/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM supplier_disbursements WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Décaissement non trouvé' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/disbursements — create a disbursement
router.post('/', async (req, res) => {
  try {
    const { expense_id, supplier_id, payment_date, amount, payment_method, reference, source_account, notes } = req.body;
    // Validate expense exists
    const expense = await dbGet('SELECT * FROM fournisseurs WHERE id = ?', [expense_id]);
    if (!expense) return res.status(404).json({ error: 'Dépense non trouvée' });
    // Check if payment exceeds remaining balance
    const totalPaid = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_disbursements WHERE expense_id = ?', [expense_id]);
    const remaining = expense.montant - (totalPaid.total || 0);
    if (amount > remaining) {
      return res.status(400).json({ error: `Le montant dépasse le solde restant (${remaining} FCFA)` });
    }
    // Create disbursement
    const result = await dbRun(
      `INSERT INTO supplier_disbursements (expense_id, supplier_id, payment_date, amount, payment_method, reference, source_account, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [expense_id, supplier_id, payment_date, amount, payment_method || 'virement', reference || null, source_account || null, notes || null]
    );
    // Update expense paid amount
    const newTotalPaid = (totalPaid.total || 0) + amount;
    const newStatut = newTotalPaid >= expense.montant ? 'payee' : (newTotalPaid > 0 ? 'acompte_verse' : expense.statut);
    await dbRun('UPDATE fournisseurs SET montant_acompte = ?, statut = ? WHERE id = ?', [newTotalPaid, newStatut, expense_id]);
    const row = await dbGet('SELECT * FROM supplier_disbursements WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/disbursements/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disbursement = await dbGet('SELECT * FROM supplier_disbursements WHERE id = ?', [id]);
    if (!disbursement) return res.status(404).json({ error: 'Décaissement non trouvé' });
    await dbRun('DELETE FROM supplier_disbursements WHERE id = ?', [id]);
    // Recalculate expense paid amount
    const totalPaid = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM supplier_disbursements WHERE expense_id = ?', [disbursement.expense_id]);
    const expense = await dbGet('SELECT * FROM fournisseurs WHERE id = ?', [disbursement.expense_id]);
    const newStatut = totalPaid.total >= expense.montant ? 'payee' : (totalPaid.total > 0 ? 'acompte_verse' : 'impayee');
    await dbRun('UPDATE fournisseurs SET montant_acompte = ?, statut = ? WHERE id = ?', [totalPaid.total, newStatut, disbursement.expense_id]);
    res.json({ deleted: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
