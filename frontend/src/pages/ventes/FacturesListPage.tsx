import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Edit2, Trash2, CheckCircle, FileText, CreditCard, Send, Copy, Eye, ChevronLeft, ChevronRight, Filter, XCircle
} from 'lucide-react';
import { clientsApi, exportClients, type ClientItem } from '../../lib/api';
import { exportInvoicePDF } from '../../lib/exportPDF';
import { formatFCFA, formatDate, daysSince } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionMenu from '../../components/ui/ActionMenu';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

export default function FacturesListPage() {
  useScrollToTop();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { type: 'facture' };
      if (search) params.search = search;
      if (filterStatut) params.statut = filterStatut;
      const data = await clientsApi.list(params);
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des factures.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatut, addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filteredItems = useMemo(() => items, [items]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredItems, currentPage]
  );

  const hasActiveFilters = search || filterStatut;

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Supprimer cette facture ?')) return;
    try {
      await clientsApi.remove(id);
      fetchItems();
      addToast('success', 'Facture supprimée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la suppression.');
    }
  }, [fetchItems, addToast]);

  const handleChangeStatut = useCallback(async (id: number, statut: string) => {
    try {
      const item = items.find(i => i.id === id);
      const ma = statut === 'solde' ? item?.montant : item?.montant_acompte;
      await clientsApi.changeStatut(id, statut, ma);
      fetchItems();
      addToast('success', 'Statut mis à jour.');
    } catch (e) {
      addToast('error', 'Erreur lors de la mise à jour du statut.');
    }
  }, [items, fetchItems, addToast]);

  const startEdit = useCallback((item: ClientItem) => {
    navigate(`/ventes/factures/${item.id}/modifier`);
  }, [navigate]);

  const handleView = useCallback((item: ClientItem) => {
    navigate(`/ventes/factures/${item.id}/modifier`);
  }, [navigate]);

  const handleDuplicate = useCallback(async (item: ClientItem) => {
    try {
      const { id, numero, created_at, updated_at, ...rest } = item;
      await clientsApi.create({ ...rest, numero: `${numero}-COPY` });
      fetchItems();
      addToast('success', 'Facture dupliquée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la duplication.');
    }
  }, [fetchItems, addToast]);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Ventes', to: '/ventes/factures' },
          { label: 'Factures' },
        ]}
        title="Factures"
        subtitle="Gérez vos factures clients et leur encours."
        primaryAction={{ label: 'Nouvelle facture', to: '/ventes/factures/nouvelle' }}
        secondaryAction={{ label: 'Exporter', onClick: exportClients }}
      />

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-field">
          <input
            className="form-input"
            placeholder="Rechercher client ou n°..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="form-select w-40 text-sm"
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Tous statuts</option>
            <option value="envoye">Envoyé</option>
            <option value="relance">Relancé</option>
            <option value="acompte">Acompte</option>
            <option value="solde">Soldé</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setFilterStatut(''); setCurrentPage(1); }}
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
            title="Aucune facture"
            text="Commencez par créer une nouvelle facture pour ce client."
            primaryAction={{ label: 'Nouvelle facture', onClick: () => navigate('/ventes/factures/nouvelle') }}
            icon={<FileText className="w-8 h-8" />}
          />
        </div>
      ) : (
        <div className="card p-0" data-testid="factures-table-card">
          <div className="data-table-container">
            <table className="data-table" data-testid="factures-table">
              <thead>
                <tr>
                  <th className="nowrap">N°</th>
                  <th>Client</th>
                  <th className="nowrap">Émission</th>
                  <th className="nowrap text-right">Montant</th>
                  <th className="nowrap text-right">Reste</th>
                  <th className="nowrap">Statut</th>
                  <th className="nowrap" style={{ width: 44 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">Chargement...</td></tr>
                ) : (
                  paginatedItems.map(item => {
                    const reste = item.montant - item.montant_acompte;
                    const jours = daysSince(item.date_emission);
                    const urgent = item.statut !== 'solde' && jours > 30;
                    const relanceAtteinte = item.date_relance && new Date(item.date_relance) <= new Date() && item.statut !== 'solde';
                    return (
                      <tr key={item.id} className={`${urgent || relanceAtteinte ? 'urgent' : ''} clickable`} onClick={() => startEdit(item)} data-testid={`facture-row-${item.id}`}>
                        <td className="nowrap font-mono text-xs text-[#2563EB] link-cell">
                          <span className="inline-flex items-center gap-1">
                            {item.numero}
                            {item.pj_filename && <FileText className="w-3 h-3 text-[#94A3B8]" />}
                          </span>
                        </td>
                        <td className="font-semibold text-[#111827] truncate-cell" title={item.client}>{item.client}</td>
                        <td className="nowrap date-cell">
                          <div className="text-[#111827] text-sm">{formatDate(item.date_emission)}</div>
                          <div className="text-xs text-[#94A3B8]">{jours}j {relanceAtteinte && <span className="text-[#DC2626]">• relance</span>}</div>
                        </td>
                        <td className="amount">{formatFCFA(item.montant)}</td>
                        <td className={`amount font-bold ${reste > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                          {formatFCFA(reste)}
                          {item.montant_acompte > 0 && reste > 0 && (
                            <div className="text-[10px] font-normal text-[#94A3B8] mt-0.5">Acompte {formatFCFA(item.montant_acompte)}</div>
                          )}
                        </td>
                        <td className="badge-cell"><StatusBadge statut={item.statut} type="client" /></td>
                        <td className="actions" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            actions={[
                              { label: 'Voir', icon: Eye, onClick: () => handleView(item) },
                              { label: 'Modifier', icon: Edit2, onClick: () => startEdit(item) },
                              { label: 'Télécharger PDF', icon: Download, onClick: () => exportInvoicePDF(item) },
                              { label: 'Enregistrer acompte', icon: CreditCard, onClick: () => {} },
                              { label: 'Marquer payée', icon: CheckCircle, onClick: () => handleChangeStatut(item.id, 'solde') },
                              { label: 'Envoyer relance', icon: Send, onClick: () => handleChangeStatut(item.id, 'relance') },
                              { label: 'Dupliquer', icon: Copy, onClick: () => handleDuplicate(item) },
                              { label: 'Supprimer', icon: Trash2, onClick: () => handleDelete(item.id), danger: true },
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
                <span>{filteredItems.length} résultat(s)</span>
              </div>
              <div className="pagination">
                <button
                  className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
