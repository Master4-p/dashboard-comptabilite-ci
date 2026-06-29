# Relais IT — Design System

## Brand Identity

- **Brand**: Relais IT
- **Primary**: #173B6C (dark navy blue)
- **Interaction**: #2563EB (modern royal blue)
- **Accent**: #F59E0B (Relais IT orange)
- **Success**: #059669 (paid / positive)
- **Warning**: #D97706 (attention)
- **Danger**: #DC2626 (overdue / critical / destructive)
- **Neutral**: #F5F7FB (background), #FFFFFF (surface), #E2E8F0 (border)
- **Text Primary**: #111827
- **Text Secondary**: #64748B
- **Font**: "Century Gothic", "Segoe UI", system-ui, -apple-system, sans-serif
- **Radius**: cards 14px, buttons 10px, controls 8px
- **Spacing**: desktop 24–32px, mobile 16px
- **Shadow**: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)
- **Control height**: 44–48px

## Layout

### App Shell
- Fixed top header: 76px height
- Sidebar: 248px expanded, 76px collapsed, drawer on mobile
- Content: padding 32px desktop, 24px tablet, 16px mobile
- Background: #F5F7FB
- Surface: #FFFFFF
- No page-level horizontal overflow
- Only tables scroll horizontally inside their container

### Header
- Left: hamburger toggle, breadcrumb, page title, subtitle
- Center: global search (CommandSearch), placeholder "Rechercher une facture, un client ou un fournisseur…", Ctrl+K shortcut
- Right: period selector, "Nouveau" split button, notifications with badge, avatar dropdown, light/dark toggle
- Sticky, white/translucent, subtle backdrop blur, bottom border #E2E8F0

### Sidebar
- Groups: Pilotage, Ventes, Achats, Gestion
- Icons centered when collapsed
- Active state: navy background with white text, or navy left border + navy text
- Bottom: user avatar
- No large empty white rail when collapsed

## Navigation Structure

### Pilotage
- Vue d'ensemble (/)
- Activité
- Alertes

### Ventes
- Proformas
- Factures clients (/clients)
- Clients
- Encaissements

### Achats
- Dépenses (/fournisseurs)
- Factures fournisseurs
- Fournisseurs
- Décaissements

### Gestion
- Trésorerie
- Documents
- Rapports
- Paramètres

## Components

### KpiCard
- White surface, 14px radius, subtle shadow, 1px border #E2E8F0
- Top: label (small, secondary text)
- Middle: main amount (large, bold, primary text)
- Bottom: comparison/ratio (small, secondary text) + compact icon/micro-chart
- Neutral border, no heavy colors unless specific semantic need
- Restrained semantic color usage

### StatusBadge
- Small rounded badge with pastel background
- Client: envoye (blue), relance (amber), acompte (indigo), solde (green)
- Supplier: impayee (red), acompte_verse (indigo), payee (green)
- Use subtle borders, not heavy fills

### DataTable
- White surface, 14px radius, subtle shadow
- Header: sticky, gray background, uppercase, small text
- Rows: hover state, clickable
- Columns: invoice number as link, amounts right-aligned, status badge, due-date state, attachment indicator
- Overflow menu (3 dots) for actions instead of permanent buttons
- Pagination at bottom
- Multiselect when useful
- Column visibility support
- Responsive: hide lower-priority columns on smaller screens
- Touch targets >= 40px

### CommandSearch
- Global search bar in header
- Placeholder: "Rechercher une facture, un client ou un fournisseur…"
- Ctrl+K shortcut
- Support invoice number, proforma number, client, supplier, amount, status
- Dropdown results with keyboard navigation

### ActionMenu (Overflow)
- 3 dots icon on table rows
- Items: Voir, Modifier, Télécharger le PDF, Enregistrer un acompte, Marquer comme payée, Envoyer une relance, Dupliquer, Supprimer
- Tooltips on icon-only buttons

### EmptyState
- Concise title
- Explanatory text
- Primary action button (e.g. "Ajouter une dépense")
- Secondary action button (e.g. "Importer un justificatif")
- No oversized blank table area
- Centered, compact, not overly decorative

### FilterBar
- One flexible search field
- Status filter dropdown
- Document type filter dropdown
- Date period filter
- Advanced filters button
- Compact, single row where possible, wraps on mobile

### NouveauButton (Split Button)
- Primary navy button with dropdown arrow
- Dropdown items: Nouvelle proforma, Nouvelle facture client, Nouvelle dépense, Nouveau paiement, Nouveau client, Nouveau fournisseur

## Pages

### Dashboard (Vue d'ensemble)
- 4 primary KPI cards: Chiffre d'affaires facturé, Encaissements, Créances clients, Dépenses fournisseurs
- Cash-flow chart (receipts, expenses, net balance)
- Invoice status distribution
- Invoices requiring attention (compact list, not oversized)
- Recent activity timeline
- Quick actions (compact buttons)
- Alerts panel: compact, if no alerts show small success state

### Ventes (Clients)
- Tabs: Proformas, Factures, Paiements, Clients
- Summary cards above table: total facturé, total encaissé, montant restant, factures en retard
- Filter bar: search, status, type, date period, advanced filters
- Table with overflow menu, pagination, multiselect
- Empty state with primary and secondary actions

### Achats et dépenses (Fournisseurs)
- Tabs: Dépenses, Factures fournisseurs, Paiements, Fournisseurs
- Summary cards: dépenses du mois, montant payé, restant à payer, prochaines échéances
- Filter bar
- Table with overflow menu
- Empty state with primary and secondary actions

## Responsive

- 4 KPI columns: large desktop
- 2 KPI columns: tablet
- 1 KPI column: mobile
- Sidebar: drawer below ~1024px
- Header actions: overflow menu on small screens
- Tables: horizontal scroll inside container only, hide lower-priority columns progressively
- Touch targets: 40-44px minimum
- Consistent padding: 32px desktop, 24px tablet, 16px mobile

## Quality

- No fake data unless demo data already exists
- No regression in calculations or persistence
- No action button clipped outside viewport
- No inaccessible low-contrast text
- Keyboard navigation for menus, filters, dialogs, command search
- Tooltips on icon-only buttons
- Preserve French labels and FCFA formatting
- Consistent loading, empty, success, error, confirmation states
- Loading: skeleton placeholders, not spinners
- Empty: concise title + explanatory text + primary action + secondary action
- Error: inline messages with retry option
- Confirmation: modal dialog with clear primary/secondary buttons
