import React, { useEffect, useState } from "react";
import "./PerfilPage.css"; // reutilizamos estilos del perfil para consistencia
import { supabase } from "../supabaseClient";

interface SubscriptionData {
  status: string;
  starts_at: string;
  ends_at: string;
  suspension_reason: string | null;
  subscription_plan: {
    name: string;
    grace_days: number;
    monthly_price: number;
  };
}

export default function SuscripcionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const ferreteriaId = user?.id_ferreteria;

  useEffect(() => {
    if (!ferreteriaId) return;

    const fetchSubscription = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("subscription")
        .select(`
          status,
          starts_at,
          ends_at,
          suspension_reason,
          subscription_plan (
            name,
            grace_days,
            monthly_price
          )
        `)
        .eq("ferreteria_id", ferreteriaId)
        .single();

        if (error) {
        console.error("Error obteniendo suscripción:", error);
        } else {
        const fixedData: SubscriptionData = {
            ...data,
            subscription_plan: Array.isArray(data.subscription_plan)
            ? data.subscription_plan[0]
            : data.subscription_plan
        };

        setSubscription(fixedData);
        }


      setLoading(false);
    };

    fetchSubscription();
  }, [ferreteriaId]);

  if (loading) return <p>Cargando suscripción...</p>;

  if (!subscription)
    return (
      <div className="perfil-container">
        <h2>Mi Suscripción</h2>
        <p>No se encontró ninguna suscripción activa o registrada.</p>
      </div>
    );

  // Cálculo de días restantes
  const hoy = new Date();
  const endsAt = new Date(subscription.ends_at);
  const diferenciaMs = endsAt.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

  // Colores según estado
  const estado = subscription.status;
  let estadoColor = "gray";
  let mensajeEstado = "";

  if (estado === "activa") {
    estadoColor = "green";
    mensajeEstado = `Tu suscripción está activa.`;
  } else if (estado === "vencida") {
    estadoColor = "orange";
    mensajeEstado = `Tu suscripción está vencida. Estás en período de gracia (${subscription.subscription_plan.grace_days} días).`;
  } else if (estado === "suspendida") {
    estadoColor = "red";
    mensajeEstado = `Tu suscripción está suspendida: ${subscription.suspension_reason || "motivo no especificado"}.`;
  }

  return (
    <div className="perfil-container">
      <h2>Mi Suscripción</h2>

      {/* Estado */}
      <div
        style={{
          padding: "12px",
          borderRadius: "8px",
          background: estadoColor,
          color: "white",
          marginBottom: "20px",
        }}
      >
        <strong>Estado: {estado.toUpperCase()}</strong>
        <p>{mensajeEstado}</p>
      </div>

      {/* Datos del plan */}
      <div className="perfil-section">
        <h3>Plan contratado</h3>
        <p><strong>Plan:</strong> {subscription.subscription_plan.name}</p>
        <p><strong>Precio mensual:</strong> ${subscription.subscription_plan.monthly_price}</p>
        <p><strong>Días de gracia:</strong> {subscription.subscription_plan.grace_days} días</p>
      </div>

      {/* Fechas */}
      <div className="perfil-section">
        <h3>Fechas</h3>
        <p><strong>Inicio:</strong> {new Date(subscription.starts_at).toLocaleDateString()}</p>
        <p><strong>Fin:</strong> {new Date(subscription.ends_at).toLocaleDateString()}</p>

        {diasRestantes >= 0 ? (
          <p><strong>Días restantes:</strong> {diasRestantes} días</p>
        ) : (
          <p><strong>Días de retraso:</strong> {Math.abs(diasRestantes)} días</p>
        )}
      </div>

      {/* Alerta extra si está suspendida */}
      {estado === "suspendida" && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "8px",
            background: "#c62828",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Esta ferretería NO aparece en mapas, búsquedas ni recibe pedidos hasta regularizar su suscripción.
        </div>
      )}
    </div>
  );
}
