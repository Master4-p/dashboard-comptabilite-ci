# Rapport de refactorisation structurale — Relais IT Dashboard Comptable

## 1. Fichiers modifiés

### Fichiers créés (15 nouveaux)

| # | Fichier | Description |
|---|---|---|
| 1 | `src/hooks/useScrollToTop.ts` | Hook de reset du scroll sur changement de route |
| 2 | `src/components/layout/PageHeader.tsx` | Composant réutilisable de titre de page avec breadcrumb et actions |
| 3 | `src/pages/ventes/VentesLayout.tsx` | Layout avec tabs pour la section Ventes |
| 4 | `src/pages/ventes/FacturesListPage.tsx` | Liste des factures (table + filtres + pagination) |
| 5 | `src/pages/ventes/ProformasListPage.tsx` | Liste des proformas |
| 6 | `src/pages/ventes/EncaissementsPage.tsx` | Paiements reçus (dérivés des factures soldées/acompte) |
| 7 | `src/pages/ventes/ClientsDirectoryPage.tsx` | Répertoire client dérivé des noms distincts |
| 8 | `src/pages/ventes/NouvelleFacturePage.tsx` | Éditeur full-page placeholder pour nouvelle facture |
| 9 | `src/pages/ventes/NouvelleProformaPage.tsx` | Éditeur full-page placeholder pour nouvelle proforma |
| 10 | `src/pages/achats/AchatsLayout.tsx` | Layout avec tabs pour la section Achats |
| 11 | `src/pages/achats/DepensesListPage.tsx` | Liste des dépenses directes |
| 12 | `src/pages/achats/FacturesFournisseursPage.tsx` | Liste des factures fournisseurs |
| 13 | `src/pages/achats/DecaissementsPage.tsx` | Paiements émis (dérivés des fournisseurs payés) |
| 14 | `src/pages/achats/FournisseursDirectoryPage.tsx` | Répertoire fournisseurs dérivé des noms distincts |
| 15 | `src/pages/achats/NouvelleDepensePage.tsx` | Éditeur full-page placeholder pour nouvelle dépense |

### Fichiers modifiés (7 fichiers)

| # | Fichier | Changements |
|---|---|---|
| 1 | `src/App.tsx` | Routes canoniques imbriquées avec VentesLayout/AchatsLayout, redirects backward-compatibles |
| 2 | `src/components/layout/Sidebar.tsx` | Simplifié de 12 items à 9 items de haut niveau, routes canoniques, active state dynamique |
| 3 | `src/components/layout/Header.tsx` | Suppression du brand block dupliqué, breadcrumb/titre déplacés vers les pages |
| 4 | `src/components/layout/AppLayout.tsx` | Ajout de `useScrollToTop()` pour reset automatique du scroll |
| 5 | `src/pages/Dashboard.tsx` | KPIs corrigés, layout compact, panneau d'ancienneté, graphique intégré, états vides honnêtes |
| 6 | `src/pages/TresoreriePage.tsx` | Transactions = mouvements de cash uniquement, filtrage des factures payées/fournisseurs payés |
| 7 | `src/pages/RapportsPage.tsx` | Labels corrigés, catégories mutuellement exclusives, proformas exclues des totaux |

### Fichiers conservés (données préservées)
- `src/pages/VentesPage.tsx` — conservé mais non utilisé (référence pour la logique métier)
- `src/pages/AchatsPage.tsx` — conservé mais non utilisé
- `src/context/ToastContext.tsx` — inchangé
- `src/components/ui/ToastContainer.tsx` — inchangé
- `backend/database.js` — inchangé
- `backend/routes/clients.js` — inchangé
- `backend/routes/fournisseurs.js` — inchangé
- `backend/server.js` — inchangé (endpoints `/stats/monthly` et `/activity` déjà ajoutés précédemment)
- `backend/data/comptabilite.db` — **inchangé, toutes les données préservées**

---

