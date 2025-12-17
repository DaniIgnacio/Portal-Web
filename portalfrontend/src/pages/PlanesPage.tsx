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

/* ----------------------------------------------------------
   FECHA CHILE → ISO REAL (sin desfase)
---------------------------------------------------------- */
function nowChileISO(baseDate: Date = new Date()) {
  const chile = new Date(
    baseDate.toLocaleString("en-US", { timeZone: "America/Santiago" })
  );

  const offset = -chile.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");

  return (
    chile.getFullYear() +
    "-" +
    String(chile.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(chile.getDate()).padStart(2, "0") +
    "T" +
    String(chile.getHours()).padStart(2, "0") +
    ":" +
    String(chile.getMinutes()).padStart(2, "0") +
    ":" +
    String(chile.getSeconds()).padStart(2, "0") +
    `${sign}${hours}:${minutes}`
  );
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [ferreteriaId, setFerreteriaId] = useState<string | null>(null);
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
      try {
        console.log("🔵 INICIANDO LOADDATA (sin localStorage)");

        // 0) Usuario autenticado
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const authUser = userData?.user ?? null;

        if (!authUser?.id) {
          setLoading(false);
          return;
        }

        setUserId(authUser.id);

        // 1) Ferretería del usuario
        const { data: userRow, error: userRowErr } = await supabase
          .from("usuario")
          .select("id_ferreteria")
          .eq("id_usuario", authUser.id)
          .single();

        if (userRowErr) throw userRowErr;
        if (!userRow?.id_ferreteria) {
          setLoading(false);
          return;
        }

        const ferreId = userRow.id_ferreteria as string;
        setFerreteriaId(ferreId);

        // 2) Suscripción actual (última)
        const { data: subRows, error: subErr } = await supabase
          .from("ferreteria_subscription")
          .select("plan_id")
          .eq("ferreteria_id", ferreId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (subErr) throw subErr;

        const sub = Array.isArray(subRows) && subRows.length > 0 ? subRows[0] : null;
        let planCode: string | null = null;

        if (sub?.plan_id) {
          const { data: planRow, error: planErr } = await supabase
            .from("subscription_plan")
            .select("code")
            .eq("id", sub.plan_id)
            .single();
          if (planErr) throw planErr;
          planCode = planRow?.code?.trim()?.toUpperCase() ?? null;
        }

        setCurrentPlanCode(planCode);

        // 3) Catálogo de planes
        const { data: plansDB, error: plansErr } = await supabase
          .from("subscription_plan")
          .select("*")
          .neq("code", "trial3m");

        if (plansErr) throw plansErr;

        setPlanes(plansDB || []);
        setLoading(false);
      } catch (e: any) {
        console.error("❌ PLANES ERROR:", e);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ----------------------------------------------------------
     CAMBIO DE PLAN (con hora Chile corregida)
  ---------------------------------------------------------- */
  async function handleSelectPlan(code: string) {
    if (!ferreteriaId) return;

    console.log("🔵 CAMBIANDO PLAN A:", code);
    setLoadingPlan(code);

    try {
      // 1) Buscar plan por código
      const { data: planRow, error: planErr } = await supabase
        .from("subscription_plan")
        .select("id, code")
        .eq("code", code)
        .single();

      if (planErr || !planRow?.id) throw planErr || new Error("Plan no encontrado");

      // 2) Crear nuevo registro con hora Chile REAL
      const ahoraCL = nowChileISO();
      const finCL = nowChileISO(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );

      const { error: insErr } = await supabase
        .from("ferreteria_subscription")
        .insert({
          id: crypto.randomUUID(),
          ferreteria_id: ferreteriaId,
          plan_id: planRow.id,
          status: "active",
          starts_at: ahoraCL,
          ends_at: finCL,
        });

      if (insErr) throw insErr;

      const normalized = code.trim().toUpperCase();
      setCurrentPlanCode(normalized);
    } catch (err) {
      console.error("🔥 ERROR CAMBIO PLAN:", err);
    } finally {
      setLoadingPlan(null);
    }
  }

  if (loading) return <p>Cargando planes...</p>;

  return (
    <div className="planes-container">
      <h2 style={{ marginBottom: "25px" }}>Elige un Plan</h2>

      <div className="planes-grid">
        {planes.map((plan) => {
          const normalizedCode = plan.code.trim().toUpperCase();
          const isCurrent = normalizedCode === currentPlanCode;

          return (
            <div
              key={plan.id}
              className="plan-card"
              style={{
                border: isCurrent
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              }}
            >
              {isCurrent && <div className="plan-badge">PLAN ACTUAL</div>}

              <h3>{plan.name}</h3>
              <p className="price">${plan.monthly_price}</p>
              <p className="plan-description">
                {planDescriptions[normalizedCode]}
              </p>

              <ul className="features">
                <li>
                  <strong>Protección:</strong>{" "}
                  {plan.grace_days} días antes de suspensión
                </li>

                {Object.entries(plan.features || {}).map(([key, val], idx) => {
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
