import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import KpiCard from '../components/ui/KpiCard';
import { CashFlowChart } from '../components/ui/Charts';
import EmptyState from '../components/ui/EmptyState';
import { paymentsApi, disbursementsApi, statsApi, type Payment, type Disbursement, type MonthlyStats } from '../lib/api';
import { formatFCFA, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import useScrollToTop from '../hooks/useScrollToTop';

interface TreasuryMovement {
  id: number;
  type: 'Entrée' | 'Sortie';
  date: string;
  numero: string;
  nom: string;
  montant: number;
  methode: string;
  reference: string | null;
}

export default function TresoreriePage() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [movements, setMovements] = useState<TreasuryMovement[]>([]);
  const [encaissements, setEncaissements] = useState(0);
  const [decaissements, setDecaissements] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  useScrollToTop();

  useEffect(() => {
    async function fetchData() {
      try {
        const [mStats, payments, disbursements] = await Promise.all([
          statsApi.monthly().catch(() => null),
          paymentsApi.list({}).catch(() => []),
          disbursementsApi.list({}).catch(() => []),
        ]);
        setMonthlyStats(mStats);

        const totalEncaissements = payments.reduce((s, p) => s + p.amount, 0);
        const totalDecaissements = disbursements.reduce((s, d) => s + d.amount, 0);
        setEncaissements(totalEncaissements);
        setDecaissements(totalDecaissements);

        const mappedPayments: TreasuryMovement[] = payments.map((p: Payment) => ({
          id: p.id,
          type: 'Entrée',
          date: p.payment_date,
          numero: p.invoice_numero || '',
          nom: p.customer_name || `Client #${p.customer_id}`,
          montant: p.amount,
          methode: p.payment_method,
          reference: p.reference,
        }));

        const mappedDisbursements: TreasuryMovement[] = disbursements.map((d: Disbursement) => ({
          id: d.id,
          type: 'Sortie',
          date: d.payment_date,
          numero: d.expense_id ? `D-${d.expense_id}` : '',
          nom: `Fournisseur #${d.supplier_id}`,
          montant: d.amount,
          methode: d.payment_method,
          reference: d.reference,
        }));

        const all = [...mappedPayments, ...mappedDisbursements]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setMovements(all);
      } catch (e) {
        addToast('error', 'Erreur chargement des données.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <PageShell title="Trésorerie" subtitle="Analysez les entrées, sorties et le solde">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-[#E2E8F0] rounded-2xl" />)}
          </div>
          <div className="h-64 bg-[#E2E8F0] rounded-2xl" />
          <div className="h-48 bg-[#E2E8F0] rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  const soldeNet = encaissements - decaissements;

  const cashFlowData = monthlyStats
    ? monthlyStats.months.map((month, i) => ({
        month,
        encaissements: monthlyStats.encaissements[i] || 0,
        decaissements: monthlyStats.decaissements[i] || 0,
        solde: monthlyStats.solde[i] || 0,
      }))
    : [];

  return (
    <PageShell title="Trésorerie" subtitle="Analysez les entrées, sorties et le solde de trésorerie">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KpiCard label="Encaissements" amount={formatFCFA(encaissements)} icon={<TrendingUp className="w-5 h-5" />} iconColor="#059669" secondary="Total encaissements reçus" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <KpiCard label="Décaissements" amount={formatFCFA(decaissements)} icon={<TrendingDown className="w-5 h-5" />} iconColor="#DC2626" secondary="Total décaissements effectués" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <KpiCard label="Solde net" amount={formatFCFA(soldeNet)} icon={<Wallet className="w-5 h-5" />} iconColor="#173B6C" secondary="Encaissements − Décaissements" />
        </motion.div>
      </div>

      {/* Graphique */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5 mb-6">
        <h3 className="font-bold text-[#111827] mb-4">Flux de trésorerie</h3>
        {cashFlowData.length > 0 ? (
          <CashFlowChart data={cashFlowData} />
        ) : (
          <EmptyState icon={<TrendingUp className="w-10 h-10" />} title="Aucune donnée historique" text="Les données de trésorerie apparaîtront dès que vous aurez des factures et des dépenses." />
        )}
      </motion.div>

      {/* Mouvements de trésorerie */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5">
        <h3 className="font-bold text-[#111827] mb-4">Mouvements de trésorerie</h3>
        {movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>N°</th>
                  <th>Nom</th>
                  <th className="text-right">Montant</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((t) => (
                  <tr key={`${t.type}-${t.id}`} className="clickable">
                    <td><span className="text-xs text-[#94A3B8]">{formatDate(t.date)}</span></td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.type === 'Entrée' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}>
                        {t.type === 'Entrée' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="font-medium text-[#111827]">{t.numero}</td>
                    <td className="text-[#334155]">{t.nom}</td>
                    <td className="amount">{formatFCFA(t.montant)}</td>
                    <td><span className="text-xs text-[#94A3B8]">{t.methode}</span></td>
                    <td><span className="text-xs text-[#94A3B8]">{t.reference || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Clock className="w-10 h-10" />} title="Aucun mouvement" text="Aucun mouvement de trésorerie enregistré." />
        )}
      </motion.div>
    </PageShell>
  );
}
