import { useState } from 'react';
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

// Pages
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Sales from './pages/Sales.tsx';
import Products from './pages/Products.tsx';
import Clients from './pages/Clients.tsx';
import Cash from './pages/Cash.tsx';
import Categories from './pages/Categories.tsx';
import { useAuthStore } from './store/useStore.ts';

// UI Components
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { useToast } from './hooks/useToast.ts';
import { ToastContainer } from './components/ui/ToastContainer.tsx';

export default function App() {
  const { isAuthenticated, login } = useAuthStore();
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <HashRouter>
          <Routes>
            {/* Public Route */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sales" element={<Sales />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="clients" element={<Clients />} />
              <Route path="cash" element={<Cash />} />
            </Route>
          </Routes>
        </HashRouter>
        </ThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}
