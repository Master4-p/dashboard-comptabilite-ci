import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Hash, Save, LogOut, User, Bell, ToggleLeft, ToggleRight } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ParametresPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [company, setCompany] = useState({
    name: 'Relais IT',
    address: 'Abidjan, Côte d\'Ivoire',
    phone: '+225 20 00 00 00',
    email: 'contact@relaisit.ci',
    nif: '000000000000',
    rccm: 'CI-ABJ-0000',
  });
  const [showThousands, setShowThousands] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [currency, setCurrency] = useState('FCFA');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());

  const handleSave = () => {
    addToast('success', 'Informations entreprise sauvegardées.');
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-[#64748B] mb-1.5";

  return (
    <PageShell title="Paramètres" subtitle="Configurez l'entreprise, la numérotation et les préférences">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations entreprise */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-[#173B6C]" />
            <h3 className="font-bold text-[#111827]">Informations entreprise</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nom de l'entreprise</label>
              <input className={inputClass} value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input className={`${inputClass} pl-10`} value={company.address} onChange={e => setCompany({...company, address: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input className={`${inputClass} pl-10`} value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input className={`${inputClass} pl-10`} value={company.email} onChange={e => setCompany({...company, email: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>NIF</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input className={`${inputClass} pl-10`} value={company.nif} onChange={e => setCompany({...company, nif: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>RCCM</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input className={`${inputClass} pl-10`} value={company.rccm} onChange={e => setCompany({...company, rccm: e.target.value})} />
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173B6C] text-white text-sm font-medium hover:bg-[#1e4a8a] transition-colors mt-2">
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </motion.div>

        {/* Préférences + Compte */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-[#111827]">Préférences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#334155]">Afficher les montants en milliers (K)</span>
                <button onClick={() => setShowThousands(!showThousands)} className="transition-colors">
                  {showThousands ? <ToggleRight className="w-10 h-6 text-[#2563EB]" /> : <ToggleLeft className="w-10 h-6 text-[#94A3B8]" />}
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#334155]">Notifications par email</span>
                <button onClick={() => setEmailNotif(!emailNotif)} className="transition-colors">
                  {emailNotif ? <ToggleRight className="w-10 h-6 text-[#2563EB]" /> : <ToggleLeft className="w-10 h-6 text-[#94A3B8]" />}
                </button>
              </div>
              <div>
                <label className={labelClass}>Devise par défaut</label>
                <select className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="FCFA">FCFA (Franc CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Exercice fiscal</label>
                <select className={inputClass} value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="font-bold text-[#111827]">Compte utilisateur</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#173B6C] text-white flex items-center justify-center font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-medium text-[#111827]">{user?.name || 'Utilisateur'}</div>
                  <div className="text-sm text-[#94A3B8]">{user?.email || 'email@relaisit.ci'}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <button onClick={() => alert('Fonctionnalité à venir')} className="w-full text-left py-2 text-sm text-[#64748B] hover:text-[#111827] transition-colors">
                  Changer le mot de passe
                </button>
                <button onClick={logout} className="w-full text-left py-2 text-sm text-[#DC2626] hover:text-[#991B1B] transition-colors flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