## 2. Route map avant et après

### Avant (routes plates → composants monolithiques)

```
/                          → Dashboard
/activite                  → ActivitePage
/alertes                   → AlertesPage
/proformas                 → VentesPage (monolithique, 4 tabs)
/clients                   → VentesPage (monolithique, 4 tabs)
/clients-list              → VentesPage (monolithique, 4 tabs)
/encaissements             → VentesPage (monolithique, 4 tabs)
/fournisseurs              → AchatsPage (monolithique, 4 tabs)
/factures-fournisseurs     → AchatsPage (monolithique, 4 tabs)
/fournisseurs-list         → AchatsPage (monolithique, 4 tabs)
/decaissements             → AchatsPage (monolithique, 4 tabs)
/tresorerie                → TresoreriePage
/documents                 → DocumentsPage
/rapports                  → RapportsPage
/parametres                → ParametresPage
```

**Problèmes :**
- 4 routes différentes pointent vers `VentesPage` (même composant)
- 4 routes différentes pointent vers `AchatsPage` (même composant)
- Le state `showForm` est partagé entre les tabs → formulaire reste ouvert au changement de tab
- Scroll position conservé entre les routes
- Pas de breadcrumb dynamique cohérent

### Après (routes canoniques imbriquées)

```
/                          → Dashboard
/activite                  → ActivitePage
/alertes                   → AlertesPage

/ventes/factures           → VentesLayout → FacturesListPage
/ventes/factures/nouvelle  → VentesLayout → NouvelleFacturePage
/ventes/proformas          → VentesLayout → ProformasListPage
/ventes/proformas/nouvelle → VentesLayout → NouvelleProformaPage
/ventes/clients            → VentesLayout → ClientsDirectoryPage
/ventes/encaissements       → VentesLayout → EncaissementsPage

/achats/depenses           → AchatsLayout → DepensesListPage
/achats/depenses/nouvelle  → AchatsLayout → NouvelleDepensePage
/achats/factures-fournisseurs → AchatsLayout → FacturesFournisseursPage
/achats/fournisseurs       → AchatsLayout → FournisseursDirectoryPage
/achats/decaissements      → AchatsLayout → DecaissementsPage

/tresorerie                → TresoreriePage
/documents                 → DocumentsPage
/rapports                  → RapportsPage
/parametres                → ParametresPage

# Redirects backward-compatibles
/clients → /ventes/factures
/clients-list → /ventes/clients
/proformas → /ventes/proformas
/encaissements → /ventes/encaissements
/fournisseurs → /achats/depenses
/fournisseurs-list → /achats/fournisseurs
/factures-fournisseurs → /achats/factures-fournisseurs
/decaissements → /achats/decaissements
```

**Architecture :**
- Chaque route a son propre composant dédié
- `VentesLayout` et `AchatsLayout` fournissent les tabs, l'Outlet rend le contenu
- La route est la source unique de vérité pour le tab actif
- `useScrollToTop()` dans AppLayout reset le scroll à chaque navigation

---

## 3. Cause racine du state leakage

**Problème identifié :** Le composant `VentesPage` (459 lignes) et `AchatsPage` (466 lignes) étaient des composants monolithiques qui géraient simultanément :
- 4 tabs avec le même state `activeTab`
- Un formulaire inline avec `showForm` boolean
- Des KPIs, filtres, tableaux, pagination
- Tout dans un seul composant

**Quand on naviguait** de `/clients` à `/encaissements`, React ne démontait pas le composant — il ne faisait que changer le `activeTab` via `useState`. Le formulaire (`showForm`) restait donc visible car c'était le même state partagé entre les tabs.

**Cause racine :** Le mapping route → composant était 1:N (plusieurs routes vers un seul composant). Le state React était scopé au composant, pas à la route. Le `useState('factures')` initialisait toujours le même state indépendamment de la route.

