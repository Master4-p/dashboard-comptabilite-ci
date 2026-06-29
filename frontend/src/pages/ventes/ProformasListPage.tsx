import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Edit2, Trash2, CheckCircle, FileText, Copy, Eye, ChevronLeft, ChevronRight, Filter, XCircle
} from 'lucide-react';
import { clientsApi, exportClients, numberingApi, lineItemsApi, type ClientItem } from '../../lib/api';
import { exportInvoicePDF } from '../../lib/exportPDF';
import { formatFCFA, formatDate, daysSince, todayInputValue } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ActionMenu from '../../components/ui/ActionMenu';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

export default function ProformasListPage() {
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
      const params: Record<string, string> = { type: 'proforma' };
      if (search) params.search = search;
      if (filterStatut) params.statut = filterStatut;
      const data = await clientsApi.list(params);
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des proformas.');
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
    if (!confirm('Supprimer cette proforma ?')) return;
    try {
      await clientsApi.remove(id);
      fetchItems();
      addToast('success', 'Proforma supprimée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la suppression.');
    }
  }, [fetchItems, addToast]);


  const startEdit = useCallback((item: ClientItem) => {
    navigate(`/ventes/proformas/${item.id}/modifier`);
  }, [navigate]);

  const handleView = useCallback((item: ClientItem) => {
    navigate(`/ventes/proformas/${item.id}/modifier`);
  }, [navigate]);

  const handleConvertToInvoice = useCallback(async (item: ClientItem) => {
    if (!confirm('Convertir cette proforma en facture ?')) return;
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const numbering = await numberingApi.get('FA', year);
      const newNumero = numbering.formatted;
      await numberingApi.increment('FA', year);

      const facture = await clientsApi.create({
        type: 'facture',
        numero: newNumero,
        customer_id: item.customer_id,
        client: item.client,
        montant: item.montant,
        date_emission: todayInputValue(),
        date_relance: item.date_relance,
        notes: item.notes ? `Converti depuis proforma ${item.numero}.\n${item.notes}` : `Converti depuis proforma ${item.numero}.`,
        statut: 'brouillon',
        montant_acompte: 0,
        pj_filename: item.pj_filename,
      });

      const lines = await lineItemsApi.list(item.id, 'proforma');
      await Promise.all(lines.map((line, i) => lineItemsApi.create({
        document_id: facture.id,
        document_type: 'facture',
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unit_price: line.unit_price,
        discount_type: line.discount_type,
        discount_value: line.discount_value,
        tax_rate: line.tax_rate,
        line_subtotal: line.line_subtotal,
        line_tax: line.line_tax,
        line_total: line.line_total,
        sort_order: i,
      })));

      await clientsApi.changeStatut(item.id, 'converti', item.montant_acompte);

      addToast('success', 'Proforma convertie en facture.');
      navigate(`/ventes/factures/${facture.id}/modifier`);
    } catch (e) {
      addToast('error', 'Erreur lors de la conversion.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [navigate, addToast]);

  const handleDuplicate = useCallback(async (item: ClientItem) => {
    try {
      const { id, numero, created_at, updated_at, ...rest } = item;
      await clientsApi.create({ ...rest, numero: `${numero}-COPY` });
      fetchItems();
      addToast('success', 'Proforma dupliquée.');
    } catch (e) {
      addToast('error', 'Erreur lors de la duplication.');
    }
  }, [fetchItems, addToast]);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Ventes', to: '/ventes/proformas' },
          { label: 'Proformas' },
        ]}
        title="Proformas"
        subtitle="Gérez vos proformas et leur conversion."
        primaryAction={{ label: '+ Nouvelle proforma', to: '/ventes/proformas/nouvelle' }}
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
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="expire">Expiré</option>
            <option value="converti">Converti</option>
            <option value="annule">Annulé</option>
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Client</th>
                <th className="text-right">Montant</th>
                <th>Émission</th>
                <th>Relance</th>
                <th>Statut</th>
                <th className="text-right">Acompte</th>
                <th className="text-right">Reste</th>
                <th>PJ</th>
                <th className="text-right w-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">Chargement...</td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState
                    title="Aucune proforma"
                    text="Commencez par créer une nouvelle proforma pour ce client."
                    primaryAction={{ label: 'Nouvelle proforma', onClick: () => navigate('/ventes/proformas/nouvelle') }}
                    icon={<FileText className="w-8 h-8" />}
                  />
                </td></tr>
              ) : (
                paginatedItems.map(item => {
                  const reste = item.montant - item.montant_acompte;
                  const jours = daysSince(item.date_emission);
                  const urgent = item.statut !== 'solde' && jours > 30;
                  const relanceAtteinte = item.date_relance && new Date(item.date_relance) <= new Date() && item.statut !== 'solde';
                  return (
                    <tr key={item.id} className={`${urgent || relanceAtteinte ? 'urgent' : ''} cursor-pointer hover:bg-slate-50`} onClick={() => startEdit(item)}>
                      <td className="font-mono text-xs text-[#2563EB] link-cell">{item.numero}</td>
                      <td className="font-semibold text-[#111827]">{item.client}</td>
                      <td className="text-right amount">{formatFCFA(item.montant)}</td>
                      <td>
                        <div className="text-[#111827]">{formatDate(item.date_emission)}</div>
                        <div className="text-xs text-[#94A3B8]">{jours}j</div>
                      </td>
                      <td>
                        {item.date_relance ? (
                          <span className={`text-xs font-semibold ${relanceAtteinte ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                            {formatDate(item.date_relance)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#CBD5E1]">—</span>
                        )}
                      </td>
                      <td><StatusBadge statut={item.statut} type="client" /></td>
                      <td className="text-right amount text-[#64748B]">{item.montant_acompte ? formatFCFA(item.montant_acompte) : '—'}</td>
                      <td className={`text-right amount font-bold ${reste > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>{formatFCFA(reste)}</td>
                      <td>
                        {item.pj_filename ? (
                          <a href={item.pj_path || ''} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {item.pj_filename}
                          </a>
                        ) : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <ActionMenu
                          actions={[
                            { label: 'Voir', icon: Eye, onClick: () => handleView(item) },
                            { label: 'Modifier', icon: Edit2, onClick: () => startEdit(item) },
                            { label: 'Télécharger PDF', icon: Download, onClick: () => exportInvoicePDF(item) },
                            { label: 'Convertir en facture', icon: CheckCircle, onClick: () => handleConvertToInvoice(item) },
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
    </div>
  );
}
