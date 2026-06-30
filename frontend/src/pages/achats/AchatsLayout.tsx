import { Outlet, useLocation, Link } from 'react-router-dom';
import useScrollToTop from '../../hooks/useScrollToTop';

const tabs = [
  { to: '/achats/depenses', label: 'Dépenses', slug: 'depenses' },
  { to: '/achats/factures-fournisseurs', label: 'Factures fournisseurs', slug: 'factures-fournisseurs' },
  { to: '/achats/fournisseurs', label: 'Fournisseurs', slug: 'fournisseurs' },
  { to: '/achats/decaissements', label: 'Décaissements', slug: 'decaissements' },
];

export default function AchatsLayout() {
  const location = useLocation();
  useScrollToTop();

  const isActive = (to: string) => {
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  // Hide tabs on create/edit screens — each form page already shows its own PageHeader
  const isFormView = /\/(nouvelle|modifier|\d+\/modifier)(\/|$)/.test(location.pathname);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto" data-testid="achats-layout">
      {!isFormView && (
        <div className="tabs" data-testid="achats-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              data-testid={`achats-tab-${tab.slug}`}
              aria-selected={isActive(tab.to)}
              className={`tab ${isActive(tab.to) ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      <Outlet />
    </div>
  );
}
