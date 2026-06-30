import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Filter, XCircle, ChevronLeft, ChevronRight,
  Edit2, CreditCard, CheckCircle, Copy, Trash2, Eye, Truck
} from 'lucide-react';
import { fournisseursApi, exportFournisseurs, type FournisseurItem } from '../../lib/api';
import { exportExpensePDF } from '../../lib/exportPDF';
import { formatFCFA, formatDate, categorieLabels } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionMenu from '../../components/ui/ActionMenu';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

const ITEMS_PER_PAGE = 10;

const CATEGORIES = [
  { value: 'matiere_premiere', label: 'Matière première' },
  { value: 'fourniture', label: 'Fourniture bureau' },
  { value: 'transport', label: 'Transport' },
  { value: 'loyer', label: 'Loyer / Local' },
  { value: 'services', label: 'Services' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'salaire', label: 'Salaires' },
  { value: 'impots', label: 'Impôts / Taxes' },
  { value: 'divers', label: 'Divers' },
];

export default function DepensesListPage() {
  useScrollToTop();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [items, setItems] = useState<FournisseurItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fournisseursApi.list({});
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des dépenses.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    let result = items.filter((i) => i.type === 'depense');

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.fournisseur.toLowerCase().includes(q) ||
          (i.numero && i.numero.toLowerCase().includes(q))
      );
    }

    if (filterStatut) {
      result = result.filter((i) => i.statut === filterStatut);
    }

    if (filterCategorie) {
      result = result.filter((i) => i.categorie === filterCategorie);
    }

    return result;
  }, [items, search, filterStatut, filterCategorie]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    return filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const hasActiveFilters = search || filterStatut || filterCategorie;

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await fournisseursApi.remove(id);
      fetchItems();
      addToast('success', 'Dépense supprimée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la suppression.');
    }
  }, [fetchItems, addToast]);

  const handleChangeStatut = useCallback(async (id: number, statut: string) => {
    try {
      const item = items.find((i) => i.id === id);
      const ma = statut === 'payee' ? item?.montant : item?.montant_acompte;
      await fournisseursApi.changeStatut(id, statut, ma);
      fetchItems();
      addToast('success', 'Statut mis à jour.');
    } catch (e) {
      addToast('error', 'Erreur lors de la mise à jour du statut.');
    }
  }, [items, fetchItems, addToast]);

  const handleExport = useCallback(() => {
    addToast('info', 'Export CSV en cours...');
    exportFournisseurs();
  }, [addToast]);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Achats', to: '/achats/depenses' },
          { label: 'Dépenses' },
        ]}
        title="Dépenses"
        subtitle="Gérez vos dépenses directes."
        primaryAction={{ label: 'Nouvelle dépense', to: '/achats/depenses/nouvelle' }}
        secondaryAction={{ label: 'Exporter', onClick: handleExport }}
      />

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-field">
          <input
            className="form-input"
            placeholder="Rechercher fournisseur ou n°..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="form-select w-40 text-sm"
            value={filterStatut}
            onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tous statuts</option>
            <option value="impayee">Impayée</option>
            <option value="acompte_verse">Acompte</option>
            <option value="payee">Payée</option>
          </select>
          <select
            className="form-select w-48 text-sm"
            value={filterCategorie}
            onChange={(e) => { setFilterCategorie(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatut('');
                setFilterCategorie('');
                setCurrentPage(1);
              }}
              className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500"
              title="Effacer les filtres"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {paginatedItems.length === 0 && !loading ? (
        <div className="card p-8">
          <EmptyState
            title="Aucune dépense"
            text="Commencez par créer une nouvelle dépense."
            primaryAction={{
              label: 'Ajouter une dépense',
              onClick: () => navigate('/achats/depenses/nouvelle'),
            }}
            icon={<Truck className="w-8 h-8" />}
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-24">N°</th>
                  <th className="w-48">Fournisseur</th>
                  <th className="w-32">Catégorie</th>
                  <th className="w-28 text-right">Montant</th>
                  <th className="w-28">Échéance</th>
                  <th className="w-28">Statut</th>
                  <th className="w-28 text-right">Reste</th>
                  <th className="w-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Chargement...
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const reste = item.montant - item.montant_acompte;
                    const echeanceAtteinte =
                      item.date_echeance &&
                      new Date(item.date_echeance) <= new Date() &&
                      item.statut !== 'payee';
                    return (
                      <tr key={item.id} className={echeanceAtteinte ? 'urgent' : ''}>
                        <td className="font-mono text-xs text-[#2563EB] link-cell">
                          {item.numero || <span className="text-[#CBD5E1]">—</span>}
                        </td>
                        <td className="font-medium text-sm text-[#111827]">{item.fournisseur}</td>
                        <td className="text-xs text-[#64748B]">
                          {item.categorie ? categorieLabels[item.categorie] || item.categorie : <span className="text-[#CBD5E1]">—</span>}
                        </td>
                        <td className="text-right font-semibold font-mono text-sm">
                          {formatFCFA(item.montant)}
                        </td>
                        <td>
                          {item.date_echeance ? (
                            <span
                              className={`text-xs font-semibold ${
                                echeanceAtteinte ? 'text-[#DC2626]' : ''
                              }`}
                            >
                              {formatDate(item.date_echeance)}
                            </span>
                          ) : (
                            <span className="text-[#CBD5E1]">—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge statut={item.statut} type="fournisseur" />
                        </td>
                        <td
                          className={`text-right font-semibold ${
                            reste > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                          }`}
                        >
                          {formatFCFA(reste)}
                        </td>
                        <td>
                          <ActionMenu
                            actions={[
                              { label: 'Voir', icon: Eye, onClick: () => {} },
                              { label: 'Modifier', icon: Edit2, onClick: () => {} },
                              { label: 'Télécharger PDF', icon: Download, onClick: () => exportExpensePDF(item) },
                              { label: 'Enregistrer acompte', icon: CreditCard, onClick: () => {} },
                              { label: 'Marquer payée', icon: CheckCircle, onClick: () => handleChangeStatut(item.id, 'payee') },
                              { label: 'Dupliquer', icon: Copy, onClick: () => {} },
                              {
                                label: 'Supprimer',
                                icon: Trash2,
                                onClick: () => handleDelete(item.id),
                                danger: true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <div className="text-sm text-[#64748B]">
                {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
              </div>
              <div className="pagination">
                <button
                  className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
