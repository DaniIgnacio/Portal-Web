import React from 'react';
import { Outlet } from 'react-router-dom'; 
import Sidebar from './Sidebar';
import Header from './Header';
import './DashboardLayout.css'; 

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} />
        <main className="content-area">
          <Outlet /> {}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;