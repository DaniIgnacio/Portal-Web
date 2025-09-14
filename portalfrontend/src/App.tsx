import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import DashboardLayout from './components/DashboardLayout';
import LoginProveedor from './pages/Login';
import RegistroProveedor from './pages/Registro';
import CategoriasPage from './pages/CategoriasPage';
import ProductosPage from './pages/ProductosPage';

import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); 
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      {}
      <Route 
        path="/login" 
        element={!session ? <LoginProveedor /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/registro" 
        element={!session ? <RegistroProveedor /> : <Navigate to="/dashboard" />} 
      />

      {}
      <Route 
        path="/" 
        element={session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
      />

      {}
      <Route 
        path="/dashboard" 
        element={session ? <DashboardLayout /> : <Navigate to="/login" />}
      >
        {}
        <Route index element={<Navigate to="productos" replace />} /> 
        <Route path="productos" element={<ProductosPage />} />
        <Route path="categorias" element={<CategoriasPage />} />
        {}
      </Route>

      {}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;