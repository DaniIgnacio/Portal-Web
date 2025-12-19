import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// La línea de SupabaseClient ya no es necesaria si no se usa su cliente de autenticación directamente
// import { supabase } from './supabaseClient';
// La interfaz Session de Supabase ya no es necesaria
// import { Session } from '@supabase/supabase-js';
import DashboardLayout from './components/layout/DashboardLayout';
import PedidosPage from './pages/PedidosPage';
import ClientesPage from './pages/ClientesPage';
import LoginProveedor from './components/auth/Login';
import RegistroProveedor from './components/auth/Registro';
import CategoriasPage from './pages/CategoriasPage';
import ProductosPage from './pages/ProductosPage';
import FerreteriasPage from './pages/FerreteriasPage';
import PerfilPage from './pages/PerfilPage'; // Nuevo import para PerfilPage
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Nuevo import para ForgotPasswordPage
import ResetPasswordPage from './pages/ResetPasswordPage'; // Nuevo import para ResetPasswordPage
import CompletarFerreteriaPage from './pages/CompletarFerreteriaPage';
import { useNotifications } from './hooks/useNotifications';
import SuscripcionPage from "./pages/SuscripcionPage";
import PlanesPage from "./pages/PlanesPage";
import AnalisisPage from "./pages/AnalisisPage";




import './App.css';

function App() {
  const { addNotification } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null); // Nuevo estado para el nombre de usuario
  const [isFerreteria, setIsFerreteria] = useState<boolean>(false); // Detecta si el usuario es ferretería
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Detecta si el usuario es admin
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any | null>(null);


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
      setIsFerreteria(!!user.id_ferreteria);
      setIsAdmin(user.rol === 'admin');
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      setUserName(null);
      setIsAdmin(false);
    }
  };
  const loadSubscription = async (id_ferreteria: string) => {
      // CAMBIO AQUÍ: Agregamos '/api' y aseguramos la URL completa
      // Puedes usar la variable de entorno si la tienes configurada con /api, 
      // pero para ir a la segura úsalo así por ahora:
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const res = await fetch(`${backendUrl}/api/suscripcion/get`, { // 👈 ¡OJO AQUÍ! Agregamos /api
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_ferreteria }),
        });

        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        } else {
          // Si falla (ej. 404), no intentamos parsear JSON para evitar el error de sintaxis
          console.warn("No se pudo cargar la suscripción", res.status);
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error de red al cargar suscripción", error);
        setSubscription(null);
      }
    }



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserName(null); // Limpiar el nombre al cerrar sesión
    setIsFerreteria(false);
    setIsAdmin(false);
    navigate('/login');
    addNotification('Sesión cerrada exitosamente.', 'info');
  };

  const handleLoginSuccess = (user: any, token: string) => {
    handleAuthSuccess(token, JSON.stringify(user));
    if (user.rol === 'admin') {
      navigate('/dashboard');
      addNotification('¡Inicio de sesión exitoso!', 'success');
    } else if (!user.id_ferreteria) {
      // Usuario viene, por ejemplo, desde app móvil como "cliente" sin ferretería asociada
      addNotification('Bienvenido. Completa los datos de tu ferretería para continuar.', 'info');
      navigate('/completar-ferreteria');
    } else {
      navigate('/dashboard');
      addNotification('¡Inicio de sesión exitoso!', 'success');
    }
    if (user.id_ferreteria) {
    loadSubscription(user.id_ferreteria);
  }

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

      <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* Nueva ruta para ForgotPasswordPage */}

      <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Nueva ruta para ResetPasswordPage */}

      <Route
        path="/completar-ferreteria"
        element={isAuthenticated ? <CompletarFerreteriaPage /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardLayout 
          onLogout={handleLogout} 
          userName={userName} 
          isFerreteria={isFerreteria} 
          isAdmin={isAdmin} 
          subscription={subscription}
          /> : <Navigate to="/login" />}
      >
        {/* Rutas para ferretería */}
        {isFerreteria && <Route index element={<Navigate to="productos" replace />} />}
        {isFerreteria && <Route path="productos" element={<ProductosPage />} />}
        {isFerreteria && <Route path="pedidos" element={<PedidosPage />} />}
        {isFerreteria && <Route path="analisis" element={<AnalisisPage />} />}
        {isFerreteria && <Route path="perfil" element={<PerfilPage />} />}
        {isFerreteria && <Route path="suscripcion" element={<SuscripcionPage />} />}
        {isFerreteria && <Route path="planes" element={<PlanesPage />} />} 

        
        {/* Rutas para admin */}
        {isAdmin && <Route index element={<Navigate to="ferreterias" replace />} />}
        {isAdmin && <Route path="ferreterias" element={<FerreteriasPage />} />}
        {isAdmin && <Route path="categorias" element={<CategoriasPage />} />}
        {isAdmin && <Route path="clientes" element={<ClientesPage />} />}
        {isAdmin && <Route path="analisis" element={<AnalisisPage />} />}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
