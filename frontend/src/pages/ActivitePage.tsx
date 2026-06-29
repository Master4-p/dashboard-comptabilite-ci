import { useEffect, useState } from 'react';
import { Activity, FileText, CreditCard, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/ui/PageShell';
import { clientsApi, fournisseursApi, type ClientItem, type FournisseurItem } from '../lib/api';
import { formatFCFA, formatDate } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../context/ToastContext';

interface ActivityItem {
  id: number;
  source: 'client' | 'fournisseur';
  type: string;
  numero: string;
  nom: string;
  montant: number;
  statut: string;
  date: string;
}

export default function ActivitePage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetch() {
      try {
        const [clients, fournisseurs] = await Promise.all([
          clientsApi.list({}),
          fournisseursApi.list({}),
        ]);
        const mappedClients: ActivityItem[] = (clients as ClientItem[]).slice(0, 10).map(c => ({
          id: c.id, source: 'client' as const, type: c.type, numero: c.numero, nom: c.client,
          montant: c.montant, statut: c.statut, date: c.date_emission,
        }));
        const mappedFournisseurs: ActivityItem[] = (fournisseurs as FournisseurItem[]).slice(0, 10).map(f => ({
          id: f.id, source: 'fournisseur' as const, type: f.type, numero: f.numero || '', nom: f.fournisseur,
          montant: f.montant, statut: f.statut, date: f.date_depense,
        }));
        const all = [...mappedClients, ...mappedFournisseurs]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 15);
        setActivities(all);
      } catch (e) {
        addToast('error', 'Erreur chargement des activités.');
        console.error(e);
      }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return (
    <PageShell title="Activité" subtitle="Chargement...">
      <div className="animate-pulse space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#E2E8F0] rounded-lg" />)}
      </div>
    </PageShell>
  );

  return (
    <PageShell title="Activité" subtitle="Historique des opérations et événements récents">
      {activities.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[#E2E8F0]">
            {activities.map((a, i) => (
              <motion.div
                key={`${a.source}-${a.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  a.source === 'client' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#FEF2F2] text-[#DC2626]'
                }`}>
                  {a.source === 'client' ? <FileText className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#111827] text-sm truncate">
                    {a.type === 'proforma' ? 'Proforma' : a.source === 'client' ? 'Facture' : 'Dépense'} {a.numero}
                    <span className="text-[#94A3B8] mx-1">·</span>
                    {a.nom}
                  </div>
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(a.date)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-[#1E293B] text-sm">{formatFCFA(a.montant)}</div>
                  <StatusBadge statut={a.statut} type={a.source} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Activity className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[#64748B]">Aucune activité récente à afficher.</p>
        </div>
      )}
    </PageShell>
  );
}
