import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fournisseursApi, type FournisseurItem } from '../../lib/api';
import { formatFCFA, formatDate } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

const ITEMS_PER_PAGE = 10;

export default function DecaissementsPage() {
  useScrollToTop();
  const { addToast } = useToast();

  const [items, setItems] = useState<FournisseurItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fournisseursApi.list({});
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des décaissements.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    return items
      .filter((i) => i.statut === 'payee' || i.statut === 'acompte_verse')
      .sort((a, b) => new Date(b.date_depense).getTime() - new Date(a.date_depense).getTime());
  }, [items]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    return filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleCreateDecaissement = useCallback(() => {
    addToast('info', 'Fonctionnalité à venir');
  }, []);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Achats', to: '/achats/depenses' },
          { label: 'Décaissements' },
        ]}
        title="Décaissements"
        subtitle="Historique des paiements émis."
        primaryAction={{
          label: 'Enregistrer un décaissement',
          onClick: handleCreateDecaissement,
        }}
      />

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>N°</th>
                <th>Fournisseur</th>
                <th className="text-right">Montant total</th>
                <th className="text-right">Montant payé</th>
                <th className="text-right">Reste</th>
                <th>Catégorie</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Aucun décaissement enregistré"
                      text="Les paiements effectués apparaîtront ici."
                      primaryAction={{
                        label: 'Enregistrer un décaissement',
                        onClick: handleCreateDecaissement,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const montantPaye = item.montant_acompte;
                  const reste = item.montant - item.montant_acompte;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="text-[#111827]">{formatDate(item.date_depense)}</td>
                      <td className="font-mono text-xs text-[#2563EB]">
                        {item.numero || <span className="text-[#CBD5E1]">—</span>}
                      </td>
                      <td className="font-semibold text-[#111827]">{item.fournisseur}</td>
                      <td className="text-right amount">{formatFCFA(item.montant)}</td>
                      <td className="text-right amount text-[#059669]">
                        {formatFCFA(montantPaye)}
                      </td>
                      <td
                        className={`text-right amount font-bold ${
                          reste > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                        }`}
                      >
                        {formatFCFA(reste)}
                      </td>
                      <td className="text-xs text-[#64748B]">
                        {item.categorie || <span className="text-[#CBD5E1]">—</span>}
                      </td>
                      <td>
                        <StatusBadge statut={item.statut} type="fournisseur" />
                      </td>
                    </motion.tr>
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
    </div>
  );
}
