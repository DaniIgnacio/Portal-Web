import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css'; 

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Geobra Portal</h3>
      </div>
      <nav className="sidebar-nav">
        {}
        <NavLink to="/dashboard/productos">Productos</NavLink>
        <NavLink to="/dashboard/categorias">Categorías</NavLink>
        <NavLink to="/dashboard/pedidos">Pedidos</NavLink>
        <NavLink to="/dashboard/perfil">Mi Perfil</NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;