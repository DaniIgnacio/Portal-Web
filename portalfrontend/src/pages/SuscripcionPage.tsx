import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SuscripcionPage.css";

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number | null;
  grace_days: number | null;
  features: Record<string, any> | null;
};

type Subscription = {
  id: string;
  ferreteria_id: string;
  plan_id: string | null;
  status: string | null;
  started_at?: string | null;
  expires_at?: string | null;
};

export default function SuscripcionPage() {
  const [loading, setLoading] = useState(true);
  const [idFerreteria, setIdFerreteria] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      console.log("🔵 SUS — INICIANDO CARGA");

      // 1) Usuario local
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = savedUser?.id_usuario;
      console.log("🟣 SUS — USER LOCAL:", savedUser);

      if (!userId) {
        setErrorText("No existe usuario en localStorage.");
        setLoading(false);
        return;
      }

      // 2) Traer id_ferreteria del usuario
      const { data: userRow, error: userErr } = await supabase
        .from("usuario")
        .select("id_ferreteria")
        .eq("id_usuario", userId)
        .maybeSingle();

      console.log("🟢 SUS — USERROW BD:", userRow);
      if (userErr) console.error("🟥 SUS — ERROR USERROW:", userErr);

      const ferreId = userRow?.id_ferreteria ?? null;
      setIdFerreteria(ferreId);
      console.log("🟦 SUS — ID FERRETERIA:", ferreId);

      if (!ferreId) {
        setErrorText("El usuario no tiene ferretería asociada.");
        setLoading(false);
        return;
      }

      // 3) Traer suscripción más reciente (ordenada) para evitar error de múltiples filas
      const { data: subRows, error: subErr } = await supabase
        .from("ferreteria_subscription")
        .select("id, ferreteria_id, plan_id, status, starts_at, ends_at")
        .eq("ferreteria_id", ferreId)
        .order("starts_at", { ascending: false })
        .limit(1);

      const subRow = Array.isArray(subRows) && subRows.length > 0 ? subRows[0] : null;

      console.log("🟨 SUS — SUBSCRIPTION RAW:", subRow);  
      if (subErr) {
        console.error("🟥 SUS — ERROR SUBSCRIPTION:", subErr);
        setErrorText(`No fue posible cargar la suscripción (${subErr.message}).`);
        setLoading(false);
        return;
      }

      setSubscription(subRow ?? null);

      // 4) Si no hay suscripción o no tiene plan_id, mostrar estado
      if (!subRow) {
        console.warn("⚠️ SUS — NO HAY REGISTRO DE SUSCRIPCIÓN");
        setPlan(null);
        setLoading(false);
        return;
      }
      if (!subRow.plan_id) {
        console.warn("⚠️ SUS — SUSCRIPCIÓN SIN plan_id (trial o por configurar)");
        setPlan(null);
        setLoading(false);
        return;
      }

      // 5) Traer PLAN por id (join en dos pasos, robusto)
      const { data: planRow, error: planErr } = await supabase
        .from("subscription_plan")
        .select("id, code, name, monthly_price, grace_days, features")
        .eq("id", subRow.plan_id)
        .maybeSingle();

      console.log("🟩 SUS — PLAN RAW:", planRow);
      if (planErr) {
        console.error("🟥 SUS — ERROR PLAN:", planErr);
        setErrorText("No fue posible cargar el plan actual.");
        setLoading(false);
        return;
      }

      setPlan(planRow ?? null);
      setLoading(false);
    })();
  }, []);

  // Helpers visuales
  const normalizedCode = plan?.code?.trim()?.toUpperCase() ?? null;
  const status = subscription?.status ?? null;

  if (loading) return <p>Cargando suscripción…</p>;

  const formatFeatureKey = (key: string) => {
    return key.replace(/_/g, " ");
  };

  const renderFeatures = () => {
    if (!plan?.features || typeof plan.features !== "object") return null;
    return (
      <ul className="suscripcion-features">
        {Object.entries(plan.features).map(([k, v]) => (
          <li key={k}>
            <span className="feature-key">{formatFeatureKey(k)}</span>
            <span className="feature-value">{String(v)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  const nextPaymentDate = subscription?.expires_at
    ? formatDate(subscription.expires_at)
    : "—";
  const joinedDate = subscription?.started_at ? formatDate(subscription.started_at) : "—";

  return (
    <div className="suscripcion-page">
      <div className="suscripcion-header">
        <div className="suscripcion-title-block">
          <span className="pill">Suscripción</span>
          <h2>Tu Suscripción</h2>
          <p>Revisa tu plan actual, estado y beneficios. Cambia de plan cuando lo necesites.</p>
        </div>
        <div className="suscripcion-actions">
          <button className="ghost-btn" onClick={() => navigate("/dashboard/planes")}>
            Cambiar plan
          </button>
        </div>
      </div>

      {errorText && (
        <div className="suscripcion-alert error">
          {errorText}
        </div>
      )}

      {!subscription && (
        <div className="suscripcion-card empty">
          <div className="empty-icon">📄</div>
          <h3>No tienes una suscripción activa</h3>
          <p>
            Aún no se ha creado el registro en <code>subscription</code> para tu ferretería.
            Puedes elegir un plan en la página de planes.
          </p>
          <button className="primary-btn" onClick={() => navigate("/dashboard/planes")}>
            Ir a elegir un plan
          </button>
        </div>
      )}

      {subscription && !subscription.plan_id && (
        <div className="suscripcion-card empty">
          <div className="empty-icon">🕒</div>
          <h3>Suscripción por configurar</h3>
          <p>
            Tu suscripción no tiene un <code>plan_id</code> asociado aún. Puede ser un período de prueba
            o una suscripción recién creada. Elige un plan para activar beneficios.
          </p>
          <div className="metadata-row">
            <div className="meta">
              <span className="meta-label">Estado</span>
              <span className="meta-value">{status ?? "—"}</span>
            </div>
          </div>
          <button className="primary-btn" onClick={() => navigate("/dashboard/planes")}>
            Elegir plan
          </button>
        </div>
      )}

      {subscription && subscription.plan_id && (
        <div className="suscripcion-card hero">
          <div className="hero-top">
            <span className="pill soft">Suscrito el {joinedDate}</span>
          </div>

          <div className="plan-hero-head">
            <div>
              <h3 className="plan-hero-title">
                {plan?.name ?? "—"} {normalizedCode ? `(${normalizedCode})` : ""}
              </h3>
              <p className="plan-hero-caption">Tu plan actual y próximos cobros.</p>
            </div>
            <div className="price-box accent">
              <div className="price-label">Precio</div>
              <div className="price-value">
                {plan?.monthly_price != null ? `$${plan.monthly_price}` : "—"}
              </div>
              <div className="grace">Días de gracia: {plan?.grace_days ?? "—"}</div>
            </div>
          </div>

          <div className="plan-hero-meta">
            <div className="meta">
              <span className="meta-label">Estado</span>
              <span className="meta-value">{status ?? "—"}</span>
            </div>
            <div className="meta">
              <span className="meta-label">Próximo pago</span>
              <span className="meta-value small">{nextPaymentDate}</span>
            </div>
            <div className="meta">
              <span className="meta-label">Método</span>
              <span className="meta-value small">Tarjeta ••••</span>
            </div>
          </div>

          {renderFeatures()}

          <div className="actions-row">
            <button className="danger-btn">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
