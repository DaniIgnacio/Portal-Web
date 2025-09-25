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
import PerfilPage from './pages/PerfilPage'; // Nuevo import para PerfilPage
import { useNotifications } from './hooks/useNotifications';
import NotificationContainer from './components/common/Notification';

import './App.css';

function App() {
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null); // Nuevo estado para el nombre de usuario
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      // Mantenemos la lógica de parseo aquí para el initial load
      handleAuthSuccess(token, storedUser);
    } else {
      setIsAuthenticated(false);
      setUserName(null); // Asegurarse de que el nombre se borra al no estar autenticado
    }
    setLoading(false);
  }, []);

  // Nueva función para manejar el éxito de autenticación y actualizar estados
  const handleAuthSuccess = (token: string, userString: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', userString);
    setIsAuthenticated(true);
    try {
      const user = JSON.parse(userString);
      setUserName(user.nombre); // Establecer el nombre del usuario
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      setUserName(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserName(null); // Limpiar el nombre al cerrar sesión
    navigate('/login');
    addNotification('Sesión cerrada exitosamente.', 'info');
  };

  const handleLoginSuccess = (user: any, token: string) => {
    handleAuthSuccess(token, JSON.stringify(user));
    navigate('/dashboard');
    addNotification('¡Inicio de sesión exitoso!', 'success');
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginProveedor onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/registro"
        element={!isAuthenticated ? <RegistroProveedor onRegisterSuccess={() => navigate('/login')} /> : <Navigate to="/dashboard" />} // Pasa un callback para redireccionar
      />

      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardLayout onLogout={handleLogout} userName={userName} /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="productos" replace />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="categorias" element={<CategoriasPage />} />
        <Route path="ferreterias" element={<FerreteriasPage />} />
        <Route path="perfil" element={<PerfilPage />} /> {/* Nueva ruta para PerfilPage */}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
