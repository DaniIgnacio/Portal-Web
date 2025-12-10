import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./PlanesPage.css";

interface Plan {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  grace_days: number;
  features: Record<string, any>;
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [idFerreteria, setIdFerreteria] = useState<string | null>(null);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);

  const planDescriptions: Record<string, string> = {
    BASIC:
      "Ideal para ferreterías pequeñas que están comenzando en el mundo digital. Lleva tus productos en línea con gestión simple.",
    PRO:
      "Diseñado para negocios en crecimiento que requieren mayor capacidad, más productos y soporte prioritario.",
    PREMIUM:
      "La solución completa para ferreterías de alto volumen. Máxima capacidad, posicionamiento destacado y todas las herramientas para liderar el mercado.",
  };

  const featureLabels: Record<string, (value: any) => string> = {
    max_products: (v) => `Hasta ${v} productos en catálogo`,
    priority_support: (v) => (v ? "Soporte prioritario 24/7" : ""),
    ads_boost: (v) => (v ? "Mayor visibilidad en búsquedas" : ""),
  };

  useEffect(() => {
    async function loadData() {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

      const userId = savedUser?.id_usuario;
      if (!userId) {
        setLoading(false);
        return;
      }

      // Obtener ferretería
      const { data: userRow } = await supabase
        .from("usuario")
        .select("id_ferreteria")
        .eq("id_usuario", userId)
        .maybeSingle();

      if (!userRow?.id_ferreteria) {
        setLoading(false);
        return;
      }

      setIdFerreteria(userRow.id_ferreteria);

      // Obtener plan actual
      const { data: subData } = await supabase
        .from("subscription")
        .select("subscription_plan ( code )")
        .eq("ferreteria_id", userRow.id_ferreteria)
        .maybeSingle();

      // Manejo seguro de subData y subscription_plan
      let planCode: string | null = null;

      if (
        subData &&
        Array.isArray(subData.subscription_plan) &&
        subData.subscription_plan.length > 0
      ) {
        planCode = subData.subscription_plan[0].code;
      }

      setCurrentPlanCode(planCode);


      // Obtener la lista de planes (excepto trial)
      const { data: plansDB } = await supabase
        .from("subscription_plan")
        .select("*")
        .neq("code", "trial3m");

      setPlanes(plansDB || []);
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleSelectPlan(code: string) {
    if (!idFerreteria) return;

    setLoadingPlan(code);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/ferreteria/change-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_ferreteria: idFerreteria,
            plan_code: code,
          }),
        }
      );

      if (!res.ok) {
        alert("Error al actualizar el plan.");
        setLoadingPlan(null);
        return;
      }

      alert("Tu plan ha sido actualizado correctamente.");
      setCurrentPlanCode(code);
    } catch (err) {
      console.error(err);
      alert("Error al procesar la solicitud.");
    }

    setLoadingPlan(null);
  }

  if (loading) return <p>Cargando planes...</p>;

  return (
    <div className="planes-container">
      <h2 style={{ marginBottom: "25px" }}>Elige un Plan</h2>

      <div className="planes-grid">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className="plan-card"
            style={{
              border:
                plan.code === currentPlanCode
                  ? "2px solid #ff8a29"
                  : "1px solid #ddd",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.10)";
            }}
          >
            {/* Badge PLAN ACTUAL */}
            {plan.code === currentPlanCode && (
              <div className="plan-badge">PLAN ACTUAL</div>
            )}

            <h3>{plan.name}</h3>
            <p className="price">${plan.monthly_price}</p>

            {/* Descripción */}
            <p className="plan-description">
              {planDescriptions[plan.code] ||
                "Este plan incluye beneficios exclusivos para tu negocio."}
            </p>

            {/* Características */}
            <ul className="features">
              <li>
                 <strong>Período de protección:</strong> {plan.grace_days} días extra antes de suspensión por impago
              </li>

              {Object.entries(plan.features).map(([key, value], i) => {
                const label = featureLabels[key]?.(value);
                if (!label) return null;
                return <li key={i}>{label}</li>;
              })}
            </ul>

            {/* Contenedor del botón */}
            <div className="plan-button-container">
              <button
                className="btn-select"
                disabled={
                  loadingPlan === plan.code ||
                  plan.code === currentPlanCode
                }
                onClick={() => handleSelectPlan(plan.code)}
                style={{
                  background:
                    plan.code === currentPlanCode ? "#ccc" : "#ff8a29",
                  cursor:
                    plan.code === currentPlanCode
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {plan.code === currentPlanCode
                  ? "Este es tu plan"
                  : loadingPlan === plan.code
                  ? "Procesando..."
                  : "Seleccionar este plan"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
