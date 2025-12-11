import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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

      // 3) Traer suscripción (SIN embebidos para evitar conflicto de FKs)
      const { data: subRow, error: subErr } = await supabase
        .from("subscription")
        .select("id, ferreteria_id, plan_id, status, started_at, expires_at")
        .eq("ferreteria_id", ferreId)
        .maybeSingle();

      console.log("🟨 SUS — SUBSCRIPTION RAW:", subRow);
      if (subErr) {
        console.error("🟥 SUS — ERROR SUBSCRIPTION:", subErr);
        setErrorText("No fue posible cargar la suscripción.");
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

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Tu Suscripción</h2>

      {/* Consolas de depuración visibles */}
      <pre
        style={{
          background: "#0b1220",
          color: "#c8d0e0",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          overflowX: "auto",
          marginBottom: 16,
        }}
      >
{`🔻 DEBUG
ferreteria_id: ${idFerreteria ?? "null"}
subscription: ${JSON.stringify(subscription, null, 2)}
plan: ${JSON.stringify(plan, null, 2)}
normalizedCode: ${normalizedCode ?? "null"}
status: ${status ?? "null"}`}
      </pre>

      {errorText && (
        <div
          style={{
            background: "#2b0f12",
            border: "1px solid #5f1a21",
            color: "#ffd4d4",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {errorText}
        </div>
      )}

      {/* SIN registro de subscription */}
      {!subscription && (
        <div
          style={{
            background: "var(--color-primary-soft)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dark)",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <h3 style={{ marginTop: 0 }}>No tienes una suscripción activa</h3>
          <p style={{ opacity: 0.9 }}>
            Aún no se ha creado el registro en <code>subscription</code> para tu
            ferretería. Puedes elegir un plan en la página de planes.
          </p>
          <a
            href="/planes"
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-primary)",
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            Ir a elegir un plan
          </a>
        </div>
      )}

      {/* Con subscription pero sin plan_id */}
      {subscription && !subscription.plan_id && (
        <div
          style={{
            background: "var(--color-primary-soft)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dark)",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Suscripción por configurar</h3>
          <p style={{ opacity: 0.9 }}>
            Tu suscripción no tiene un <code>plan_id</code> asociado aún. Puede ser
            un período de prueba o una suscripción recién creada. Elige un plan
            para activar beneficios.
          </p>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
            <div>
              <strong>Estado:</strong> {status ?? "—"}
            </div>
          </div>
          <a
            href="/planes"
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-primary)",
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            Elegir plan
          </a>
        </div>
      )}

      {/* Con plan asociado */}
      {subscription && subscription.plan_id && (
        <div
          style={{
            background: "var(--color-primary-soft)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dark)",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>
              Plan actual:{" "}
              <span style={{ color: "var(--color-primary)" }}>
                {plan?.name ?? "—"} {normalizedCode ? `(${normalizedCode})` : ""}
              </span>
            </h3>
            <a
              href="/planes"
              style={{
                alignSelf: "flex-start",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-primary)",
                color: "var(--color-primary)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Cambiar plan
            </a>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Estado:</strong> {status ?? "—"}
            </div>
            <div>
              <strong>Precio mensual:</strong>{" "}
              {plan?.monthly_price != null ? `$${plan?.monthly_price}` : "—"}
            </div>
            <div>
              <strong>Días de gracia:</strong>{" "}
              {plan?.grace_days != null ? plan?.grace_days : "—"}
            </div>
          </div>

          {/* Features */}
          {plan?.features && typeof plan.features === "object" && (
            <div style={{ marginTop: 12 }}>
              <strong>Beneficios:</strong>
              <ul style={{ marginTop: 8 }}>
                {Object.entries(plan.features).map(([k, v]) => (
                  <li key={k}>
                    <code>{k}</code>: {String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rango de fechas si existen */}
          {(subscription.started_at || subscription.expires_at) && (
            <div style={{ marginTop: 10, fontSize: 14, opacity: 0.85 }}>
              <div>
                <strong>Inicio:</strong>{" "}
                {subscription.started_at ? new Date(subscription.started_at).toLocaleString() : "—"}
              </div>
              <div>
                <strong>Expira:</strong>{" "}
                {subscription.expires_at ? new Date(subscription.expires_at).toLocaleString() : "—"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
