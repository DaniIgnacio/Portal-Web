import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SuscripcionPage.css";

function formatCL(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-CL", { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return dateStr; }
}

export default function SuscripcionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plan, setPlan] = useState<any | null>(null);
  const [ferreteriaId, setFerreteriaId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Leer usuario del LocalStorage (Ignoramos supabase.auth.getUser)
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setLoading(false);
          return; // No hay usuario
        }
        
        const user = JSON.parse(storedUser);
        if (user.id_ferreteria) {
           setFerreteriaId(user.id_ferreteria);

           // 2. Cargar suscripción directo de Supabase
           const { data: subData } = await supabase
             .from("ferreteria_subscription")
             .select("*")
             .eq("ferreteria_id", user.id_ferreteria)
             .order("created_at", { ascending: false })
             .limit(1)
             .single();

           if (subData) {
             setSubscription(subData);
             if (subData.plan_id) {
               const { data: planData } = await supabase
                 .from("subscription_plan")
                 .select("*")
                 .eq("id", subData.plan_id)
                 .single();
               setPlan(planData);
             }
           }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCancel = async () => {
     if(!subscription) return;
     if(!window.confirm("¿Cancelar suscripción?")) return;
     await supabase.from("ferreteria_subscription").update({ status: 'canceled' }).eq('id', subscription.id);
     window.location.reload();
  };

  if (loading) return <div className="p-8 text-center">⏳ Cargando suscripción...</div>;

  // Si no hay plan activo
  if (!subscription || subscription.status === 'canceled') {
    return (
      <div className="suscripcion-page">
        <div className="suscripcion-card empty">
          <h3>No tienes un plan activo</h3>
          <p>Selecciona un plan para activar las funcionalidades.</p>
          <button className="primary-btn" onClick={() => navigate("/dashboard/planes")}>
            Ver Planes
          </button>
        </div>
      </div>
    );
  }

  // Si hay plan activo
  return (
    <div className="suscripcion-page">
      <div className="suscripcion-header"><h2>Mi Suscripción</h2></div>

      <div className="suscripcion-card hero">
        <div className="hero-top">
          <span className="pill soft">Activo</span>
          <span className="status-badge active">CONFIRMADO</span>
        </div>

        <div className="plan-hero-head">
          <div>
            <h3 className="plan-hero-title">{plan?.name || "Plan Personalizado"}</h3>
            <p className="plan-hero-caption">Suscripción activa</p>
          </div>
          <div className="price-box accent">
             <div className="price-value">${plan?.monthly_price?.toLocaleString("es-CL")}</div>
             <div className="price-label">/mes</div>
          </div>
        </div>

        {/* Sección Visual de Días de Gracia */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: 0, color: '#166534', fontSize: '14px' }}>🛡️ BENEFICIOS ACTIVOS</h4>
            <p style={{ margin: '5px 0 0 0', color: '#14532d', fontSize: '0.95rem' }}>
               Tienes <strong>{plan?.grace_days || 0} días de gracia</strong> en caso de atraso en el pago.
            </p>
        </div>

        <div className="plan-hero-meta" style={{ marginTop: '20px' }}>
            <div className="meta">
              <span className="meta-label">Fecha Inicio</span>
              <span className="meta-value">{formatCL(subscription.starts_at)}</span>
            </div>
            <div className="meta">
              <span className="meta-label">Fecha Fin</span>
              <span className="meta-value">{formatCL(subscription.ends_at)}</span>
            </div>
        </div>

        <div className="actions-row">
            <button className="danger-btn" onClick={handleCancel}>Cancelar</button>
            <button className="ghost-btn" onClick={() => navigate("/dashboard/planes")}>Cambiar Plan</button>
        </div>
      </div>
    </div>
  );
}