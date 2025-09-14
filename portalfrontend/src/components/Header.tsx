import React from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from './LogoutIcon'; 
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-title">
        <h2>Gestión de Inventario</h2>
      </div>
      <div className="header-user-menu">
        <button onClick={handleLogout} className="logout-button">
          <LogoutIcon /> {}
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Header;