import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, FileText, Truck, CreditCard,
  Clock, ArrowRight, Plus, BarChart3, Send, CheckCircle
} from 'lucide-react';
import { clientsApi, fournisseursApi, paymentsApi, alertsApi, statsApi, type ClientStats, type FournisseurStats, type Alert, type MonthlyStats, type ClientItem, type Payment } from '../lib/api';
import { formatFCFA } from '../lib/utils';
import { Link } from 'react-router-dom';
import KpiCard from '../components/ui/KpiCard';
import { CashFlowChart } from '../components/ui/Charts';
import { useToast } from '../context/ToastContext';
import useScrollToTop from '../hooks/useScrollToTop';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } }
};

export default function Dashboard() {
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [fournisseurStats, setFournisseurStats] = useState<FournisseurStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [items, setItems] = useState<ClientItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  useScrollToTop();

  useEffect(() => {
    async function fetchData() {
      try {
        const [cStats, fStats, alertData, mStats, clients, paymentData] = await Promise.all([
          clientsApi.stats(),
          fournisseursApi.stats(),
          alertsApi.list(),
          statsApi.monthly().catch(() => null),
          clientsApi.list({}).catch(() => []),
          paymentsApi.list({}).catch(() => []),
        ]);
        setClientStats(cStats);
        setFournisseurStats(fStats);
        setAlerts(alertData);
        setMonthlyStats(mStats);
        setItems(clients);
        setPayments(paymentData);
      } catch (e) {
        console.error('Erreur chargement dashboard:', e);
        addToast('error', 'Erreur chargement des données.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ageing calculation
  const ageing = useMemo(() => {
    const now = new Date();
    const unpaid = items.filter(i => i.type === 'facture' && i.statut !== 'solde');
    const buckets = {
      nonEchue: { label: 'Non échues', days: 0, amount: 0, count: 0 },
      j1_30: { label: '1-30 jours', days: 30, amount: 0, count: 0 },
      j31_60: { label: '31-60 jours', days: 60, amount: 0, count: 0 },
      plus60: { label: 'Plus de 60 j', days: Infinity, amount: 0, count: 0 },
    };
    unpaid.forEach(inv => {
      const days = Math.floor((now.getTime() - new Date(inv.date_emission).getTime()) / (1000 * 60 * 60 * 24));
      const reste = inv.montant - inv.montant_acompte;
      if (days <= 0) {
        buckets.nonEchue.amount += reste;
        buckets.nonEchue.count += 1;
      } else if (days <= 30) {
        buckets.j1_30.amount += reste;
        buckets.j1_30.count += 1;
      } else if (days <= 60) {
        buckets.j31_60.amount += reste;
        buckets.j31_60.count += 1;
      } else {
        buckets.plus60.amount += reste;
        buckets.plus60.count += 1;
      }
    });
    return buckets;
  }, [items]);

  const totalUnpaid = useMemo(() =>
    Object.values(ageing).reduce((sum, b) => sum + b.amount, 0),
    [ageing]
  );

  const ageingBarColor = (key: string) => {
    switch (key) {
      case 'nonEchue': return '#059669';
      case 'j1_30': return '#F59E0B';
      case 'j31_60': return '#F97316';
      case 'plus60': return '#DC2626';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#E2E8F0] rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#E2E8F0] rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="h-64 bg-[#E2E8F0] rounded-2xl lg:col-span-2"></div>
            <div className="h-64 bg-[#E2E8F0] rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const caFacture = (clientStats?.solde || 0) + (clientStats?.attente || 0);
  const encaissements = payments.reduce((s, p) => s + p.amount, 0);
  const creances = clientStats?.attente || 0;
  const dettes = fournisseurStats?.a_payer || 0;

  // Chart data — real payment data only
  const hasMonthlyData = monthlyStats && monthlyStats.months.length > 0;
  const cashFlowData = hasMonthlyData
    ? monthlyStats.months.map((month, i) => ({
        month,
        encaissements: monthlyStats.encaissements[i] || 0,
        decaissements: monthlyStats.decaissements[i] || 0,
        solde: (monthlyStats.encaissements[i] || 0) - (monthlyStats.decaissements[i] || 0),
      }))
    : [];

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-header"
      >
        <h1>Vue d'ensemble</h1>
        <p className="text-[#64748B] mt-1">Performance financière et situation comptable</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4"
      >
        <motion.div variants={item}>
          <KpiCard
            label="Factures émises"
            amount={formatFCFA(caFacture)}
            icon={<FileText className="w-5 h-5" />}
            iconColor="#173B6C"
            secondary="Total factures clients"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Encaissements reçus"
            amount={formatFCFA(encaissements)}
            icon={<CreditCard className="w-5 h-5" />}
            iconColor="#059669"
            secondary="Total encaissements reçus"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Créances clients"
            amount={formatFCFA(creances)}
            icon={<Clock className="w-5 h-5" />}
            iconColor="#DC2626"
            secondary="Factures non soldées"
          />
        </motion.div>
        <motion.div variants={item}>
          <KpiCard
            label="Dettes fournisseurs"
            amount={formatFCFA(dettes)}
            icon={<Truck className="w-5 h-5" />}
            iconColor="#F59E0B"
            secondary="Restant à payer fournisseurs"
          />
        </motion.div>
      </motion.div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5 lg:col-span-2"
        >
          <h3 className="font-bold text-[#111827] mb-4">Flux de trésorerie</h3>
          {hasMonthlyData ? (
            <CashFlowChart data={cashFlowData} />
          ) : (
            <div className="flex items-center justify-center h-48 text-[#64748B] text-sm">
              <div className="text-center">
                <p>Aucun mouvement de trésorerie sur cette période.</p>
                <p className="mt-1">Les encaissements et décaissements apparaîtront ici une fois enregistrés.</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-5"
        >
          <h3 className="font-bold text-[#111827] mb-4">Ancienneté des créances</h3>
          {totalUnpaid > 0 ? (
            <div className="space-y-3">
              {Object.entries(ageing).map(([key, bucket]) => {
                const percent = totalUnpaid > 0 ? (bucket.amount / totalUnpaid) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#111827]">{bucket.label}</span>
                      <span className="font-semibold text-[#111827]">{formatFCFA(bucket.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percent}%`, backgroundColor: ageingBarColor(key) }}
                        />
                      </div>
                      <span className="text-xs text-[#64748B] tabular-nums w-5 text-right">{bucket.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#065F46]">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Aucune créance en attente. Toutes les factures sont soldées.</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111827] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              Factures à relancer ({alerts.length})
            </h3>
            <Link to="/ventes/factures" className="text-sm text-[#2563EB] font-medium hover:underline">Voir tout</Link>
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                    alert.niveau === 'danger'
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{alert.message}</span>
                  <Link
                    to={alert.type === 'client' ? '/ventes/factures' : '/fournisseurs'}
                    className="text-xs font-semibold underline hover:no-underline flex items-center gap-1 shrink-0"
                  >
                    Voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#065F46]">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Tout est en ordre. Aucune alerte nécessitant une action.</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-5"
        >
          <h3 className="font-bold text-[#111827] mb-4">Actions rapides</h3>
          <div className="space-y-2">
            <Link to="/ventes/factures/nouvelle" className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4 text-[#173B6C]" />
              Nouvelle facture
            </Link>
            <Link to="/achats/depenses/nouvelle" className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-sm font-medium text-[#111827]">
              <Plus className="w-4 h-4 text-[#173B6C]" />
              Nouvelle dépense
            </Link>
            <Link to="/ventes/factures" className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-sm font-medium text-[#111827]">
              <Send className="w-4 h-4 text-[#F59E0B]" />
              Envoyer une relance
            </Link>
            <Link to="/rapports" className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-sm font-medium text-[#111827]">
              <BarChart3 className="w-4 h-4 text-[#64748B]" />
              Voir les rapports
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
