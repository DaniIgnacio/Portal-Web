import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// La línea de SupabaseClient ya no es necesaria si no se usa su cliente de autenticación directamente
// import { supabase } from './supabaseClient';
// La interfaz Session de Supabase ya no es necesaria
// import { Session } from '@supabase/supabase-js';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginProveedor from './components/auth/Login';
import RegistroProveedor from './components/auth/Registro';
import CategoriasPage from './pages/CategoriasPage';
import ProductosPage from './pages/ProductosPage';
import FerreteriasPage from './pages/FerreteriasPage';
import { useNotifications } from './hooks/useNotifications';
import NotificationContainer from './components/common/Notification';

import './App.css';

function App() {
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
    addNotification('Sesión cerrada exitosamente.', 'info');
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginProveedor setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/registro"
        element={!isAuthenticated ? <RegistroProveedor /> : <Navigate to="/dashboard" />}
      />

      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardLayout onLogout={handleLogout} /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="productos" replace />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="categorias" element={<CategoriasPage />} />
        <Route path="ferreterias" element={<FerreteriasPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