**Solution appliquée :**
1. **Routes dédiées** : chaque tab a sa propre route et son propre composant
2. **Layouts avec Outlet** : `VentesLayout` et `AchatsLayout` fournissent l'enveloppe (tabs), les pages enfants sont démontées/remontées par React Router
3. **`useScrollToTop()`** : reset scroll automatique sur changement de pathname
4. **Pas de state partagé** : chaque page est auto-contenue, pas de `showForm` global

---

## 4. Formules financières corrigées

### Dashboard — KPIs

| KPI | Avant | Après |
|---|---|---|
| Label | "Chiffre d'affaires facturé" | **"Factures émises"** |
| Formule | `solde + attente` | `solde + attente` (correct, inchangé) |
| Sous-label | "Total factures + proformas" | **"Total factures clients"** (proformas déjà exclues par le backend) |
| Label | "Encaissements" | **"Encaissements reçus"** |
| Formule | `solde` | `solde` (correct, inchangé) |
| Label | "Créances clients" | **"Créances clients"** (inchangé) |
| Formule | `attente` | `attente` (correct, inchangé) |
| Label | "Dépenses fournisseurs" | **"Dettes fournisseurs"** |
| Formule | `a_payer` | `a_payer` (correct, inchangé) |

### Dashboard — Cash Flow

| Avant | Après |
|---|---|
| Graphique séparé "Flux de trésorerie" + graphique "Solde net" | **Graphique unique** avec encaissements, décaissements, et ligne solde net intégrée |
| Données : `statsApi.monthly()` (déjà correct) | **État vide honnête** : "Aucun mouvement de trésorerie sur cette période" |

### Dashboard — Âge des créances (NOUVEAU)

| Catégorie | Calcul |
|---|---|
| Non échues | `factures non soldées avec date_emission ≤ aujourd'hui` |
| 1-30 jours | `factures non soldées avec 0 < jours ≤ 30` |
| 31-60 jours | `factures non soldées avec 30 < jours ≤ 60` |
| Plus de 60 j | `factures non soldées avec jours > 60` |
| Montant | `montant - montant_acompte` pour chaque facture (solde restant dû) |

### Trésorerie

| Avant | Après |
|---|---|
| Transactions = mélange de 10 clients + 10 fournisseurs (tous statuts) | **Mouvements de cash uniquement** : clients `statut === 'solde'` ou `'acompte'` ET fournisseurs `statut === 'payee'` ou `'acompte_verse'` |
| "Encaissements" = `clientStats.solde` (stats agrégées) | **Encaissements** = somme de `montant` (solde) + `montant_acompte` (acompte) sur toutes les factures payées |
| "Décaissements" = `fournisseurStats.paye` | **Décaissements** = somme de `montant` (payee) + `montant_acompte` (acompte_verse) sur tous les fournisseurs payés |

### Rapports

| Avant | Après |
|---|---|
| "Bénéfice net estimé" = `CA - a_payer` (ambigu) | **"Solde net de trésorerie"** = `solde - paye` (cash-based, explicite) |
| "Transactions" = montant FCFA (somme incohérente) | **"Nombre de factures"** = entier (`clients.filter(c => c.type === 'facture').length`) |
| Récapitulatif : 8 lignes avec double-comptage (créances + acomptes) | **7 lignes mutuellement exclusives** : factures payées, partiellement payées, non payées, en retard, proformas (hors %), dépenses payées, à payer |

---

## 5. Entités nouvelles ou refactorisées

### Entités créées (nouvelles pages)

| Entité | Page | Description |
|---|---|---|
| **Répertoire clients** | `ClientsDirectoryPage` | Dérivé des noms distincts dans `clients.client`. Affiche : nom, nombre de factures, total facturé, encaissé, encours, dernière activité. |
| **Répertoire fournisseurs** | `FournisseursDirectoryPage` | Dérivé des noms distincts dans `fournisseurs.fournisseur`. Affiche : nom, catégorie, dépenses, total, payé, restant, dernière activité. |
| **Encaissements** | `EncaissementsPage` | Paiements reçus dérivés des factures `solde`/`acompte`. Affiche : date, n°, client, montant facture, montant payé, reste. |
| **Décaissements** | `DecaissementsPage` | Paiements émis dérivés des fournisseurs `payee`/`acompte_verse`. Affiche : date, n°, fournisseur, montant total, payé, reste. |

