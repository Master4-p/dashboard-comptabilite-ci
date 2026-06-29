# Dashboard Comptabilité — Relais IT

Application complète de gestion comptable avec **vrai backend** (Node.js + Express + SQLite) et **frontend premium** (React + TypeScript + Tailwind CSS + Recharts), adaptée au contexte ivoirien. Brand : **Relais IT**.

---

## Fonctionnalités

### Authentification
- Page de connexion avec identifiants
- 2 comptes de démo :
  - `admin@relaisit.ci` / `admin123`
  - `compta@relaisit.ci` / `compta2026`
- Session persistante (localStorage)
- Déconnexion depuis le menu profil

### Ventes (Factures & Proformas)
- Créer, modifier, supprimer des factures et proformas
- Numérotation, nom client, montant en FCFA
- Date d'émission et **date de relance personnalisée**
- Statuts : Envoyé → Relancé → Acompte reçu → Soldé
- Suivi des acomptes avec calcul automatique du reste dû
- **Alertes** automatiques si > 30 jours ou date de relance atteinte
- Actions rapides : Relancer, Solder en un clic
- **Pièces jointes** (PDF, JPG, PNG, DOC, XLS) — stockées sur disque
- **Export PDF** des factures avec template Relais IT
- Export CSV

### Achats et dépenses (Fournisseurs)
- Factures fournisseur et dépenses directes
- **Catégories** : Matière première, Fourniture, Transport, Loyer, Services, Marketing, Équipement, Salaires, Impôts/Taxes, Divers
- Date de la dépense et **date d'échéance de paiement**
- Statuts : Impayée → Acompte versé → Payée
- Alertes si échéance dépassée
- Actions rapides : Payer en un clic
- **Export PDF** des dépenses avec template Relais IT
- Pièces jointes et export CSV

### Tableau de bord
- 4 KPIs : Chiffre d'affaires facturé, Encaissements, Créances clients, Dépenses fournisseurs
- **Graphiques interactifs Recharts** :
  - Flux de trésorerie (bar chart encaissements vs décaissements)
  - Répartition des statuts (pie chart)
  - Solde net (area chart)
- Liste compacte des alertes
- Actions rapides
- Tout en **FCFA** avec format de date **JJ/MM/AAAA**

---

## Design Premium

- **Brand** : Relais IT — logo intégré dans header et sidebar
- **Header premium** : breadcrumb, recherche globale (Ctrl+K), bouton "Nouveau" avec dropdown, notifications, avatar avec nom utilisateur
- **Sidebar** : groupes Pilotage / Ventes / Achats / Gestion, navigation structurée
- **Design tokens** : navy `#173B6C`, royal blue `#2563EB`, orange `#F59E0B`
- **Composants** : cards, badges, tableaux avec overflow menu, pagination, filtres avancés, multiselect
- **Responsive** : sidebar drawer sur mobile, tables scrollables, KPIs en colonnes adaptatives

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | Node.js + Express + SQLite3 |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Graphiques | Recharts (interactifs) |
| PDF | jsPDF (export factures/dépenses) |
| Uploads | Multer (fichiers sur disque, max 10 Mo) |
| Export | CSV natif (Excel-compatible) |

---

## Installation rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou plus)

### 1. Backend

```bash
cd backend
npm install
node server.js
```

Le serveur démarre sur **http://localhost:3001**

- Base de données SQLite créée automatiquement : `backend/data/comptabilite.db`
- Dossier uploads créé automatiquement : `backend/uploads/`

### 2. Frontend (développement)

```bash
cd frontend
npm install
npm run dev
```

Ouvre **http://localhost:5173** dans votre navigateur.

Le proxy Vite redirige automatiquement les appels API vers `localhost:3001`.

### 3. Production (build complet)

```bash
cd frontend
npm run build
cd ../backend
node server.js
```

Ouvre **http://localhost:3001** — le serveur sert directement le frontend buildé.

**Comptes de démo :**
- `admin@relaisit.ci` / `admin123`
- `compta@relaisit.ci` / `compta2026`

---

## Structure du projet

```
dashboard-comptabilite-ci/
├── backend/
│   ├── server.js              # Serveur Express
│   ├── database.js            # Connexion SQLite + schéma
│   ├── package.json
│   ├── data/                  # Base de données SQLite
│   ├── uploads/               # Pièces jointes
│   └── routes/
│       ├── clients.js         # API clients/factures
│       ├── fournisseurs.js    # API fournisseurs/dépenses
│       └── uploads.js         # Upload/download fichiers
├── frontend/
│   ├── public/
│   │   ├── logo.png           # Logo Relais IT
│   │   ├── logo-sm.png        # Logo 40x40
│   │   └── logo-md.png        # Logo 120x120
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Authentification
│   │   ├── design/
│   │   │   └── design.md          # Design system
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── AppLayout.tsx
│   │   │   └── ui/
│   │   │       ├── KpiCard.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── ActionMenu.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── Charts.tsx       # Recharts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx        # Connexion
│   │   │   ├── Dashboard.tsx        # Vue d'ensemble
│   │   │   ├── VentesPage.tsx       # Factures & proformas
│   │   │   └── AchatsPage.tsx       # Dépenses & fournisseurs
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   └── exportPDF.ts       # Export PDF
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/clients` | Lister les clients (filtres: `?search=&statut=&type=`) |
| POST | `/api/clients` | Créer une facture/proforma |
| PUT | `/api/clients/:id` | Modifier |
| DELETE | `/api/clients/:id` | Supprimer |
| PATCH | `/api/clients/:id/statut` | Changer statut (Relancer, Solder...) |
| GET | `/api/clients/stats/global` | Stats clients |
| GET | `/api/fournisseurs` | Lister les fournisseurs |
| POST | `/api/fournisseurs` | Créer une dépense |
| PUT | `/api/fournisseurs/:id` | Modifier |
| DELETE | `/api/fournisseurs/:id` | Supprimer |
| PATCH | `/api/fournisseurs/:id/statut` | Changer statut |
| GET | `/api/fournisseurs/stats/global` | Stats fournisseurs |
| POST | `/api/upload` | Upload pièce jointe |
| GET | `/api/uploads/:filename` | Télécharger pièce jointe |
| GET | `/api/alerts` | Liste des alertes actives |
| GET | `/api/export/clients` | Export CSV clients |
| GET | `/api/export/fournisseurs` | Export CSV fournisseurs |

---

## Sauvegarde des données

La base de données SQLite est un **fichier unique** :
```
backend/data/comptabilite.db
```

Pour sauvegarder vos données, copiez ce fichier + le dossier `backend/uploads/`.

Pour migrer sur un autre ordinateur : copiez l'ensemble du dossier `dashboard-comptabilite-ci/`.

---

## Notes contexte ivoirien

- **Devise** : FCFA (affichage avec séparateur d'espace : `1 500 000 FCFA`)
- **Format date** : JJ/MM/AAAA
- **Langue** : Français
- **Catégories** adaptées à l'économie locale (matière première, transport, loyer, impôts...)

---

## Licence

Projet Relais IT — usage interne.
