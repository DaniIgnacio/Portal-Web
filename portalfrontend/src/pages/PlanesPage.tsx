import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./PlanesPage.css";

interface Plan {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  grace_days: number;
  features: Record<string, any>;
}

function nowChileISO(baseDate: Date = new Date()) {
  const chile = new Date(baseDate.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const offset = -chile.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");

  return (
    chile.getFullYear() + "-" +
    String(chile.getMonth() + 1).padStart(2, "0") + "-" +
    String(chile.getDate()).padStart(2, "0") + "T" +
    String(chile.getHours()).padStart(2, "0") + ":" +
    String(chile.getMinutes()).padStart(2, "0") + ":" +
    String(chile.getSeconds()).padStart(2, "0") +
    `${sign}${hours}:${minutes}`
  );
}

export default function PlanesPage() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // Diccionarios Visuales
  const planDescriptions: Record<string, string> = {
    BASIC: "Ideal para comenzar.",
    PRO: "Para negocios en crecimiento.",
    PREMIUM: "Solución completa sin límites.",
  };
  const planIcons: Record<string, string> = {
    BASIC: "🧰", PRO: "🚀", PREMIUM: "🏆",
  };
  const planToneClass: Record<string, string> = {
    BASIC: "plan-tone-basic", PRO: "plan-tone-pro", PREMIUM: "plan-tone-premium",
  };
  const featureLabels: Record<string, (value: any) => string> = {
    max_products: (v) => `Hasta ${v} productos`,
    priority_support: (v) => (v ? "Soporte prioritario" : ""),
    ads_boost: (v) => (v ? "Mayor visibilidad" : ""),
  };

  useEffect(() => {
    async function loadData() {
      try {
        console.log("🔵 Cargando Planes...");

        // 1. Cargar Planes (Público)
        const { data: plansDB, error: plansErr } = await supabase
          .from("subscription_plan")
          .select("*")
          .neq("code", "trial3m")
          .order("monthly_price", { ascending: true });

        if (plansErr) throw plansErr;
        setPlanes(plansDB || []);

        // 2. Verificar si el usuario ya tiene plan (usando localStorage)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.id_ferreteria) {
             const { data: subData } = await supabase
              .from("ferreteria_subscription")
              .select("plan_id")
              .eq("ferreteria_id", user.id_ferreteria)
              .in("status", ["active", "trial"])
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            
             if (subData) setCurrentPlanId(subData.plan_id);
          }
        }
      } catch (err) {
        console.error("Error cargando planes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    setLoadingPlan(plan.code);
    try {
      // 1. Obtener usuario del LocalStorage (Tu login actual)
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        alert("Debes iniciar sesión para elegir un plan.");
        navigate("/login");
        return;
      }
      const user = JSON.parse(storedUser);
      if (!user.id_ferreteria) {
        alert("Tu usuario no tiene una ferretería asociada.");
        return;
      }

      // 2. Calcular fechas (30 días de suscripción)
      const startsAt = nowChileISO();
      const endsAt = nowChileISO(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      // 3. Insertar suscripción DIRECTAMENTE en Supabase
      const { error: insertError } = await supabase
        .from("ferreteria_subscription")
        .insert({
          ferreteria_id: user.id_ferreteria,
          plan_id: plan.id,
          status: "active",
          starts_at: startsAt,
          ends_at: endsAt
        });

      if (insertError) throw insertError;

      alert(`¡Plan ${plan.name} activado!`);
      navigate("/dashboard/suscripcion");

    } catch (error: any) {
      console.error("Error al activar:", error);
      alert("Error: " + error.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loading) return <div className="planes-container"><p>Cargando planes...</p></div>;

  return (
    <div className="planes-container">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#1f2937' }}>Elige tu Plan</h2>
        <p style={{ color: '#6b7280' }}>Selecciona el nivel de servicio para tu ferretería.</p>
      </div>
      
      <div className="planes-grid">
        {planes.map((plan) => {
          const code = plan.code.trim().toUpperCase();
          const isCurrent = plan.id === currentPlanId;

          return (
            <div key={plan.id} className={`plan-card ${planToneClass[code] || ''} ${isCurrent ? 'plan-current' : ''}`}>
              {isCurrent && <div className="plan-badge">PLAN ACTUAL</div>}
              
              <div className="plan-icon">{planIcons[code] || "📦"}</div>
              <h3>{plan.name}</h3>
              <p className="price">
                 {plan.monthly_price === 0 ? "GRATIS" : `$${plan.monthly_price?.toLocaleString("es-CL")}`}
              </p>
              
              {/* VISUAL: DÍAS DE GRACIA */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '6px', borderRadius: '4px', margin: '10px 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>
                 🛡️ {plan.grace_days} Días de Gracia
              </div>

              <p className="plan-description">{planDescriptions[code]}</p>

              <ul className="features">
                {Object.entries(plan.features || {}).map(([key, val]) => {
                  const labelFn = featureLabels[key];
                  if (!labelFn) return null;
                  const label = labelFn(val);
                  return label ? (
                    <li key={key} className="feature-item"><span className="check">✔</span> {label}</li>
                  ) : null;
                })}
              </ul>

              <div className="plan-button-container">
                <button 
                  className="btn-select"
                  disabled={loadingPlan === code || isCurrent}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrent ? "Plan Activo" : loadingPlan === code ? "Activando..." : "Seleccionar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}