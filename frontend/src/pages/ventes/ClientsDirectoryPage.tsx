import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  XCircle,
  Users,
  UserCheck,
  Wallet,
  AlertTriangle,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  customersApi,
  clientsApi,
  exportCustomers,
  type Customer,
  type ClientItem,
} from '../../lib/api';
import { formatFCFA, formatDate, daysSince } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import ActionMenu from '../../components/ui/ActionMenu';
import EmptyState from '../../components/ui/EmptyState';
import KpiCard from '../../components/ui/KpiCard';
import CustomerDrawer from '../../components/ui/CustomerDrawer';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

interface CustomerWithStats extends Customer {
  invoices_count: number;
  invoices_total: number;
  invoices_paid: number;
  encours: number;
  derniere_activite: string | null;
  a_relancer: boolean;
}

export default function ClientsDirectoryPage() {
  useScrollToTop();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [clientItems, setClientItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, clientsData] = await Promise.all([
        customersApi.list({}),
        clientsApi.list({}),
      ]);
      setCustomers(customersData);
      setClientItems(clientsData);
    } catch (e) {
      console.error(e);
      addToast('error', 'Erreur chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerStats = useMemo(() => {
    const statsMap = new Map<
      number,
      {
        invoices_count: number;
        invoices_total: number;
        invoices_paid: number;
        encours: number;
        derniere_activite: string | null;
        a_relancer: boolean;
      }
    >();

    customers.forEach((c) => {
      statsMap.set(c.id, {
        invoices_count: 0,
        invoices_total: 0,
        invoices_paid: 0,
        encours: 0,
        derniere_activite: null,
        a_relancer: false,
      });
    });

    clientItems.forEach((item) => {
      const customerId = item.customer_id;
      if (!customerId) return;
      const existing = statsMap.get(customerId);
      if (!existing) return;

      existing.invoices_count++;
      existing.invoices_total += item.montant;
      existing.invoices_paid += item.montant_acompte;
      existing.encours += item.montant - item.montant_acompte;

      if (item.date_emission) {
        if (
          !existing.derniere_activite ||
          item.date_emission > existing.derniere_activite
        ) {
          existing.derniere_activite = item.date_emission;
        }
      }

      if (
        item.statut !== 'solde' &&
        item.statut !== 'annule' &&
        daysSince(item.date_emission) > 30
      ) {
        existing.a_relancer = true;
      }
    });

    return statsMap;
  }, [customers, clientItems]);

  const customersWithStats = useMemo<CustomerWithStats[]>(() => {
    return customers.map((c) => {
      const stats = customerStats.get(c.id);
      return {
        ...c,
        invoices_count: stats?.invoices_count || 0,
        invoices_total: stats?.invoices_total || 0,
        invoices_paid: stats?.invoices_paid || 0,
        encours: stats?.encours || 0,
        derniere_activite: stats?.derniere_activite || c.updated_at || null,
        a_relancer: stats?.a_relancer || false,
      };
    });
  }, [customers, customerStats]);

  const filteredCustomers = useMemo(() => {
    if (!search) return customersWithStats;
    const q = search.toLowerCase();
    return customersWithStats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone?.toLowerCase() || '').includes(q) ||
        (c.email?.toLowerCase() || '').includes(q)
    );
  }, [customersWithStats, search]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(
    () =>
      filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredCustomers, currentPage]
  );

  const hasActiveFilters = !!search;

  const kpis = useMemo(() => {
    const totalClients = customersWithStats.length;
    const actifs = customersWithStats.filter((c) => c.is_active === 1).length;
    const encoursTotal = customersWithStats.reduce(
      (s, c) => s + (c.encours || 0),
      0
    );
    const aRelancer = customersWithStats.filter((c) => c.a_relancer).length;
    return { totalClients, actifs, encoursTotal, aRelancer };
  }, [customersWithStats]);

  const handleDelete = useCallback(
    async (customer: CustomerWithStats) => {
      if (
        !confirm(
          `Supprimer le client "${customer.name}" ? Cette action est irréversible.`
        )
      )
        return;
      try {
        await customersApi.remove(customer.id);
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        addToast('success', 'Client supprimé.');
      } catch (e) {
        console.error(e);
        addToast('error', 'Erreur lors de la suppression.');
      }
    },
    [addToast]
  );

  const handleToggleActive = useCallback(
    async (customer: CustomerWithStats) => {
      const newActive = customer.is_active === 1 ? 0 : 1;
      try {
        await customersApi.update(customer.id, { is_active: newActive });
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customer.id ? { ...c, is_active: newActive } : c
          )
        );
        addToast(
          'success',
          newActive === 1 ? 'Client activé.' : 'Client désactivé.'
        );
      } catch (e) {
        console.error(e);
        addToast('error', 'Erreur lors de la mise à jour.');
      }
    },
    [addToast]
  );

  const handleOpenCreate = useCallback(() => {
    setEditingCustomer(null);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setDrawerOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingCustomer(null);
  }, []);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Ventes', to: '/ventes/factures' },
          { label: 'Clients' },
        ]}
        title="Clients"
        subtitle="Gérez votre portefeuille clients et leurs encours."
        primaryAction={{
          label: 'Nouveau client',
          onClick: handleOpenCreate,
        }}
        secondaryAction={{ label: 'Exporter', onClick: exportCustomers }}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Nombre de clients"
          amount={String(kpis.totalClients)}
          icon={<Users className="w-5 h-5" />}
          iconColor="#173B6C"
        />
        <KpiCard
          label="Clients actifs"
          amount={String(kpis.actifs)}
          icon={<UserCheck className="w-5 h-5" />}
          iconColor="#059669"
        />
        <KpiCard
          label="Encours total"
          amount={formatFCFA(kpis.encoursTotal)}
          icon={<Wallet className="w-5 h-5" />}
          iconColor="#DC2626"
        />
        <KpiCard
          label="Clients à relancer"
          amount={String(kpis.aRelancer)}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="#F59E0B"
        />
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-field">
          <input
            className="form-input"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Contact</th>
                <th>Téléphone / Email</th>
                <th className="text-right">Factures</th>
                <th className="text-right">Total facturé</th>
                <th className="text-right">Payé</th>
                <th className="text-right">Encours</th>
                <th>Dernière activité</th>
                <th>Statut</th>
                <th className="text-right w-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      title="Aucun client"
                      text="Ajoutez votre premier client."
                      primaryAction={{
                        label: 'Nouveau client',
                        onClick: handleOpenCreate,
                      }}
                      icon={<Users className="w-8 h-8" />}
                    />
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-semibold text-[#111827]">
                      {customer.name}
                    </td>
                    <td>{customer.contact_name || <span className="text-[#CBD5E1]">—</span>}</td>
                    <td>
                      <div className="text-sm">
                        {customer.phone && <div>{customer.phone}</div>}
                        {customer.email && (
                          <div className="text-[#94A3B8]">{customer.email}</div>
                        )}
                        {!customer.phone && !customer.email && <span className="text-[#CBD5E1]">—</span>}
                      </div>
                    </td>
                    <td className="text-right">
                      {customer.invoices_count}
                    </td>
                    <td className="text-right amount">
                      {formatFCFA(customer.invoices_total || 0)}
                    </td>
                    <td className="text-right amount text-[#059669]">
                      {formatFCFA(customer.invoices_paid || 0)}
                    </td>
                    <td
                      className={`text-right amount font-bold ${
                        (customer.encours || 0) > 0
                          ? 'text-[#DC2626]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {formatFCFA(customer.encours || 0)}
                    </td>
                    <td>{formatDate(customer.derniere_activite)}</td>
                    <td>
                      <span
                        className={`badge ${
                          customer.is_active === 1
                            ? 'badge-green'
                            : 'badge-gray'
                        }`}
                      >
                        {customer.is_active === 1 ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <ActionMenu
                        actions={[
                          {
                            label: 'Voir la fiche',
                            icon: Eye,
                            onClick: () =>
                              navigate(`/ventes/clients/${customer.id}`),
                          },
                          {
                            label: 'Modifier',
                            icon: Pencil,
                            onClick: () => handleOpenEdit(customer),
                          },
                          {
                            label: 'Créer une facture',
                            icon: FileText,
                            onClick: () =>
                              navigate('/ventes/factures/nouvelle'),
                          },
                          {
                            label: 'Créer une proforma',
                            icon: CreditCard,
                            onClick: () =>
                              navigate('/ventes/proformas/nouvelle'),
                          },
                          {
                            label:
                              customer.is_active === 1
                                ? 'Désactiver'
                                : 'Activer',
                            icon:
                              customer.is_active === 1
                                ? ToggleLeft
                                : ToggleRight,
                            onClick: () => handleToggleActive(customer),
                          },
                          {
                            label: 'Supprimer',
                            icon: Trash2,
                            onClick: () => handleDelete(customer),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
            <div className="text-sm text-[#64748B]">
              <span>{filteredCustomers.length} résultat(s)</span>
            </div>
            <div className="pagination">
              <button
                className={`pagination-btn ${
                  currentPage === 1 ? 'disabled' : ''
                }`}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${
                      currentPage === page ? 'active' : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className={`pagination-btn ${
                  currentPage === totalPages ? 'disabled' : ''
                }`}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomerDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onSave={handleSave}
        customer={editingCustomer}
        existingCustomers={customers}
      />
    </div>
  );
}
