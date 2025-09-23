import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Geobra Portal</h1> {/* Cambiado a h1 para semántica */}
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><NavLink to="/dashboard/productos">Productos</NavLink></li>
          <li><NavLink to="/dashboard/categorias">Categorías</NavLink></li>
          <li><NavLink to="/dashboard/ferreterias">Ferreterías</NavLink></li>
          <li><NavLink to="/dashboard/pedidos">Pedidos</NavLink></li>
          <li><NavLink to="/dashboard/perfil">Mi Perfil</NavLink></li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>© 2025 Geobra. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default Sidebar;
