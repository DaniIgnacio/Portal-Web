import React from 'react';
// Las líneas de supabaseClient y useNavigate ya no son necesarias
// import { supabase } from '../../supabaseClient';
// import { useNavigate } from 'react-router-dom';
import LogoutIcon from './LogoutIcon'; 
import './Header.css';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  // La línea de useNavigate ya no es necesaria
  // const navigate = useNavigate();

  // La lógica de cerrar sesión ahora se maneja en App.tsx y se pasa como prop
  // const handleLogout = async () => {
  //   const { error } = await supabase.auth.signOut();
  //   if (error) {
  //     console.error('Error al cerrar sesión:', error);
  //   } else {
  //     navigate('/login');
  //   }
  // };

  return (
    <header className="header">
      <div className="header-title">
        <h2>Gestión de Inventario</h2>
      </div>
      <div className="header-user-menu">
        <button onClick={onLogout} className="logout-button">
          <LogoutIcon /> {}
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Header;