import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import darkTheme from './styles/theme.ts';

// Layouts
import MainLayout from './components/layout/MainLayout.tsx';

// Pages
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Sales from './pages/Sales.tsx';
import Products from './pages/Products.tsx';
import Clients from './pages/Clients.tsx';
import Cash from './pages/Cash.tsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          {/* Public Route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />
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
            <Route path="clients" element={<Clients />} />
            <Route path="cash" element={<Cash />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
