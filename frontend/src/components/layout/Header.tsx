import { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, ChevronDown, Plus, FileText,
  CreditCard, Settings, LogOut, Menu, PanelLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const nouveauItems = [
  { label: 'Nouvelle facture', icon: FileText, to: '/ventes/factures/nouvelle' },
  { label: 'Nouvelle proforma', icon: FileText, to: '/ventes/proformas/nouvelle' },
  { label: 'Nouvelle dépense', icon: CreditCard, to: '/achats/depenses/nouvelle' },
];

export default function Header({ onMenuToggle, onSidebarToggle }: { onMenuToggle: () => void; onSidebarToggle: () => void }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [nouveauOpen, setNouveauOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const nouveauRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (nouveauRef.current && !nouveauRef.current.contains(e.target as Node)) setNouveauOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentYear = new Date().getFullYear();
  const currentPeriod = `Exercice ${currentYear}`;
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="app-header px-6">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="btn-icon lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={onSidebarToggle} className="btn-icon hidden lg:flex" title="Basculer la sidebar">
          <PanelLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Center — Search */}
      <div className="flex-1 max-w-2xl min-w-[320px] hidden md:flex justify-center">
        <div className="search-command w-full">
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder="Rechercher une facture, un client ou un fournisseur…"
            readOnly
          />
          <div className="search-kbd">Ctrl K</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="btn-icon md:hidden">
          <Search className="w-5 h-5 text-[#64748B]" />
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B] font-medium">
          <span>{currentPeriod}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>

        <div className="relative" ref={nouveauRef}>
          <button
            onClick={() => setNouveauOpen(!nouveauOpen)}
            className="btn btn-primary btn-sm flex items-center gap-2 h-10 px-4"
            title="Créer un nouveau document"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {nouveauOpen && (
            <div className="dropdown-menu absolute right-0 top-full mt-2 z-50">
              {nouveauItems.map((item) => (
                <a
                  key={item.label}
                  href={item.to}
                  className="dropdown-item w-full text-left flex items-center gap-2"
                  onClick={() => setNouveauOpen(false)}
                >
                  <item.icon className="w-4 h-4 text-[#64748B]" />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="btn-icon relative">
            <Bell className="w-5 h-5 text-[#64748B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full border-2 border-white" />
          </button>
          {notifOpen && (
            <div className="dropdown-menu absolute right-0 top-full mt-2 z-50 w-80">
              <div className="px-3 py-2 text-sm font-semibold text-[#111827]">Notifications</div>
              <div className="dropdown-divider" />
              <div className="px-3 py-4 text-sm text-[#94A3B8] text-center">Aucune notification</div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-lg hover:bg-[#F1F5F9] transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#173B6C] flex items-center justify-center text-white text-sm font-bold">
              {userInitial}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#111827] leading-tight">{user?.name || 'Utilisateur'}</div>
              <div className="text-[10px] text-[#94A3B8] leading-tight">{user?.email || ''}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden sm:block" />
          </button>
          {profileOpen && (
            <div className="dropdown-menu absolute right-0 top-full mt-2 z-50">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold text-[#111827]">{user?.name || 'Utilisateur'}</div>
                <div className="text-xs text-[#94A3B8]">{user?.email || ''}</div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item w-full text-left">
                <Settings className="w-4 h-4 text-[#64748B]" />
                <span>Paramètres</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item w-full text-left danger" onClick={() => { addToast('info', 'Vous avez été déconnecté.'); logout(); }}>
                <LogOut className="w-4 h-4 text-[#DC2626]" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
