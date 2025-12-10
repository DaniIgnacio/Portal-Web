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
    BASIC: "Ideal para ferreterías pequeñas que están comenzando en el mundo digital.",
    PRO: "Diseñado para negocios en crecimiento.",
    PREMIUM: "La solución completa para ferreterías de alto volumen.",
  };

  const featureLabels: Record<string, (value: any) => string> = {
    max_products: (v) => `Hasta ${v} productos en catálogo`,
    priority_support: (v) => (v ? "Soporte prioritario 24/7" : ""),
    ads_boost: (v) => (v ? "Mayor visibilidad en búsquedas" : ""),
  };

  useEffect(() => {
    async function loadData() {
      console.log("🔵 INICIANDO LOADDATA");

      // Obtener usuario desde localStorage
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = savedUser?.id_usuario;
      console.log("🟣 USER LOCAL:", savedUser);

      if (!userId) {
        console.log("❌ No hay usuario en LOCALSTORAGE");
        setLoading(false);
        return;
      }

      // Obtener ferretería del usuario
      const { data: userRow, error: userErr } = await supabase
        .from("usuario")
        .select("id_ferreteria")
        .eq("id_usuario", userId)
        .maybeSingle();

      console.log("🟢 USERROW BD:", userRow);
      console.log("🟥 ERROR USERROW:", userErr);

      if (!userRow?.id_ferreteria) {
        setLoading(false);
        return;
      }

      const ferreId = userRow.id_ferreteria;
      setIdFerreteria(ferreId);

      console.log("🟦 ID FERRETERIA:", ferreId);
      console.log("🟦 Ejecutando SELECT de suscripción…");

      // SELECT CORRECTO EN SUPABASE (JOIN FORZADO)
      const { data: subData, error } = await supabase
        .from("subscription")
        .select(`
          plan_id,
          subscription_plan:subscription_plan!plan_id ( code )
        `)
        .eq("ferreteria_id", ferreId)
        .maybeSingle();

      console.log("🔍 SUBDATA RAW:", JSON.stringify(subData, null, 2));
      console.error("🔴 ERROR COMPLETO SUPABASE:", JSON.stringify(error, null, 2));

      // Extraer relación
      type RelationPlan = { code?: string } | { code?: string }[] | null;
      const relation = subData?.subscription_plan as RelationPlan;

      console.log("🔬 REL RAW:", relation);

      let planCode: string | null = null;

      if (relation && !Array.isArray(relation) && relation.code) {
        planCode = relation.code.trim().toUpperCase();
      } else if (Array.isArray(relation) && relation.length > 0 && relation[0]?.code) {
        planCode = relation[0].code.trim().toUpperCase();
      }

      console.log("🟧 PLAN CODE PROCESADO:", planCode);
      setCurrentPlanCode(planCode);

      // Obtener catálogo de planes
      const { data: plansDB } = await supabase
        .from("subscription_plan")
        .select("*")
        .neq("code", "trial3m");

      console.log("🟪 PLANES DISPONIBLES:", plansDB);
      setPlanes(plansDB || []);

      setLoading(false);
    }

    loadData();
  }, []);

  async function handleSelectPlan(code: string) {
    if (!idFerreteria) return;

    console.log("🔵 CAMBIANDO PLAN A:", code);
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
      } else {
        const normalized = code.trim().toUpperCase();
        console.log("🟦 NUEVO PLAN:", normalized);
        setCurrentPlanCode(normalized);
        alert("Plan actualizado correctamente.");
      }
    } catch (err) {
      console.error("🔥 ERROR CAMBIO PLAN:", err);
      alert("Ocurrió un error.");
    }

    setLoadingPlan(null);
  }

  if (loading) return <p>Cargando planes...</p>;

  console.log("🔻 RENDER - PLAN ACTUAL:", currentPlanCode);

  return (
    <div className="planes-container">
      <h2 style={{ marginBottom: "25px" }}>Elige un Plan</h2>

      <div className="planes-grid">
        {planes.map((plan) => {
          const normalizedCode = plan.code.trim().toUpperCase();
          const isCurrent = normalizedCode === currentPlanCode;

          console.log(
            `🔎 Comparando → Plan: ${normalizedCode} | Actual: ${currentPlanCode} | MATCH: ${isCurrent}`
          );

          return (
            <div
              key={plan.id}
              className="plan-card"
              style={{
                border: isCurrent ? "2px solid #ff8a29" : "1px solid #ddd",
              }}
            >
              {isCurrent && <div className="plan-badge">PLAN ACTUAL</div>}

              <h3>{plan.name}</h3>
              <p className="price">${plan.monthly_price}</p>

              <p className="plan-description">{planDescriptions[normalizedCode]}</p>

              <ul className="features">
                <li>
                  <strong>Protección:</strong> {plan.grace_days} días antes de suspensión
                </li>

                {Object.entries(plan.features).map(([key, val], idx) => {
                  const label = featureLabels[key]?.(val);
                  return label ? <li key={idx}>{label}</li> : null;
                })}
              </ul>

              <div className="plan-button-container">
                <button
                  className="btn-select"
                  disabled={loadingPlan === plan.code || isCurrent}
                  onClick={() => handleSelectPlan(plan.code)}
                >
                  {isCurrent
                    ? "Este es tu plan"
                    : loadingPlan === plan.code
                    ? "Procesando…"
                    : "Seleccionar este plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
