# Plan de refactorisation structurale — Relais IT Dashboard Comptable

## Phase 0 — Audit (TERMINÉ)

**État actuel identifié :**

| Problème | Cause racine | Impact |
|---|---|---|
| Routes plates `/clients`, `/proformas` → `VentesPage` | Toutes les routes pointent vers le même composant | Forme reste visible, tabs mal synchronisés |
| `showForm` state local à `VentesPage` | State partagé entre tabs | Formulaire reste ouvert quand on change de tab |
| Pas de scroll reset | Comportement natif du navigateur | Page destination s'ouvre à mi-hauteur |
| Clients = invoice table | `client` est un champ texte dans `clients` table | Pas de répertoire client réel |
| Inline form au-dessus de la liste | `showForm` boolean + `AnimatePresence` | Page très longue, mauvaise UX |
| Dashboard CA = solde + attente | `solde` = payé, `attente` = en attente | CA inclut factures payées (double-compte) |
| Pas de table `payments` | Paiements = changement de statut | Pas de trésorerie réelle |
| Sidebar 12 items + header brand | Duplication branding + navigation | Écran encombré |
| Tableaux identiques pour toutes les entités | Même tableau réutilisé | Colonnes non pertinentes |
| BreadcrumbMap statique | Pas de synchronisation dynamique | Titre et breadcrumb désynchronisés |

**Tables backend :**
- `clients` : id, type, numero, client(text), montant, date_emission, date_relance, statut, montant_acompte, notes, pj_filename, pj_path, created_at, updated_at
- `fournisseurs` : id, type, numero, fournisseur(text), categorie, montant, date_depense, date_echeance, statut, montant_acompte, notes, pj_filename, pj_path, created_at, updated_at

**Routes actuelles :**
```
/ → Dashboard
/activite → ActivitePage
/alertes → AlertesPage
/proformas → VentesPage
/clients → VentesPage
/clients-list → VentesPage
/encaissements → VentesPage
/fournisseurs → AchatsPage
/fournisseurs-list → AchatsPage
/factures-fournisseurs → AchatsPage
/decaissements → AchatsPage
/tresorerie → TresoreriePage
/documents → DocumentsPage
/rapports → RapportsPage
/parametres → ParametresPage
```

## Phase 1 — Routing et isolation d'état (CRITIQUE)

**Objectifs :**
- Routes canoniques avec structure hiérarchique
- Route = source unique de vérité pour le tab actif
- Form state isolé au niveau de la route (pas de state partagé entre tabs)
- Scroll reset automatique sur navigation
- Breadcrumb/titre/sidebar/tab toujours synchronisés
- Redirects backward-compatibles

**Routes cibles :**
```
/                           → Dashboard
/activite                   → ActivitePage
/alertes                    → AlertesPage
/ventes/factures            → FacturesListPage
/ventes/proformas           → ProformasListPage
/ventes/clients             → ClientsDirectoryPage
/ventes/encaissements       → EncaissementsPage
/achats/depenses            → DepensesListPage
/achats/factures-fournisseurs → FacturesFournisseursPage
/achats/fournisseurs        → FournisseursDirectoryPage
/achats/decaissements       → DecaissementsPage
/tresorerie                 → TresoreriePage
/documents                  → DocumentsPage
/rapports                   → RapportsPage
/parametres                 → ParametresPage

/ventes/factures/nouvelle   → NouvelleFacturePage (placeholder)
/ventes/proformas/nouvelle  → NouvelleProformaPage (placeholder)
/achats/depenses/nouvelle   → NouvelleDepensePage (placeholder)

Redirects (backward-compat) :
/clients → /ventes/factures
/clients-list → /ventes/clients
/proformas → /ventes/proformas
/encaissements → /ventes/encaissements
/fournisseurs → /achats/depenses
/fournisseurs-list → /achats/fournisseurs
/factures-fournisseurs → /achats/factures-fournisseurs
/decaissements → /achats/decaissements
```

**Fichiers à créer/modifier :**
1. `src/App.tsx` — nouvelle structure de routes avec `Outlet` imbriqué
2. `src/components/layout/Sidebar.tsx` — routes canoniques, suppression de la duplication de branding dans le header
3. `src/components/layout/Header.tsx` — suppression du brand block, breadcrumb dynamique, titre de page déplacé dans le contenu
4. `src/components/layout/AppLayout.tsx` — scroll reset sur changement de route
5. `src/components/layout/PageHeader.tsx` — composant réutilisable pour le titre de page, breadcrumb, actions
6. `src/hooks/useScrollToTop.ts` — hook pour scroll reset

