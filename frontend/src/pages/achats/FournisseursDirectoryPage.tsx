import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight,
  Users, Activity, TrendingUp, Calendar, Eye, FileText, Trash2
} from 'lucide-react';
import { fournisseursApi, exportFournisseurs, type FournisseurItem } from '../../lib/api';
import { formatFCFA, formatDate, categorieLabels } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import KpiCard from '../../components/ui/KpiCard';
import ActionMenu from '../../components/ui/ActionMenu';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

const ITEMS_PER_PAGE = 10;

interface FournisseurSummary {
  nom: string;
  categorie: string | null;
  depenses: number;
  total: number;
  payé: number;
  restant: number;
  derniereDepense: string;
}

export default function FournisseursDirectoryPage() {
  useScrollToTop();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [items, setItems] = useState<FournisseurItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fournisseursApi.list({});
      setItems(data);
    } catch (e) {
      addToast('error', 'Erreur chargement des fournisseurs.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fournisseurs = useMemo(() => {
    const map = new Map<string, FournisseurSummary>();
    items.forEach((item) => {
      const existing = map.get(item.fournisseur);
      if (existing) {
        existing.depenses++;
        existing.total += item.montant;
        existing.payé += item.montant_acompte;
        existing.restant += item.montant - item.montant_acompte;
        if (item.date_depense > existing.derniereDepense) {
          existing.derniereDepense = item.date_depense;
        }
      } else {
        map.set(item.fournisseur, {
          nom: item.fournisseur,
          categorie: item.categorie,
          depenses: 1,
          total: item.montant,
          payé: item.montant_acompte,
          restant: item.montant - item.montant_acompte,
          derniereDepense: item.date_depense,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.restant - a.restant);
  }, [items]);

  const filteredFournisseurs = useMemo(() => {
    if (!search.trim()) return fournisseurs;
    const q = search.trim().toLowerCase();
    return fournisseurs.filter((f) => f.nom.toLowerCase().includes(q));
  }, [fournisseurs, search]);

  const totalPages = Math.ceil(filteredFournisseurs.length / ITEMS_PER_PAGE);
  const paginatedFournisseurs = useMemo(() => {
    return filteredFournisseurs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredFournisseurs, currentPage]);

  const kpis = useMemo(() => {
    const totalFournisseurs = fournisseurs.length;
    const actifs = fournisseurs.filter((f) => f.depenses > 1).length;
    const dettesTotales = fournisseurs.reduce((s, f) => s + f.restant, 0);
    const echeancesProchaines = items.filter(
      (i) =>
        i.date_echeance &&
        new Date(i.date_echeance) >= new Date() &&
        i.statut !== 'payee'
    ).length;

    return {
      totalFournisseurs,
      actifs,
      dettesTotales,
      echeancesProchaines,
    };
  }, [fournisseurs, items]);

  const handleExport = useCallback(() => {
    addToast('info', 'Export CSV en cours...');
    exportFournisseurs();
  }, [addToast]);

  const handleCreateFournisseur = useCallback(() => {
    alert('Fonctionnalité à venir : créer un nouveau fournisseur.');
  }, []);

  const handleDeleteFournisseur = useCallback(
    (nom: string) => {
      if (!confirm(`Supprimer le fournisseur « ${nom} » et toutes ses dépenses ?`)) return;
      addToast('info', 'Suppression groupée à implémenter.');
    },
    [addToast]
  );

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Achats', to: '/achats/depenses' },
          { label: 'Fournisseurs' },
        ]}
        title="Fournisseurs"
        subtitle="Gérez votre annuaire fournisseurs et leurs dettes."
        primaryAction={{
          label: '+ Nouveau fournisseur',
          onClick: handleCreateFournisseur,
        }}
        secondaryAction={{ label: 'Exporter', onClick: handleExport }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Nombre de fournisseurs"
          amount={String(kpis.totalFournisseurs)}
          icon={<Users className="w-5 h-5" />}
          iconColor="#173B6C"
        />
        <KpiCard
          label="Fournisseurs actifs"
          amount={String(kpis.actifs)}
          icon={<Activity className="w-5 h-5" />}
          iconColor="#059669"
        />
        <KpiCard
          label="Dettes totales"
          amount={formatFCFA(kpis.dettesTotales)}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="#DC2626"
        />
        <KpiCard
          label="Échéances prochaines"
          amount={String(kpis.echeancesProchaines)}
          icon={<Calendar className="w-5 h-5" />}
          iconColor="#F59E0B"
        />
      </div>

      {/* Search filter */}
      <div className="filter-bar">
        <div className="search-field flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="form-input"
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Catégorie</th>
                <th className="text-right">Dépenses</th>
                <th className="text-right">Total achats</th>
                <th className="text-right">Payé</th>
                <th className="text-right">Restant</th>
                <th>Dernière activité</th>
                <th className="text-right w-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : paginatedFournisseurs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Aucun fournisseur"
                      text="Aucune donnée fournisseur disponible."
                      primaryAction={{
                        label: 'Ajouter un fournisseur',
                        onClick: handleCreateFournisseur,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedFournisseurs.map((f) => (
                  <motion.tr
                    key={f.nom}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="font-semibold text-[#111827]">{f.nom}</td>
                    <td className="text-xs text-[#64748B]">
                      {f.categorie ? categorieLabels[f.categorie] || f.categorie : '—'}
                    </td>
                    <td className="text-right">{f.depenses}</td>
                    <td className="text-right amount">{formatFCFA(f.total)}</td>
                    <td className="text-right amount text-[#059669]">{formatFCFA(f.payé)}</td>
                    <td
                      className={`text-right amount font-bold ${
                        f.restant > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                      }`}
                    >
                      {formatFCFA(f.restant)}
                    </td>
                    <td className="text-[#111827]">{formatDate(f.derniereDepense)}</td>
                    <td>
                      <ActionMenu
                        actions={[
                          { label: 'Voir la fiche', icon: Eye, onClick: () => {} },
                          {
                            label: 'Créer une dépense',
                            icon: FileText,
                            onClick: () => navigate('/achats/depenses/nouvelle'),
                          },
                          {
                            label: 'Créer une facture',
                            icon: FileText,
                            onClick: () => navigate('/achats/depenses/nouvelle'),
                          },
                          {
                            label: 'Supprimer',
                            icon: Trash2,
                            onClick: () => handleDeleteFournisseur(f.nom),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
            <div className="text-sm text-[#64748B]">
              {filteredFournisseurs.length} résultat{filteredFournisseurs.length > 1 ? 's' : ''}
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
