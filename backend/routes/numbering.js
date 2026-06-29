const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../database');

// GET /api/numbering/:prefix/:year
router.get('/:prefix/:year', async (req, res) => {
  try {
    const { prefix, year } = req.params;
    let row = await dbGet('SELECT * FROM numbering_sequences WHERE prefix = ? AND year = ?', [prefix, year]);
    if (!row) {
      await dbRun('INSERT INTO numbering_sequences (prefix, year, last_number) VALUES (?, ?, 0)', [prefix, year]);
      row = await dbGet('SELECT * FROM numbering_sequences WHERE prefix = ? AND year = ?', [prefix, year]);
    }
    const nextNumber = row.last_number + 1;
    const formatted = `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
    res.json({ prefix, year, last_number: row.last_number, next_number: nextNumber, formatted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/numbering/:prefix/:year/increment
router.post('/:prefix/:year/increment', async (req, res) => {
  try {
    const { prefix, year } = req.params;
    await dbRun('UPDATE numbering_sequences SET last_number = last_number + 1 WHERE prefix = ? AND year = ?', [prefix, year]);
    const row = await dbGet('SELECT * FROM numbering_sequences WHERE prefix = ? AND year = ?', [prefix, year]);
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
