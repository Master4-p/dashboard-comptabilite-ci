import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScrollToTop from '../../hooks/useScrollToTop';

const tabs = [
  { to: '/achats/depenses', label: 'Dépenses' },
  { to: '/achats/factures-fournisseurs', label: 'Factures fournisseurs' },
  { to: '/achats/fournisseurs', label: 'Fournisseurs' },
  { to: '/achats/decaissements', label: 'Décaissements' },
];

export default function AchatsLayout() {
  const location = useLocation();
  useScrollToTop();

  const isActive = (to: string) => {
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <nav className="text-xs text-[#94A3B8] mb-2 flex items-center gap-1">
          <span>Relais IT</span>
          <span className="text-[#CBD5E1]">/</span>
          <span>Achats</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#111827]">Achats</h1>
        <p className="text-sm text-[#64748B] mt-1">Dépenses, factures fournisseurs et paiements</p>
      </motion.div>

      <div className="tabs mb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`tab ${isActive(tab.to) ? 'active' : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
