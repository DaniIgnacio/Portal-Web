import React from 'react';
import { Outlet } from 'react-router-dom'; 
import Sidebar from './Sidebar';
import Header from './Header';
import './DashboardLayout.css'; 

interface DashboardLayoutProps {
  onLogout: () => void;
  userName: string | null; // Nuevo prop para el nombre de usuario
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout, userName }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} userName={userName} /> {/* Pasar userName al Header */}
        <main className="content-area">
          <Outlet /> {}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;