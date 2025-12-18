import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SuscripcionPage.css";

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price?: number | null;
  grace_days?: number | null;
  features?: Record<string, any> | null;
};

type Subscription = {
  id: string;
  ferreteria_id: string;
  plan_id: string | null;
  status: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

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

/* ----------------------------------------------------------
   MOSTRAR FECHAS EN HORARIO CHILE (visualmente)
---------------------------------------------------------- */
function formatCL(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });
}

/* ----------------------------------------------------------
   TRADUCCIÓN PROFESIONAL DE FEATURES
---------------------------------------------------------- */
const featureLabels: Record<string, (v: any) => string> = {
  ads_boost: () => "Mayor visibilidad en anuncios",
  max_products: (v) =>
    `Hasta ${Number(v).toLocaleString("es-CL")} productos en catálogo`,
  priority_support: () => "Soporte prioritario",
  analytics: () => "Estadísticas avanzadas del negocio",
  multiuser: () => "Acceso multiusuario",
  extra_categories: (v) => `${v} categorías adicionales`,
};

const formatFeatureKey = (key: string) => key.replace(/_/g, " ");

export default function SuscripcionPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);


  const [ferreteriaId, setFerreteriaId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  /* ----------------------------------------------------------
     CARGA INICIAL
  ---------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const authUser = userData?.user;

        if (!authUser) {
          setErrorText("No hay sesión activa.");
          setLoading(false);
          return;
        }

        const { data: userRow } = await supabase
          .from("usuario")
          .select("id_ferreteria")
          .eq("id_usuario", authUser.id)
          .single();

        if (!userRow?.id_ferreteria) {
          setErrorText("Tu usuario no tiene ferretería asociada.");
          setLoading(false);
          return;
        }

        setFerreteriaId(userRow.id_ferreteria);

        const { data: subRows } = await supabase
          .from("ferreteria_subscription")
          .select("*")
          .eq("ferreteria_id", userRow.id_ferreteria)
          .order("created_at", { ascending: false })
          .limit(1);

        const sub = subRows?.[0] ?? null;
        setSubscription(sub);

        if (!sub?.plan_id) {
          setPlan(null);
          setLoading(false);
          return;
        }

        const { data: planRow } = await supabase
          .from("subscription_plan")
          .select("*")
          .eq("id", sub.plan_id)
          .single();

        setPlan(planRow ?? null);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setErrorText("No fue posible cargar datos.");
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Cargando suscripción…</p>;

  const normalizedCode = plan?.code?.toUpperCase() ?? null;
  const joinedDate = subscription?.starts_at ? formatCL(subscription.starts_at) : "—";

  /* ----------------------------------------------------------
     CÁLCULO DE DÍAS RESTANTES
  ---------------------------------------------------------- */
  let diasRestantes = null;
  let porcentaje = 0;

  if (subscription?.starts_at && subscription.ends_at) {
    const inicio = new Date(subscription.starts_at);
    const fin = new Date(subscription.ends_at);
    const hoy = new Date();

    diasRestantes = Math.ceil(
      (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalMs = fin.getTime() - inicio.getTime();
    const usadoMs = hoy.getTime() - inicio.getTime();
    porcentaje = Math.min(100, Math.max(0, (usadoMs / totalMs) * 100));
  }

  /* ----------------------------------------------------------
     CANCELAR SUSCRIPCIÓN
  ---------------------------------------------------------- */
  async function cancelarSuscripcion() {
    if (!ferreteriaId) return;

    await supabase.from("ferreteria_subscription").insert({
      ferreteria_id: ferreteriaId,
      plan_id: subscription?.plan_id,
      status: "canceled",
      starts_at: nowChileISO(),
      ends_at: nowChileISO(),
    });

    navigate(0);
  }

  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */
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

      {errorText && <div className="suscripcion-alert error">{errorText}</div>}

      {!subscription && (
        <div className="suscripcion-card empty">
          <div className="empty-icon">📄</div>
          <h3>No tienes una suscripción activa</h3>
          <p>Debes elegir un plan para comenzar.</p>
          <button className="primary-btn" onClick={() => navigate("/dashboard/planes")}>
            Elegir plan
          </button>
        </div>
      )}

      {subscription && subscription.plan_id && (
        <div className="suscripcion-card hero">
          <div className="hero-top">
            <span className="pill soft">Suscrito el {joinedDate}</span>
            <span className={`status-badge ${subscription.status ?? 'default'}`}>
              {subscription.status ?? 'Estado'}
            </span>
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
              <span className="meta-value">{subscription.status ?? "—"}</span>
            </div>
            <div className="meta">
              <span className="meta-label">Inicio</span>
              <span className="meta-value small">{formatCL(subscription.starts_at)}</span>
            </div>
            <div className="meta">
              <span className="meta-label">Próximo pago</span>
              <span className="meta-value small">{formatCL(subscription.ends_at)}</span>
            </div>
          </div>

          {plan?.features && (
            <ul className="suscripcion-features">
              {Object.entries(plan.features).map(([k, v]) => {
                const fn = featureLabels[k];
                const text = fn ? fn(v) : `${k}: ${v}`;
                return (
                  <li key={k}>
                    <span className="check">✔</span>
                    <div className="feature-lines">
                      <span className="feature-key">{formatFeatureKey(k)}</span>
                      <span className="feature-value">{text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {diasRestantes !== null && (
            <div className="progress-block">
              <p className="progress-label">
                Faltan <strong className={diasRestantes <= 5 ? "text-danger" : "text-primary"}>{diasRestantes} días</strong> para que tu plan termine.
              </p>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${diasRestantes <= 5 ? "warn" : ""}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          )}

          <div className="actions-row">
            <button className="danger-btn" onClick={cancelarSuscripcion}>
              Cancelar suscripción
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
