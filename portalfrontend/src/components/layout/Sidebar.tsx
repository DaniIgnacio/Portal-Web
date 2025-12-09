import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isFerreteria?: boolean;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isFerreteria = false, isAdmin = false }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Geoferre Portal</h1> {/* Cambiado a h1 para semántica */}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* Admin: solo ferreterias, categorias, clientes */}
          {isAdmin ? (
            <>
              <li><NavLink to="/dashboard/ferreterias">Ferreterías</NavLink></li>
              <li><NavLink to="/dashboard/categorias">Categorías</NavLink></li>
              <li><NavLink to="/dashboard/clientes">Clientes</NavLink></li>
            </>
          ) : isFerreteria ? (
            <>
              <li><NavLink to="/dashboard/productos">Productos</NavLink></li>
              <li><NavLink to="/dashboard/pedidos">Pedidos</NavLink></li>
              <li><NavLink to="/dashboard/perfil">Mi Perfil</NavLink></li>
              <li><NavLink to="/dashboard/suscripcion">Mi Suscripción</NavLink></li>

            </>
          ) : (
            <>
              {/* Usuarios sin rol (cliente simple) no tienen opciones de dashboard */}
            </>
          )}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>© 2025 Geoferre. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default Sidebar;
