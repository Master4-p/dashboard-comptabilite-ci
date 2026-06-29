const express = require('express');
const router = express.Router();
const { dbAll, dbRun, dbGet } = require('../database');

// GET /api/line-items?document_id=X&document_type=Y
router.get('/', async (req, res) => {
  try {
    const { document_id, document_type } = req.query;
    if (!document_id || !document_type) return res.status(400).json({ error: 'document_id and document_type required' });
    const rows = await dbAll('SELECT * FROM document_line_items WHERE document_id = ? AND document_type = ? ORDER BY sort_order ASC', [document_id, document_type]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: recalculate document total from line items and update the parent document
async function recalculateDocumentTotal(document_id, document_type) {
  try {
    const lines = await dbAll('SELECT * FROM document_line_items WHERE document_id = ? AND document_type = ?', [document_id, document_type]);
    const total = lines.reduce((sum, line) => sum + (line.line_total || 0), 0);
    
    if (document_type === 'facture' || document_type === 'proforma') {
      await dbRun('UPDATE clients SET montant = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [total, document_id]);
    } else if (document_type === 'facture_fournisseur' || document_type === 'depense') {
      await dbRun('UPDATE fournisseurs SET montant = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [total, document_id]);
    }
  } catch (e) {
    console.error('Recalculate error:', e.message);
  }
}

// POST /api/line-items — create a line item
router.post('/', async (req, res) => {
  try {
    const { document_id, document_type, description, quantity, unit, unit_price, discount_type, discount_value, tax_rate } = req.body;
    const q = quantity || 1;
    const up = unit_price || 0;
    const dt = discount_type || 'none';
    const dv = discount_value || 0;
    const tr = tax_rate || 0;
    let subtotal = q * up;
    let discount = 0;
    if (dt === 'percent') discount = subtotal * (dv / 100);
    if (dt === 'fixed') discount = dv;
    subtotal = Math.max(0, subtotal - discount);
    const tax = Math.round(subtotal * (tr / 100));
    const total = subtotal + tax;
    const result = await dbRun(
      `INSERT INTO document_line_items (document_id, document_type, description, quantity, unit, unit_price, discount_type, discount_value, tax_rate, line_subtotal, line_tax, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [document_id, document_type, description, q, unit || 'unité', up, dt, dv, tr, subtotal, tax, total]
    );
    await recalculateDocumentTotal(document_id, document_type);
    const row = await dbGet('SELECT * FROM document_line_items WHERE id = ?', [result.id]);
    res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/line-items/:id
router.delete('/:id', async (req, res) => {
  try {
    const line = await dbGet('SELECT * FROM document_line_items WHERE id = ?', [req.params.id]);
    await dbRun('DELETE FROM document_line_items WHERE id = ?', [req.params.id]);
    if (line) {
      await recalculateDocumentTotal(line.document_id, line.document_type);
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
