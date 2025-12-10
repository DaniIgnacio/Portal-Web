import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const GEOFERRE_LOGO_URL =
  'https://bhlsmetxwtqypdyxcmyk.supabase.co/storage/v1/object/sign/img/760568fe-1610-467f-8fee-8e964131647a.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jOTYxYjljOS1mOWZmLTQzZDUtYWIzNS1iOWVmYTI4ODhlOWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvNzYwNTY4ZmUtMTYxMC00NjdmLThmZWUtOGU5NjQxMzE2NDdhLmpwZyIsImlhdCI6MTc2NTMzMTYwNiwiZXhwIjoxNzk2ODY3NjA2fQ.ubjRS4NKqD8rrlQPv246aaFuB3_wwgNAzhP8DjIzVZs';


interface SidebarProps {
  isFerreteria?: boolean;
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isFerreteria = false, isAdmin = false }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img
          src={GEOFERRE_LOGO_URL}
          alt="Geoferre"
          className="sidebar-logo"
        />
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
