import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, Hash, Wallet } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import KpiCard from '../components/ui/KpiCard';
import { StatusPieChart } from '../components/ui/Charts';
import { clientsApi, fournisseursApi, paymentsApi, disbursementsApi, statsApi, exportClients, exportFournisseurs, type ClientStats, type FournisseurStats, type MonthlyStats, type ClientItem, type FournisseurItem, type Payment, type Disbursement } from '../lib/api';
import { formatFCFA, daysSince } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import useScrollToTop from '../hooks/useScrollToTop';

export default function RapportsPage() {
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [fournisseurStats, setFournisseurStats] = useState<FournisseurStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  useScrollToTop();

  useEffect(() => {
    async function fetch() {
      try {
        const [cStats, fStats, mStats, cList, fList, paymentData, disbursementData] = await Promise.all([
          clientsApi.stats().catch(() => null),
          fournisseursApi.stats().catch(() => null),
          statsApi.monthly().catch(() => null),
          clientsApi.list({}).catch(() => []),
          fournisseursApi.list({}).catch(() => []),
          paymentsApi.list({}).catch(() => []),
          disbursementsApi.list({}).catch(() => []),
        ]);
        setClientStats(cStats);
        setFournisseurStats(fStats);
        setMonthlyStats(mStats);
        setClients(cList);
        setFournisseurs(fList);
        setPayments(paymentData);
        setDisbursements(disbursementData);
      } catch (e) {
        addToast('error', 'Erreur chargement des statistiques.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalDisbursements = disbursements.reduce((s, d) => s + d.amount, 0);
  const soldeNetTresorerie = totalPayments - totalDisbursements;
  const nombreFactures = clients.filter(c => c.type === 'facture').length;

  const pieData = useMemo(() => [
    { name: 'Ventes (soldées)', value: clientStats?.solde || 0, color: '#059669' },
    { name: 'Créances', value: clientStats?.attente || 0, color: '#2563EB' },
    { name: 'Dépenses', value: fournisseurStats?.a_payer || 0, color: '#DC2626' },
  ].filter(s => s.value > 0), [clientStats, fournisseurStats]);

  const volumeData = monthlyStats
    ? monthlyStats.months.map((month, i) => ({
        month,
        Factures: monthlyStats.factures[i] || 0,
        Dépenses: monthlyStats.depenses[i] || 0,
      }))
    : [];

  const recapitulatif = useMemo(() => {
    const facturesPayees = clients
      .filter(c => c.type === 'facture' && c.statut === 'solde')
      .reduce((s, c) => s + c.montant, 0);
    const facturesPartielles = clients
      .filter(c => c.type === 'facture' && c.statut === 'acompte')
      .reduce((s, c) => s + c.montant, 0);
    const facturesNonPayees = clients
      .filter(c => c.type === 'facture' && c.statut !== 'solde' && c.statut !== 'acompte')
      .reduce((s, c) => s + c.montant, 0);
    const facturesRetard = clients
      .filter(c => c.type === 'facture' && c.statut !== 'solde' && c.statut !== 'acompte' && daysSince(c.date_emission) > 30)
      .reduce((s, c) => s + c.montant, 0);
    const proformas = clients
      .filter(c => c.type === 'proforma')
      .reduce((s, c) => s + c.montant, 0);
    const depensesPayees = fournisseurs
      .filter(f => f.statut === 'payee')
      .reduce((s, f) => s + f.montant, 0);
    const depensesAPayer = fournisseurs
      .filter(f => f.statut === 'impayee')
      .reduce((s, f) => s + f.montant, 0);

    const totalClientFactures = facturesPayees + facturesPartielles + facturesNonPayees;
    const totalFournisseur = depensesPayees + depensesAPayer;

    return [
      { label: 'Factures payées', montant: facturesPayees, total: totalClientFactures },
      { label: 'Factures partiellement payées', montant: facturesPartielles, total: totalClientFactures },
      { label: 'Factures non payées', montant: facturesNonPayees, total: totalClientFactures },
      { label: 'Factures en retard', montant: facturesRetard, total: totalClientFactures },
      { label: 'Proformas', montant: proformas, total: null },
      { label: 'Dépenses payées', montant: depensesPayees, total: totalFournisseur },
      { label: 'Dépenses à payer', montant: depensesAPayer, total: totalFournisseur },
    ];
  }, [clients, fournisseurs]);

  const totalRecap = recapitulatif
    .filter(r => r.label !== 'Proformas')
    .reduce((s, r) => s + r.montant, 0);

  if (loading) {
    return (
      <PageShell title="Rapports" subtitle="Analysez et exportez les données comptables">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[#E2E8F0] rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-4 h-64">
            <div className="bg-[#E2E8F0] rounded-2xl" />
            <div className="bg-[#E2E8F0] rounded-2xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Rapports" subtitle="Analysez et exportez les données comptables">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KpiCard label="Solde net de trésorerie" amount={formatFCFA(soldeNetTresorerie)} icon={<Wallet className="w-5 h-5" />} iconColor="#059669" secondary="Encaissements − Décaissements" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <KpiCard label="Encaissements" amount={formatFCFA(totalPayments)} icon={<TrendingUp className="w-5 h-5" />} iconColor="#173B6C" secondary="Total encaissements reçus" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <KpiCard label="Décaissements" amount={formatFCFA(totalDisbursements)} icon={<TrendingDown className="w-5 h-5" />} iconColor="#DC2626" secondary="Total décaissements effectués" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <KpiCard label="Nombre de factures" amount={nombreFactures.toLocaleString('fr-FR')} icon={<Hash className="w-5 h-5" />} iconColor="#F59E0B" secondary="Factures émises" />
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5">
          <h3 className="font-bold text-[#111827] mb-4">Répartition financière</h3>
          {pieData.length > 0 ? <StatusPieChart data={pieData} /> : <p className="text-sm text-[#94A3B8]">Aucune donnée à afficher.</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-5">
          <h3 className="font-bold text-[#111827] mb-4">Volume mensuel</h3>
          {volumeData.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }} />
                  <Bar dataKey="Factures" fill="#173B6C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dépenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">Aucune donnée à afficher.</p>
          )}
        </motion.div>
      </div>

      {/* Exports */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card p-5 mb-6">
        <h3 className="font-bold text-[#111827] mb-4">Exports</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { addToast('info', 'Export en cours...'); exportClients(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173B6C] text-white text-sm font-medium hover:bg-[#1e4a8a] transition-colors">
            <Download className="w-4 h-4" />
            Exporter les ventes (CSV)
          </button>
          <button onClick={() => { addToast('info', 'Export en cours...'); exportFournisseurs(); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#111827] text-sm font-medium border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
            <Download className="w-4 h-4" />
            Exporter les achats (CSV)
          </button>
        </div>
      </motion.div>

      {/* Récapitulatif */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card p-5">
        <h3 className="font-bold text-[#111827] mb-4">Récapitulatif détaillé</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th className="text-right">Montant</th>
                <th className="text-right">% du total</th>
              </tr>
            </thead>
            <tbody>
              {recapitulatif.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium text-[#111827]">{r.label}</td>
                  <td className="amount">{formatFCFA(r.montant)}</td>
                  <td className="text-right text-sm text-[#64748B]">
                    {r.total !== null && r.total > 0
                      ? `${((r.montant / r.total) * 100).toFixed(1)}%`
                      : r.total !== null ? '0%' : '—'}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t border-[#E2E8F0]">
                <td className="text-[#111827]">Total</td>
                <td className="amount">{formatFCFA(totalRecap)}</td>
                <td className="text-right text-sm text-[#64748B]">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageShell>
  );
}