### Entités refactorisées

| Avant | Après |
|---|---|
| `VentesPage` (monolithique, 459 lignes, 4 tabs + form inline) | 5 composants séparés : `VentesLayout`, `FacturesListPage`, `ProformasListPage`, `EncaissementsPage`, `ClientsDirectoryPage` |
| `AchatsPage` (monolithique, 466 lignes, 4 tabs + form inline) | 5 composants séparés : `AchatsLayout`, `DepensesListPage`, `FacturesFournisseursPage`, `DecaissementsPage`, `FournisseursDirectoryPage` |
| "Clients" tab = même table que les factures | **Clients** = répertoire distinct avec KPIs et actions par client |
| "Fournisseurs" tab = même table que les dépenses | **Fournisseurs** = répertoire distinct avec KPIs et actions par fournisseur |
| "Paiements" tab = formulaire de facture visible | **Encaissements/Décaissements** = table de paiements uniquement, aucun formulaire de document |

---

## 6. Nouveau workflow de création de documents

### Avant
- Bouton "Nouveau" sur la page Ventes → formulaire inline apparaît au-dessus de la table
- Le formulaire restait visible quand on changeait de tab
- Le formulaire gérait factures ET proformas dans le même composant

### Après
- Chaque page a un bouton **contextuel** : "+ Nouvelle facture" sur Factures, "+ Nouvelle proforma" sur Proformas, "+ Nouvelle dépense" sur Dépenses
- Le bouton navigue vers une **route dédiée** : `/ventes/factures/nouvelle`, `/ventes/proformas/nouvelle`, `/achats/depenses/nouvelle`
- La page d'édition est **full-page** (pas de formulaire inline)
- Le formulaire est **démonté** quand on quitte la route (state isolation)
- Le bouton global "Nouveau" dans le header ouvre un dropdown avec les 3 options principales

### Navigation
| Action | Route |
|---|---|
| Nouvelle facture | `/ventes/factures/nouvelle` |
| Nouvelle proforma | `/ventes/proformas/nouvelle` |
| Nouvelle dépense | `/achats/depenses/nouvelle` |

### Éditeurs placeholder (Phase 3 partielle)
- Les éditeurs full-page sont fonctionnels mais basiques (champs simples : client, numéro, date, montant, notes)
- **À venir** : ligne de détail, sélection client via combobox, calcul automatique des totaux, aperçu PDF

---

## 7. Redirects backward-compatibles ajoutés

```
/clients              → /ventes/factures
/clients-list         → /ventes/clients
/proformas            → /ventes/proformas
/encaissements        → /ventes/encaissements
/fournisseurs         → /achats/depenses
/fournisseurs-list    → /achats/fournisseurs
/factures-fournisseurs → /achats/factures-fournisseurs
/decaissements       → /achats/decaissements
```

- Toutes les anciennes URLs bookmarkées ou partagées redirigent automatiquement
- Les redirects sont des `Navigate` avec `replace` (pas d'entrée dans l'historique)
- React Router gère la transition de manière transparente

---

## 8. Vérifications responsive effectuées

### Sidebar
- Réduite de 12 items à 9 items de haut niveau → moins d'encombrement vertical
- Largeur étendue : 248px, réduite : 76px (toggle fonctionnel)
- Zone de nav avec `overflow-y-auto`, bottom block avec `shrink-0` (pas de chevauchement)
- Items : 44px de hauteur, 14px de police, lisibles sans troncature

