import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CreditCard, Filter, XCircle,
  Trash2, Save, X, User, Wallet
} from 'lucide-react';
import {
  paymentsApi, customersApi, clientsApi,
  type Payment, type Customer, type ClientItem
} from '../../lib/api';
import { formatFCFA, formatDate, todayInputValue } from '../../lib/utils';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import useScrollToTop from '../../hooks/useScrollToTop';

export default function EncaissementsPage() {
  useScrollToTop();
  const { addToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: 0,
    paymentDate: todayInputValue(),
    paymentMethod: 'virement' as string,
    reference: '',
    receivingAccount: '',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsData, customersData, invoicesData] = await Promise.all([
        paymentsApi.list({}),
        customersApi.list(),
        clientsApi.list({ type: 'facture' }),
      ]);
      setPayments(paymentsData);
      setCustomers(customersData);
      setInvoices(invoicesData);
    } catch (e) {
      addToast('error', 'Erreur chargement des données.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unpaidInvoices = useMemo(() =>
    invoices.filter(i => i.statut !== 'solde'),
  [invoices]);

  const selectedInvoice = useMemo(() =>
    invoices.find(i => String(i.id) === formData.invoiceId),
  [invoices, formData.invoiceId]);

  const invoicePayments = useMemo(() => {
    if (!selectedInvoice) return [];
    return payments.filter(p => p.invoice_id === selectedInvoice.id);
  }, [payments, selectedInvoice]);

  const alreadyPaid = useMemo(() => {
    if (!selectedInvoice) return 0;
    return invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  }, [invoicePayments, selectedInvoice]);

  const remainingBalance = useMemo(() => {
    if (!selectedInvoice) return 0;
    return Math.max(0, selectedInvoice.montant - alreadyPaid);
  }, [selectedInvoice, alreadyPaid]);

  useEffect(() => {
    if (selectedInvoice) {
      setFormData(prev => ({ ...prev, amount: remainingBalance }));
    }
  }, [selectedInvoice?.id, remainingBalance]);

  const customerMap = useMemo(() => {
    const map = new Map<number, Customer>();
    customers.forEach(c => map.set(c.id, c));
    return map;
  }, [customers]);

  const invoiceMap = useMemo(() => {
    const map = new Map<number, ClientItem>();
    invoices.forEach(i => map.set(i.id, i));
    return map;
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter(p => {
      const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
      const invoice = p.invoice_id ? invoiceMap.get(p.invoice_id) : null;
      return (
        (p.reference || '').toLowerCase().includes(q) ||
        (customer?.name || '').toLowerCase().includes(q) ||
        (invoice?.numero || '').toLowerCase().includes(q) ||
        (p.payment_method || '').toLowerCase().includes(q)
      );
    });
  }, [payments, search, customerMap, invoiceMap]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedItems = useMemo(
    () => filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredPayments, currentPage]
  );

  const hasActiveFilters = !!search;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      addToast('error', 'Veuillez sélectionner une facture.');
      return;
    }
    if (formData.amount <= 0 || formData.amount > remainingBalance + 0.001) {
      addToast('error', 'Le montant doit être supérieur à 0 et inférieur ou égal au solde restant.');
      return;
    }
    if (!formData.paymentDate) {
      addToast('error', 'La date de paiement est obligatoire.');
      return;
    }

    const customerId = selectedInvoice.customer_id
      || customers.find(c => c.name === selectedInvoice.client)?.id;
    if (!customerId) {
      addToast('error', 'Client non identifié pour cette facture.');
      return;
    }

    try {
      await paymentsApi.create({
        invoice_id: selectedInvoice.id,
        customer_id: customerId,
        payment_date: formData.paymentDate,
        amount: Number(formData.amount.toFixed(2)),
        payment_method: formData.paymentMethod,
        reference: formData.reference || null,
        receiving_account: formData.receivingAccount || null,
        notes: formData.notes || null,
      });
      addToast('success', 'Paiement enregistré');
      setShowForm(false);
      setFormData({
        invoiceId: '',
        amount: 0,
        paymentDate: todayInputValue(),
        paymentMethod: 'virement',
        reference: '',
        receivingAccount: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      addToast('error', 'Erreur lors de l\'enregistrement du paiement.');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    try {
      await paymentsApi.remove(id);
      addToast('success', 'Paiement supprimé.');
      fetchData();
    } catch (err) {
      addToast('error', 'Erreur lors de la suppression.');
      console.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: 'Relais IT' },
          { label: 'Ventes', to: '/ventes/factures' },
          { label: 'Encaissements' },
        ]}
        title="Encaissements"
        subtitle="Historique des paiements reçus."
        primaryAction={{ label: 'Enregistrer un paiement', onClick: () => setShowForm(true) }}
      />

      {/* Payment Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
            <h3 className="font-semibold text-[#111827] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#173B6C]" />
              Enregistrer un paiement
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="form-label">Facture</label>
              <select
                className="form-select"
                required
                value={formData.invoiceId}
                onChange={e => setFormData({ ...formData, invoiceId: e.target.value })}
              >
                <option value="">Sélectionner une facture...</option>
                {unpaidInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.numero} — {inv.client} — {formatFCFA(inv.montant)} (reste: {formatFCFA(Math.max(0, inv.montant - inv.montant_acompte))})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvoice && (
              <>
                <div>
                  <label className="form-label">Client</label>
                  <div className="form-input bg-slate-50 text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedInvoice.client}
                  </div>
                </div>
                <div>
                  <label className="form-label">Montant facture</label>
                  <div className="form-input bg-slate-50 text-slate-500 font-mono">
                    {formatFCFA(selectedInvoice.montant)}
                  </div>
                </div>
                <div>
                  <label className="form-label">Déjà payé</label>
                  <div className="form-input bg-slate-50 text-slate-500 font-mono">
                    {formatFCFA(alreadyPaid)}
                  </div>
                </div>
                <div>
                  <label className="form-label">Solde restant</label>
                  <div className="form-input bg-slate-50 text-[#DC2626] font-semibold font-mono">
                    {formatFCFA(remainingBalance)}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="form-label">Montant du paiement *</label>
              <input
                type="number"
                className="form-input"
                required
                min={0.01}
                max={remainingBalance || undefined}
                step={0.01}
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
              {formData.amount > remainingBalance && remainingBalance > 0 && (
                <p className="text-xs text-[#DC2626] mt-1">Le montant dépasse le solde restant.</p>
              )}
            </div>
            <div>
              <label className="form-label">Date de paiement *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.paymentDate}
                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Méthode de paiement *</label>
              <select
                className="form-select"
                required
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="virement">Virement</option>
                <option value="espèces">Espèces</option>
                <option value="chèque">Chèque</option>
                <option value="carte">Carte</option>
                <option value="mobile money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="form-label">Référence</label>
              <input
                className="form-input"
                placeholder="N° chèque, référence virement..."
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Compte de réception</label>
              <input
                className="form-input"
                placeholder="Compte bancaire..."
                value={formData.receivingAccount}
                onChange={e => setFormData({ ...formData, receivingAccount: e.target.value })}
              />
            </div>
            <div className="lg:col-span-3">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Notes éventuelles..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="lg:col-span-3 flex gap-2 pt-2">
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" />
                Enregistrer le paiement
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-field">
          <input
            className="form-input"
            placeholder="Rechercher client, référence ou n° facture..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setCurrentPage(1); }}
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
            title="Aucun encaissement enregistré"
            text="Les paiements reçus apparaîtront ici."
            icon={<CreditCard className="w-8 h-8" />}
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-24">Date</th>
                  <th className="w-24">Référence</th>
                  <th className="w-24">Facture</th>
                  <th className="w-40">Client</th>
                  <th className="w-24">Méthode</th>
                  <th className="w-28 text-right">Montant</th>
                  <th className="w-32">Notes</th>
                  <th className="w-12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400">Chargement...</td></tr>
                ) : (
                paginatedItems.map(p => {
                  const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
                  const invoice = p.invoice_id ? invoiceMap.get(p.invoice_id) : null;
                  return (
                    <tr key={p.id}>
                      <td>{formatDate(p.payment_date)}</td>
                      <td className="font-mono text-xs text-[#64748B]">{p.reference || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="font-mono text-xs text-[#2563EB] link-cell">{invoice?.numero || p.invoice_numero || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td className="font-semibold text-[#111827]">{customer?.name || p.customer_name || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td><span className="badge-gray">{p.payment_method}</span></td>
                      <td className="text-right amount text-[#059669]">{formatFCFA(p.amount)}</td>
                      <td className="text-xs text-[#64748B] max-w-[200px] truncate">{p.notes || <span className="text-[#CBD5E1]">—</span>}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn-icon hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <span>{filteredPayments.length} résultat(s)</span>
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
