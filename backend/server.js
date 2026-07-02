const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { dbAll } = require('./database');

const clientsRouter = require('./routes/clients');
const fournisseursRouter = require('./routes/fournisseurs');
const uploadsRouter = require('./routes/uploads');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const paymentsRouter = require('./routes/payments');
const disbursementsRouter = require('./routes/disbursements');
const lineItemsRouter = require('./routes/lineItems');
const numberingRouter = require('./routes/numbering');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/clients', clientsRouter);
app.use('/api/fournisseurs', fournisseursRouter);
app.use('/api/upload', uploadsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/disbursements', disbursementsRouter);
app.use('/api/line-items', lineItemsRouter);
app.use('/api/numbering', numberingRouter);

// Export CSV
app.get('/api/export/clients', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM clients ORDER BY date_emission DESC');
    const headers = ['Type', 'Numero', 'Client', 'Montant', 'Date Emission', 'Date Relance', 'Statut', 'Acompte', 'Reste', 'Notes'];
    const lines = rows.map(r => [
      r.type, r.numero, r.client, r.montant, r.date_emission, r.date_relance || '', r.statut, r.montant_acompte, r.montant - r.montant_acompte, r.notes || ''
    ]);
    const csv = [headers, ...lines].map(r => r.map(x => `"${x}"`).join(';')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=factures.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/export/fournisseurs', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM fournisseurs ORDER BY date_depense DESC');
    const headers = ['Type', 'Numero', 'Fournisseur', 'Categorie', 'Montant', 'Date Depense', 'Date Echeance', 'Statut', 'Acompte', 'Reste', 'Notes'];
    const lines = rows.map(r => [
      r.type, r.numero || '', r.fournisseur, r.categorie || '', r.montant, r.date_depense, r.date_echeance || '', r.statut, r.montant_acompte, r.montant - r.montant_acompte, r.notes || ''
    ]);
    const csv = [headers, ...lines].map(r => r.map(x => `"${x}"`).join(';')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=fournisseurs.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = [];
    const clients = await dbAll(`SELECT * FROM clients WHERE type='facture' AND statut != 'solde'`);
    const now = new Date().toISOString().split('T')[0];
    clients.forEach(c => {
      const jours = Math.floor((new Date() - new Date(c.date_emission)) / (86400000));
      if (jours > 30) {
        alerts.push({ type: 'client', niveau: 'danger', message: `${c.numero} — ${c.client} : ${c.montant - c.montant_acompte} FCFA (${jours} jours)` });
      } else if (c.date_relance && c.date_relance <= now) {
        alerts.push({ type: 'client', niveau: 'warning', message: `${c.numero} — ${c.client} : relance prévue le ${c.date_relance}` });
      }
    });
    const fournisseurs = await dbAll(`SELECT * FROM fournisseurs WHERE statut != 'payee' AND date_echeance IS NOT NULL AND date_echeance <= ?`, [now]);
    fournisseurs.forEach(f => {
      alerts.push({ type: 'fournisseur', niveau: 'warning', message: `${f.numero || 'Dépense'} — ${f.fournisseur} : échéance atteinte (${f.montant - f.montant_acompte} FCFA)` });
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly stats endpoint
app.get('/api/stats/monthly', async (req, res) => {
  try {
    const months = [];
    const encaissements = [];
    const decaissements = [];
    const factures = [];
    const depenses = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('fr-FR', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      months.push(monthLabel);

      // substr(date, 1, 7) = 'YYYY-MM' : portable SQLite/PostgreSQL (dates stockées en TEXT ISO)
      const e = await dbAll(`SELECT COALESCE(SUM(montant), 0) as total FROM clients WHERE type='facture' AND statut='solde' AND substr(date_emission, 1, 7) = ?`, [yearMonth]);
      const de = await dbAll(`SELECT COALESCE(SUM(montant), 0) as total FROM fournisseurs WHERE statut='payee' AND substr(date_depense, 1, 7) = ?`, [yearMonth]);
      const f = await dbAll(`SELECT COUNT(*) as count FROM clients WHERE type='facture' AND substr(date_emission, 1, 7) = ?`, [yearMonth]);
      const dp = await dbAll(`SELECT COUNT(*) as count FROM fournisseurs WHERE substr(date_depense, 1, 7) = ?`, [yearMonth]);

      encaissements.push(e[0]?.total || 0);
      decaissements.push(de[0]?.total || 0);
      factures.push(f[0]?.count || 0);
      depenses.push(dp[0]?.count || 0);
    }

    // Si aucune donnée réelle, injecter des données mockées réalistes
    const hasData = encaissements.some(v => v > 0) || decaissements.some(v => v > 0);
    if (!hasData) {
      const mockEncaissements = [850000, 920000, 1100000, 1050000, 1300000, 1200000];
      const mockDecaissements = [600000, 650000, 750000, 800000, 900000, 850000];
      const mockFactures = [8, 9, 11, 10, 13, 12];
      const mockDepenses = [4, 5, 6, 7, 8, 6];
      for (let i = 0; i < 6; i++) {
        if (encaissements[i] === 0) encaissements[i] = mockEncaissements[i];
        if (decaissements[i] === 0) decaissements[i] = mockDecaissements[i];
        if (factures[i] === 0) factures[i] = mockFactures[i];
        if (depenses[i] === 0) depenses[i] = mockDepenses[i];
      }
    }

    const solde = encaissements.map((e, i) => e - decaissements[i]);

    res.json({ months, encaissements, decaissements, solde, factures, depenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent activity endpoint
app.get('/api/activity', async (req, res) => {
  try {
    const clients = await dbAll(`SELECT 'client' as source, type, numero, client as nom, montant, statut, date_emission as date, created_at FROM clients ORDER BY created_at DESC LIMIT 10`);
    const fournisseurs = await dbAll(`SELECT 'fournisseur' as source, type, numero, fournisseur as nom, montant, statut, date_depense as date, created_at FROM fournisseurs ORDER BY created_at DESC LIMIT 10`);
    const all = [...clients, ...fournisseurs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
console.log('Frontend dist path:', frontendDist);
console.log('Frontend dist exists:', fs.existsSync(frontendDist));
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).send('Cannot GET ' + req.path);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
