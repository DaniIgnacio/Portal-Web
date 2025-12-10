import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type Plan = {
  id: string;
  code: string;
  name: string;
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
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <h2>Tu Suscripción</h2>

      {/* ERROR */}
      {errorText && (
        <div style={errorBox}>{errorText}</div>
      )}

      {/* SIN SUSCRIPCIÓN */}
      {!subscription && (
        <div style={card}>
          <h3>No tienes una suscripción activa</h3>
          <p>Debes elegir un plan para comenzar.</p>

          <div onClick={() => navigate("/dashboard/planes")} style={btnNaranja}>
            Elegir plan
          </div>
        </div>
      )}

      {/* SUSCRIPCIÓN ACTIVA */}
      {subscription && subscription.plan_id && (
        <div style={cardPremium}>
          <div style={badge(subscription.status)}>
            {subscription.status?.toUpperCase()}
          </div>

          <h2 style={{ color: "#ff8a29", margin: 0 }}>
            {plan?.name}{" "}
            <span style={{ fontSize: 14, opacity: 0.7 }}>
              ({normalizedCode})
            </span>
          </h2>

          {/* DESCRIPCIÓN PROFESIONAL */}
          {plan?.features && (
            <p style={{ opacity: 0.85, marginTop: 10, lineHeight: "1.6" }}>
              Estás utilizando el <strong>Plan {plan?.name}</strong>, que ofrece:
            </p>
          )}

          {/* BENEFICIOS TRADUCIDOS */}
          {plan?.features && (
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {Object.entries(plan.features).map(([k, v]) => {
                const fn = featureLabels[k];
                const text = fn ? fn(v) : `${k}: ${v}`;
                return (
                  <li key={k} style={{ marginBottom: 6 }}>
                    {text}
                  </li>
                );
              })}
            </ul>
          )}

          {/* FECHAS */}
          <p>
            <strong>Inicio:</strong> {formatCL(subscription.starts_at)}
          </p>

          <p>
            <strong>Fin:</strong>{" "}
            {subscription.ends_at ? (
              <span style={{ color: "#F87171" }}>
                {formatCL(subscription.ends_at)}
              </span>
            ) : (
              "—"
            )}
          </p>

          {/* DÍAS RESTANTES */}
          {diasRestantes !== null && (
            <>
              <p style={{ marginTop: 10 }}>
                Faltan{" "}
                <strong
                  style={{
                    color: diasRestantes <= 5 ? "#F87171" : "#ff8a29",
                  }}
                >
                  {diasRestantes} días
                </strong>{" "}
                para que tu plan termine.
              </p>

              <div style={barraBase}>
                <div
                  style={{
                    width: `${porcentaje}%`,
                    height: "100%",
                    background:
                      diasRestantes <= 5 ? "#F87171" : "#ff8a29",
                  }}
                />
              </div>
            </>
          )}

          {/* BOTONES */}
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <div
              onClick={() => navigate("/dashboard/planes")}
              style={btnNaranja}
            >
              Cambiar plan
            </div>

            <div onClick={cancelarSuscripcion} style={btnRojo}>
              Cancelar suscripción
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   ESTILOS
---------------------------------------------------------- */
const card: React.CSSProperties = {
  background: "#101826",
  padding: 18,
  borderRadius: 12,
  color: "#d7e1f2",
  border: "1px solid #22324d",
};

const cardPremium: React.CSSProperties = {
  background: "linear-gradient(145deg, #0E1420, #121B2C)",
  padding: 28,
  borderRadius: 18,
  border: "1px solid #1F2A3A",
  color: "#fff",
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

const errorBox: React.CSSProperties = {
  background: "#2b0f12",
  border: "1px solid #5f1a21",
  color: "#ffd4d4",
  padding: 14,
  borderRadius: 12,
  marginBottom: 18,
};

const btnNaranja: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  background: "#ff8a29",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnRojo: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  background: "#EF4444",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const badge = (status: string | null): React.CSSProperties => ({
  display: "inline-block",
  padding: "5px 12px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
  marginBottom: 12,
  background: status === "active" ? "#10B98133" : "#FBBF2433",
  color: status === "active" ? "#10B981" : "#FBBF24",
});

const barraBase: React.CSSProperties = {
  width: "100%",
  height: 12,
  background: "#1F2937",
  borderRadius: 10,
  overflow: "hidden",
  marginTop: 8,
};
