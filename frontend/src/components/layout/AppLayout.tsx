import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import useScrollToTop from '../../hooks/useScrollToTop';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useScrollToTop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  const sidebarWidth = sidebarCollapsed ? 76 : 248;

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Header */}
      <Header
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <main
        className="pt-[72px] transition-all duration-250"
        style={{ marginLeft: windowWidth >= 1024 ? sidebarWidth : 0 }}
      >
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
