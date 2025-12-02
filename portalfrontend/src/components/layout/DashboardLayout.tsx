import React from 'react';
import { Outlet } from 'react-router-dom'; 
import Sidebar from './Sidebar';
import Header from './Header';
import './DashboardLayout.css'; 

interface DashboardLayoutProps {
  onLogout: () => void;
  userName: string | null;
  isFerreteria?: boolean;
  isAdmin?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout, userName, isFerreteria = false, isAdmin = false }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar isFerreteria={isFerreteria} isAdmin={isAdmin} />
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