# Dashboard Comptabilité Côte d'Ivoire — AGENT SPEC

## Contexte
Application comptable pour un utilisateur en Côte d'Ivoire. Devise : FCFA. Format date : JJ/MM/AAAA. Langue : français.

## Architecture

### Backend (Node.js + Express + SQLite3 + Multer)
- Port: 3001
- Base de données: SQLite fichier `data/comptabilite.db`
- Uploads: fichiers physiques dans `uploads/` (max 10 Mo)
- CORS: activé pour le frontend (port 5173 en dev, 3001 en prod)
- L'API sert aussi le frontend buildé en production (`../frontend/dist`)

### Frontend (React + TypeScript + Vite + Tailwind CSS + shadcn/ui)
- Port dev: 5173
- Build: `frontend/dist/`
- Routing: React Router DOM
- HTTP client: Axios
- Format date: `date-fns` avec locale fr
- Icons: `lucide-react`

## Base de données

### Table `clients` (factures & proformas)
- id INTEGER PRIMARY KEY AUTOINCREMENT
- type TEXT CHECK(type IN ('facture', 'proforma'))
- numero TEXT UNIQUE NOT NULL
- client TEXT NOT NULL
- montant INTEGER NOT NULL (en centimes, mais API renvoie en FCFA)
- date_emission TEXT (YYYY-MM-DD)
- date_relance TEXT (YYYY-MM-DD, nullable)
- statut TEXT CHECK(statut IN ('envoye', 'relance', 'acompte', 'solde'))
- montant_acompte INTEGER DEFAULT 0
- notes TEXT
- pj_filename TEXT (nom du fichier uploadé)
- pj_path TEXT (chemin relatif)
- created_at TEXT DEFAULT CURRENT_TIMESTAMP
- updated_at TEXT DEFAULT CURRENT_TIMESTAMP

### Table `fournisseurs` (dépenses & factures fournisseur)
- id INTEGER PRIMARY KEY AUTOINCREMENT
- type TEXT CHECK(type IN ('facture_fournisseur', 'depense'))
- numero TEXT
- fournisseur TEXT NOT NULL
- categorie TEXT
- montant INTEGER NOT NULL
- date_depense TEXT (YYYY-MM-DD)
- date_echeance TEXT (YYYY-MM-DD, nullable)
- statut TEXT CHECK(statut IN ('impayee', 'acompte_verse', 'payee'))
- montant_acompte INTEGER DEFAULT 0
- notes TEXT
- pj_filename TEXT
- pj_path TEXT
- created_at TEXT DEFAULT CURRENT_TIMESTAMP
- updated_at TEXT DEFAULT CURRENT_TIMESTAMP

## API Routes

### Clients
- GET /api/clients — lister (avec query params: search, statut, type)
- POST /api/clients — créer
- PUT /api/clients/:id — modifier
- DELETE /api/clients/:id — supprimer
- PATCH /api/clients/:id/statut — changer statut (body: { statut, montant_acompte? })
- GET /api/clients/stats — stats globales clients

### Fournisseurs
- GET /api/fournisseurs — lister (avec query params)
- POST /api/fournisseurs — créer
- PUT /api/fournisseurs/:id — modifier
- DELETE /api/fournisseurs/:id — supprimer
- PATCH /api/fournisseurs/:id/statut — changer statut
- GET /api/fournisseurs/stats — stats globales fournisseurs

### Uploads
- POST /api/upload — upload multipart/form-data, renvoie { filename, path, url }
- GET /api/uploads/:filename — download fichier

### Export
- GET /api/export/clients — CSV clients
- GET /api/export/fournisseurs — CSV fournisseurs

## Frontend Pages

### Dashboard (/)
- Stats cards (en attente, encaissé, acomptes, relances, dépenses à payer, proformas)
- Alertes (factures à relancer, échéances fournisseurs dépassées)
- Graphique simple (entrées/sorties par mois) — optionnel

### Clients (/clients)
- Onglet factures / proformas
- Formulaire d'ajout/modification
- Tableau avec filtres, tri, actions
- Upload pièce jointe
- Boutons rapides : Relancer, Solder
- Export CSV

### Fournisseurs (/fournisseurs)
- Formulaire d'ajout/modification
- Tableau avec filtres, tri, actions
- Catégories prédéfinies
- Upload pièce jointe
- Bouton rapide : Payer
- Export CSV

## Contexte Ivoirien
- Tous les montants affichés en FCFA (séparateur de milliers : espace)
- Format date: JJ/MM/AAAA
- Catégories fournisseurs: Matière première, Fourniture bureau, Transport, Loyer/Local, Services, Marketing, Équipement, Salaires, Impôts/Taxes, Divers
- Statuts clients: Envoyé, Relancé, Acompte reçu, Soldé
- Statuts fournisseurs: Impayée, Acompte versé, Payée
- Alertes: > 30 jours = urgence, date de relance atteinte = alerte

## Worker Assignments
- **Backend worker** : tout sous `backend/` (Node.js, Express, SQLite, API routes, uploads)
- **Frontend worker** : tout sous `frontend/` (React + Vite + Tailwind, pages, components, API calls)
- **Main agent** : spec, integration, tests, README

## Validation
- Backend: `npm install && node server.js` (should start on 3001)
- Frontend: `npm install && npm run dev` (should start on 5173)
- End-to-end: create a client invoice, upload a file, check stats
