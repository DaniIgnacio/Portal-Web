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
  subscription?: any;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  onLogout, 
  userName,
  isFerreteria = false,
  isAdmin = false,
  subscription
}) => {
  return (
    <div className="dashboard-layout">
      <Sidebar isFerreteria={isFerreteria} isAdmin={isAdmin} />
      
      <div className="main-content">
        <Header onLogout={onLogout} userName={userName} />

        {/* 🔥 Banner inteligente */}
        {isFerreteria && subscription && (
          <div
            style={{
              background: subscription.is_trial
                ? "#1e88e5"
                : subscription.status === "vencida"
                ? "#ffb300"
                : subscription.status === "suspendida"
                ? "#d32f2f"
                : "#43a047",
              color: "white",
              padding: "12px",
              margin: "10px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 500
            }}
          >
            {subscription.is_trial && (
              <>Estás en período de prueba. Te quedan {subscription.dias_restantes} días.</>
            )}

            {!subscription.is_trial && subscription.status === "activa" && (
              <>Suscripción activa.</>
            )}

            {subscription.status === "vencida" && (
              <>Tu suscripción ha vencido. Debes seleccionar un plan.</>
            )}

            {subscription.status === "suspendida" && (
              <>Tu suscripción está suspendida. No podrás aparecer en la app ni recibir pedidos.</>
            )}
          </div>
        )}

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
