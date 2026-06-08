import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import darkTheme from './styles/theme.ts';

// Disable SSR warnings for emotion which are irrelevant in an Electron (client-only) app
const emotionCache = createCache({
  key: 'css',
  prepend: true,
});
// @ts-ignore - Hidden property to turn off SSR pseudo-class warnings
emotionCache.compat = true;

// Layouts
import MainLayout from './components/layout/MainLayout.tsx';

// UI Components
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { useToast } from './hooks/useToast.ts';
import { ToastContainer } from './components/ui/ToastContainer.tsx';
import { useAuthStore } from './store/useStore.ts';
import { useGlobalShortcuts } from './hooks/useKeyboardShortcut.ts';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login.tsx'));
const Setup = lazy(() => import('./pages/Setup.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Sales = lazy(() => import('./pages/Sales.tsx'));
const SalesHistory = lazy(() => import('./pages/SalesHistory.tsx'));
const Products = lazy(() => import('./pages/Products.tsx'));
const Clients = lazy(() => import('./pages/Clients.tsx'));
const Cash = lazy(() => import('./pages/Cash.tsx'));
const Categories = lazy(() => import('./pages/Categories.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const Users = lazy(() => import('./pages/Users.tsx'));
const CashHistory = lazy(() => import('./pages/CashHistory.tsx'));
const InventoryMovements = lazy(() => import('./pages/InventoryMovements.tsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.tsx'));
const Purchases = lazy(() => import('./pages/Purchases.tsx'));
const Reports = lazy(() => import('./pages/Reports.tsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, login, logout } = useAuthStore();
  const { toasts, removeToast } = useToast();
  const [setupNeeded, setSetupNeeded] = useState<boolean | null>(null);

  // On mount and whenever auth state changes, verify the main process session
  useEffect(() => {
    async function verifySession() {
      if (isAuthenticated && window.api?.checkSession) {
        const result = await window.api.checkSession();
        if (!result.authenticated) {
          logout();
        }
      }
    }
    verifySession();
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (window.api?.checkSetupStatus) {
      window.api.checkSetupStatus().then(res => {
        setSetupNeeded(res.needsSetup);
      }).catch(() => {
        setSetupNeeded(false);
      });
    } else {
      setSetupNeeded(false);
    }
  }, []);

  // Initialize global keyboard shortcuts
  useGlobalShortcuts();

  if (setupNeeded === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <HashRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/setup"
                  element={
                    setupNeeded ? <Setup onComplete={(user) => { if (user) login(user); setSetupNeeded(false); }} /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/login"
                  element={
                    setupNeeded ? <Navigate to="/setup" replace /> :
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    setupNeeded ? <Navigate to="/setup" replace /> :
                    isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="sales-history" element={<SalesHistory />} />
                  <Route path="products" element={<Products />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="cash" element={<Cash />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="users" element={<Users />} />
                  <Route path="cash-history" element={<CashHistory />} />
                  <Route path="movements" element={<InventoryMovements />} />
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route path="purchases" element={<Purchases />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
              </Routes>
            </Suspense>
          </HashRouter>
        </ThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}