### Header
- Suppression du brand block dupliqué → plus d'espace pour les contrôles
- Hauteur maintenue à ~76px
- Search : `min-w-[320px] max-w-2xl`
- Bouton "Nouveau" : 40px, avatar : 36px

### Tables
- Padding : 14px × 16px sur `th` et `td`
- Montants : `font-weight: 600`, `color: #1E293B`, monospace tabulaire, `text-align: right`, `white-space: nowrap`
- Hover : `background: #F8FAFC`
- Dernière ligne sans bordure
- Actions secondaires dans `ActionMenu` (•••), action primaire seule si nécessaire

### Points d'attention restants
- Le code-splitting (lazy loading) des pages pourrait améliorer le chunk size (actuellement ~1.3 MB)
- Les tableaux très larges peuvent encore nécessiter un scroll horizontal sur mobile < 768px — c'est acceptable avec un wrapper `overflow-x-auto`

---

## 9. Tests

- **Build TypeScript** : `tsc && vite build` — ✅ passe sans erreur (16.6s)
- **Tests unitaires** : non ajoutés (pas de suite de tests existante dans le projet)
- **Vérification manuelle** :
  - Navigation sidebar → chaque item ouvre la bonne page
  - Tabs Ventes → chaque tab correspond à l'URL
  - Refresh → la page correcte est restaurée
  - Back/Forward → fonctionne correctement
  - Scroll → reset automatique
  - Formulaire → non visible après navigation

---

## 10. Confirmation de préservation des données

### Base de données SQLite
- **Chemin** : `backend/data/comptabilite.db`
- **État** : **INCHANGÉ** — aucune modification du schéma, aucune suppression de données
- **Tables** : `clients` et `fournisseurs` intactes
- **Données** : toutes les factures, proformas, dépenses, factures fournisseurs, pièces jointes, numéros, historiques sont préservés

### Backend
- `backend/routes/clients.js` — inchangé
- `backend/routes/fournisseurs.js` — inchangé
- `backend/routes/uploads.js` — inchangé
- `backend/server.js` — inchangé (endpoints `/stats/monthly` et `/activity` ajoutés en session précédente, conservés)
- `backend/database.js` — inchangé

### Pièces jointes
- Tous les fichiers uploadés dans le dossier `backend/uploads/` sont conservés
- Les liens `/uploads/{filename}` fonctionnent toujours

### Numérotation
- L'historique des numéros de factures (`numero` UNIQUE) est préservé
- Les proformas conservent leur numérotation
- Aucun conflit de numérotation introduit

---

## Résumé des phases

| Phase | Objectif | Statut |
|---|---|---|
| Phase 1 | Routing et isolation d'état | ✅ Complet |
| Phase 2 | Séparation des entités | ✅ Complet |
| Phase 3 | Éditeur de documents | ✅ Placeholders fonctionnels (éditeurs full-page basiques) |
| Phase 4 | Calculs financiers | ✅ Complet (Dashboard, Trésorerie, Rapports) |
| Phase 5 | Dashboard optimisé | ✅ Complet (KPIs compactes, âge des créances, états vides honnêtes) |
| Phase 6 | Polish responsive | ✅ Partiel (sidebar, header, tables améliorés) |

## Éléments non implémentés (recommandations pour la suite)

1. **Éditeur de documents avancé** : ligne de détail avec description/quantité/prix unitaire/total, calcul automatique, aperçu PDF avant envoi
2. **Table clients/fournisseurs dédiée** : actuellement dérivée des champs texte — une vraie table `customers` et `suppliers` avec relations permettrait des fonctionnalités avancées (fiche client, historique complet, etc.)
3. **Table payments dédiée** : actuellement les paiements sont dérivés du statut — une table `payments` avec date, méthode, référence permettrait une trésorerie précise
4. **Code-splitting** : lazy loading des pages pour réduire le chunk size (~1.3 MB actuellement)
5. **Tests automatisés** : Jest + Testing Library pour les composants et les calculs financiers
