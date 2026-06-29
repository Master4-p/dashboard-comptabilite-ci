import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import ActivitePage from './pages/ActivitePage';
import AlertesPage from './pages/AlertesPage';
import TresoreriePage from './pages/TresoreriePage';
import DocumentsPage from './pages/DocumentsPage';
import RapportsPage from './pages/RapportsPage';
import ParametresPage from './pages/ParametresPage';

// Ventes
import VentesLayout from './pages/ventes/VentesLayout';
import FacturesListPage from './pages/ventes/FacturesListPage';
import ProformasListPage from './pages/ventes/ProformasListPage';
import EncaissementsPage from './pages/ventes/EncaissementsPage';
import ClientsDirectoryPage from './pages/ventes/ClientsDirectoryPage';
import NouvelleFacturePage from './pages/ventes/NouvelleFacturePage';
import NouvelleProformaPage from './pages/ventes/NouvelleProformaPage';

// Achats
import AchatsLayout from './pages/achats/AchatsLayout';
import DepensesListPage from './pages/achats/DepensesListPage';
import FacturesFournisseursPage from './pages/achats/FacturesFournisseursPage';
import DecaissementsPage from './pages/achats/DecaissementsPage';
import FournisseursDirectoryPage from './pages/achats/FournisseursDirectoryPage';
import NouvelleDepensePage from './pages/achats/NouvelleDepensePage';

function AppLayoutRoutes() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayoutRoutes />}>
            {/* Core pages */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/activite" element={<ActivitePage />} />
            <Route path="/alertes" element={<AlertesPage />} />

            {/* Ventes section */}
            <Route path="/ventes" element={<VentesLayout />}>
              <Route path="factures" element={<FacturesListPage />} />
              <Route path="factures/nouvelle" element={<NouvelleFacturePage />} />
              <Route path="factures/:id/modifier" element={<NouvelleFacturePage />} />
              <Route path="proformas" element={<ProformasListPage />} />
              <Route path="proformas/nouvelle" element={<NouvelleProformaPage />} />
              <Route path="proformas/:id/modifier" element={<NouvelleProformaPage />} />
              <Route path="clients" element={<ClientsDirectoryPage />} />
              <Route path="encaissements" element={<EncaissementsPage />} />
              <Route index element={<Navigate to="factures" replace />} />
            </Route>

            {/* Achats section */}
            <Route path="/achats" element={<AchatsLayout />}>
              <Route path="depenses" element={<DepensesListPage />} />
              <Route path="depenses/nouvelle" element={<NouvelleDepensePage />} />
              <Route path="factures-fournisseurs" element={<FacturesFournisseursPage />} />
              <Route path="fournisseurs" element={<FournisseursDirectoryPage />} />
              <Route path="decaissements" element={<DecaissementsPage />} />
              <Route index element={<Navigate to="depenses" replace />} />
            </Route>

            {/* Backward-compatible redirects */}
            <Route path="/clients" element={<Navigate to="/ventes/factures" replace />} />
            <Route path="/clients-list" element={<Navigate to="/ventes/clients" replace />} />
            <Route path="/proformas" element={<Navigate to="/ventes/proformas" replace />} />
            <Route path="/encaissements" element={<Navigate to="/ventes/encaissements" replace />} />
            <Route path="/fournisseurs" element={<Navigate to="/achats/depenses" replace />} />
            <Route path="/fournisseurs-list" element={<Navigate to="/achats/fournisseurs" replace />} />
            <Route path="/factures-fournisseurs" element={<Navigate to="/achats/factures-fournisseurs" replace />} />
            <Route path="/decaissements" element={<Navigate to="/achats/decaissements" replace />} />

            {/* Gestion */}
            <Route path="/tresorerie" element={<TresoreriePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
          </Route>
        </Routes>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
