# PRD — dashboard-comptabilite-ci (Relais IT)

## Problem statement (verbatim)
> We need you to take over the project `dashboard-comptabilite-ci` from GitHub and fix unresolved UI/UX issues that were not correctly handled by the previous agent.
> [Repo: https://github.com/Master4-p/dashboard-comptabilite-ci — Heroku prod: https://relais-it-dashboard-4d0222341436.herokuapp.com/]
> Objective: fix tables overflow, action menus clipped, forms cramped, tabs jumping, weak page hierarchy, button inconsistencies, weak empty states, layout/scroll issues — without rebuilding the app, without breaking backend logic, without changing Relais IT branding.

## Architecture
- **Frontend** : React 18 + Vite 5 + TypeScript + Tailwind 3 + framer-motion + lucide-react + recharts. Single-page app, React Router 6.
- **Backend** : Express 4 + SQLite3 (better-sqlite3 / sqlite3) + multer + cors. All routes under `/api/*`. The Express server also serves the Vite-built `frontend/dist` for production.
- **Deploy** : Heroku. `npm run heroku-postbuild` builds the frontend and installs the backend; `npm start` runs `node backend/server.js` on the Heroku-provided `$PORT`.

## User personas
- Comptable Relais IT (PME Côte d'Ivoire) qui gère factures clients, proformas, factures fournisseurs, dépenses, encaissements, décaissements.
- Direction qui consulte les KPI, l'activité, les alertes.

## Core requirements (static)
- Conserver le branding Relais IT (couleur navy `#173B6C`, logo, libellés FR).
- Aucune modification de la logique métier backend ni des routes API.
- Aucun changement de schéma SQLite.
- L'app doit builder et se déployer sur Heroku sans intervention.

## What's been implemented (iteration 30 juin 2026 — UI/UX overhaul)
- **CSS partagé (`src/index.css`) entièrement réécrit** : `.data-table` passe en `table-layout: auto`, suppression du `white-space: nowrap` global sur `td`, ajout des classes utilitaires `nowrap` / `truncate-cell` / `amount` / `date-cell` / `badge-cell`, suppression de `overflow: hidden` sur le conteneur table, ajout de `.glass-panel` (qui était manquant) et `.form-section` / `.form-section-title` / `.form-section-subtitle`. Tabs et boutons restylés (height 40, padding consistant).
- **`ActionMenu` portalisé** : utilise désormais `createPortal(document.body)` + `position: fixed` + calcul de position clampé au viewport (top/bottom placement automatique) + fermeture automatique sur scroll capture / resize / Escape / clic extérieur. Plus jamais clippé par un parent `overflow:auto/hidden`.
- **`PageHeader` et `EmptyState`** : strip automatique du `+ ` en début de libellé pour éviter le double-plus, data-testids consistants.
- **`AppLayout`** : header passé à 64px, sidebar à 232/72px, `marginLeft` proprement appliqué sur `main`.
- **`AchatsLayout` / `VentesLayout`** : tabs masqués sur les routes `/nouvelle` et `/modifier` (`isFormView` regex), slugs ASCII sans accents (`achats-tab-depenses`, `achats-tab-decaissements`, …), `aria-selected` sur l'onglet actif, layout `max-w-[1400px] mx-auto`.
- **Toutes les pages listes (8)** : suppression des `w-XX` Tailwind sur les `<th>`, ajout de classes sémantiques, suppression du `overflow-hidden` sur le `card`. Réduction du nombre de colonnes là où c'était nécessaire :
  - `FacturesListPage` : 10 → 7 colonnes (PJ devient icône dans N°, Acompte fusionné sous Reste, Relance fusionnée sous Émission).
  - `ProformasListPage` : 10 → 7 colonnes (idem).
  - `ClientsDirectoryPage` : 10 → 8 colonnes (Contact regroupe nom+téléphone+email, suppression de la colonne Payé).
  - `DepensesListPage` / `FacturesFournisseursPage` / `FournisseursDirectoryPage` / `DecaissementsPage` / `EncaissementsPage` : gardent leurs colonnes mais en `table-layout:auto` + `nowrap`/`amount` appropriés.
- **Formulaires** :
  - `NouvelleFacturePage` & `NouvelleProformaPage` : réorganisés en 4 sections claires (`Informations`, `Client`, `Lignes de facture/proforma`, `Notes & pièce jointe`) + sticky totals bar reconstruite, suppression du `min-w-[900px]` sur la table des lignes, suppression du `max-w-[1200px] px-6 py-6` redondant.
  - `NouvelleDepensePage` : réécrit en 4 sections (`Document`, `Fournisseur`, `Montant & dates`, `Notes`) avec icônes — `glass-panel` est désormais correctement défini.
- **KPI cards** : `data-testid="kpi-card"` ajouté.
- **react-is** installé (dépendance peer de recharts qui faisait échouer le build).

## Validation (juin 2026)
- ✅ `tsc --noEmit` passe.
- ✅ `npm run build` passe (vite + tsc).
- ✅ Backend Express + frontend `dist` testé localement sur `http://localhost:3001` — toutes les pages se chargent.
- ✅ Testing agent (iteration_1.json) : 95% de réussite, 12/13 critères acceptance fully pass. Tous les critères CRITIQUES sont verts :
  - Aucun scroll horizontal global aux viewports 1440x900 et 1280x800.
  - ActionMenu portal jamais clippé, ferme sur scroll/resize/Escape/clic extérieur.
  - Tabs masqués sur les routes de création/édition.
  - Aucun double `+ +` détecté sur 11 routes.
  - Sticky totals bar correctement présent sur les pages de création.
  - EmptyState clean sur `/achats/depenses`.
  - Headers et colonnes des tables conformes (factures: 7, clients: 8, etc.).
- ✅ Issues remontées par le testing agent corrigées (KPI testid, slugs ASCII, aria-selected).

## Backlog / Future
- **P1** — Remplacer les `<input type="date">` natifs par un composant date picker localisé FR (dd/MM/yyyy) pour l'uniformité.
- **P2** — Code-splitting du bundle (actuellement 1.3 MB unsplit, gzip 397 KB).
- **P2** — Drawer/édit modal pour `/achats/depenses/Voir` et `Modifier` (actuellement no-op).
- **P2** — Drawer/édit modal pour `/ventes/encaissements` (édition d'un paiement existant).
- **P3** — Authentification réelle backend (actuellement l'`AuthContext` est mocké).
- **P3** — Recherche globale fonctionnelle dans le header (actuellement `readOnly`).

## Files modified (this iteration)
- `frontend/src/index.css` (rewrite complet)
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/PageHeader.tsx` (rewrite)
- `frontend/src/components/ui/ActionMenu.tsx` (rewrite)
- `frontend/src/components/ui/EmptyState.tsx` (rewrite)
- `frontend/src/components/ui/KpiCard.tsx`
- `frontend/src/pages/achats/AchatsLayout.tsx` (rewrite)
- `frontend/src/pages/ventes/VentesLayout.tsx` (rewrite)
- `frontend/src/pages/achats/DepensesListPage.tsx`
- `frontend/src/pages/achats/FacturesFournisseursPage.tsx`
- `frontend/src/pages/achats/FournisseursDirectoryPage.tsx`
- `frontend/src/pages/achats/DecaissementsPage.tsx`
- `frontend/src/pages/achats/NouvelleDepensePage.tsx` (rewrite)
- `frontend/src/pages/ventes/FacturesListPage.tsx`
- `frontend/src/pages/ventes/ProformasListPage.tsx`
- `frontend/src/pages/ventes/ClientsDirectoryPage.tsx`
- `frontend/src/pages/ventes/EncaissementsPage.tsx`
- `frontend/src/pages/ventes/NouvelleFacturePage.tsx`
- `frontend/src/pages/ventes/NouvelleProformaPage.tsx`
- `frontend/package.json` (ajout `react-is`)
- `frontend/package-lock.json`