**Pages à créer (Phase 1) :**
- `src/pages/ventes/FacturesListPage.tsx` — liste des factures (extrait de VentesPage)
- `src/pages/ventes/ProformasListPage.tsx` — liste des proformas (extrait de VentesPage)
- `src/pages/ventes/EncaissementsPage.tsx` — page de paiements (placeholder fonctionnel)
- `src/pages/ventes/ClientsDirectoryPage.tsx` — répertoire client (dérivé des noms distincts)
- `src/pages/achats/DepensesListPage.tsx` — liste des dépenses (extrait de AchatsPage)
- `src/pages/achats/FacturesFournisseursPage.tsx` — liste des factures fournisseurs
- `src/pages/achats/DecaissementsPage.tsx` — page de décaissements (placeholder)
- `src/pages/achats/FournisseursDirectoryPage.tsx` — répertoire fournisseurs
- `src/pages/ventes/NouvelleFacturePage.tsx` — placeholder pour éditeur de facture
- `src/pages/ventes/NouvelleProformaPage.tsx` — placeholder pour éditeur de proforma
- `src/pages/achats/NouvelleDepensePage.tsx` — placeholder pour éditeur de dépense

## Phase 2 — Séparation des entités

**Objectifs :**
- Clients page = répertoire de clients, pas de factures
- Fournisseurs page = répertoire de fournisseurs
- Encaissements page = paiements reçus, pas formulaire de facture
- Décaissements page = paiements émis

**Implémentation :**
- ClientsDirectoryPage : dériver les clients distincts depuis `clientsApi.list()` en regroupant par `client` (nom texte)
- Pour chaque client : nombre de factures, total facturé, total encaissé, encours, dernière activité
- FournisseursDirectoryPage : même logique avec `fournisseursApi.list()`
- EncaissementsPage : afficher les factures avec statut `solde` ou `acompte` comme paiements reçus
- DécaissementsPage : afficher les fournisseurs avec statut `payee` ou `acompte_verse` comme paiements émis

## Phase 3 — Calculs financiers

**Objectifs :**
- CA facturé = factures uniquement (pas proformas)
- Encaissements = paiements réels uniquement (pas factures envoyées)
- Créances = solde restant des factures non payées
- Dépenses = factures fournisseurs + dépenses
- Trésorerie = mouvements de cash uniquement

**Modifications :**
- Dashboard : 4 KPIs corrigés (Factures émises, Encaissements reçus, Créances clients, Dettes fournisseurs)
- Retirer le graphique "Solde net" séparé — l'intégrer dans le cash flow
- TrésoreriePage : basé sur les factures soldées et fournisseurs payés (pas sur les factures envoyées)
- RapportsPage : corriger les doubles comptes et les labels ambigus

## Phase 4 — Éditeur de documents (full-page)

**Objectifs :**
- Routes dédiées pour la création de documents
- Formulaire full-page, pas inline
- Client sélectionnable depuis une liste dérivée
- Numérotation automatique avec préfixe (FA-, PF-)

**Implémentation :**
- NouvelleFacturePage : formulaire full-page, préfixe FA-YYYY-XXX
- NouvelleProformaPage : formulaire full-page, préfixe PF-YYYY-XXX
- Génération du numéro suivant via l'API backend
- Sélection client via combobox dérivé des clients distincts

## Phase 5 — Dashboard optimisé

**Objectifs :**
- Layout compact orienté décision
- Graphique cash flow avec données réelles
- Panel d'âge des créances
- Factures à relancer
- Activité récente
- Actions rapides

## Phase 6 — Polish responsive

**Objectifs :**
- Pas de scroll horizontal à 1920px, 1440px, 1280px, 1024px
- Largeurs de colonnes compactes
- Actions secondaires dans menu •••
- Montants alignés à droite avec nowrap
- Cards cohérentes

## Order d'implémentation (phasé)

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Chaque phase doit compiler (build sans erreur TypeScript) avant de passer à la suivante.
