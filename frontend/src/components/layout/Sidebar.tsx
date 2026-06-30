import { Link, useLocation } from 'react-router-dom';
import {
  Command, Circle, Bell, CreditCard, FileText, Settings, BarChart3, FolderOpen, Wallet, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Command, label: 'Vue d\'ensemble' },
  { to: '/activite', icon: Circle, label: 'Activité' },
  { to: '/alertes', icon: Bell, label: 'Alertes' },
  { to: '/ventes', icon: FileText, label: 'Ventes' },
  { to: '/achats', icon: CreditCard, label: 'Achats' },
  { to: '/tresorerie', icon: Wallet, label: 'Trésorerie' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/rapports', icon: BarChart3, label: 'Rapports' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

function SidebarItem({ to, icon: Icon, label, collapsed, active }: { to: string; icon: any; label: string; collapsed: boolean; active: boolean }) {
  return (
    <Link
      to={to}
      data-testid={`sidebar-link-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className={`sidebar-nav-item text-sm ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      <Icon className="sidebar-icon w-5 h-5" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onClose, onToggle }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void; onToggle?: () => void }) {
  const location = useLocation();
  const width = collapsed ? 72 : 232;

  // Determine if a route is active (exact match or parent match for ventes/achats)
  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    if (to === '/ventes') return location.pathname.startsWith('/ventes');
    if (to === '/achats') return location.pathname.startsWith('/achats');
    return location.pathname === to;
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className="sidebar px-2"
        style={{
          width: mobileOpen ? 232 : width,
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Logo */}
        <div className="h-[64px] flex items-center px-4 border-b border-[#E2E8F0]">
          <img
            src="/logo-sm.png"
            alt="Relais IT"
            className="w-9 h-9 rounded-lg object-contain shrink-0"
            style={{ background: 'white' }}
          />
          {!collapsed && !mobileOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="font-bold text-[15px] text-[#111827] leading-tight">Relais IT</div>
              <div className="text-[11px] text-[#94A3B8] leading-tight">Comptabilité</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed && !mobileOpen}
              active={isActive(item.to)}
            />
          ))}
        </nav>

        {/* Bottom avatar + toggle */}
        <div className="p-3 border-t border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F1F5F9] cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#173B6C] flex items-center justify-center text-white text-sm font-bold shrink-0">
              CI
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="overflow-hidden flex-1">
                <div className="text-sm font-medium text-[#111827] truncate">Côte d'Ivoire</div>
                <div className="text-xs text-[#94A3B8] truncate">FCFA</div>
              </div>
            )}
            <button onClick={onToggle} className="btn-icon hidden lg:flex" title={collapsed ? 'Étendre' : 'Réduire'}>
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
