import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/ui/PageShell';
import { alertsApi, type Alert } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    alertsApi.list().then(data => { setAlerts(data); setLoading(false); }).catch(() => {
      addToast('error', 'Erreur chargement des alertes.');
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <PageShell title="Alertes" subtitle="Chargement...">
      <div className="animate-pulse space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-[#E2E8F0] rounded-lg" />)}
      </div>
    </PageShell>
  );

  return (
    <PageShell title="Alertes" subtitle="Échéances, impayés et actions nécessitant votre attention">
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                alert.niveau === 'danger'
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-sm">{alert.message}</span>
              <Link
                to={alert.type === 'client' ? '/clients' : '/fournisseurs'}
                className="text-xs font-semibold underline hover:no-underline flex items-center gap-1 shrink-0"
              >
                Voir <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#059669] mx-auto mb-4" />
          <p className="text-[#64748B]">Tout est en ordre. Aucune alerte nécessitant une action.</p>
        </div>
      )}
    </PageShell>
  );
}
