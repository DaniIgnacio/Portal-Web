import express from "express";
import { supabase } from "../supabase";

const router = express.Router();

/* ============================================
   🔶 1) Crear ferretería (normal)
   ============================================ */
router.post("/create", async (req, res) => {
  try {
    const {
      rut,
      razon_social,
      direccion,
      latitud,
      longitud,
      telefono,
      api_key,
      descripcion,
      horario,
    } = req.body;

    const parsedHorario = horario ? JSON.stringify(horario) : null;

    // Crear ferretería
    const { data: newFerreteriaData, error: insertFerreteriaError } =
      await supabase
        .from("ferreteria")
        .insert([
          {
            rut,
            razon_social,
            direccion,
            latitud: latitud ? parseFloat(latitud) : null,
            longitud: longitud ? parseFloat(longitud) : null,
            telefono: telefono || null,
            api_key,
            descripcion: descripcion || null,
            horario: parsedHorario || null,
          },
        ])
        .select();

    if (
      insertFerreteriaError ||
      !newFerreteriaData ||
      newFerreteriaData.length === 0
    ) {
      console.error("Error al insertar ferretería:", insertFerreteriaError);
      return res.status(500).json({
        error:
          insertFerreteriaError?.message || "Error al crear la ferretería.",
      });
    }

    const id_ferreteria = newFerreteriaData[0].id_ferreteria;

    /* ============================================================
       🔥 Crear suscripción Trial de 3 meses automáticamente
       ============================================================ */
    try {
      const { data: trialPlan, error: trialPlanError } = await supabase
        .from("subscription_plan")
        .select("id")
        .eq("code", "trial3m")
        .maybeSingle();

      if (trialPlanError) {
        console.error("Error buscando plan trial:", trialPlanError);
      } else if (trialPlan) {
        const starts = new Date();
        const ends = new Date();
        ends.setMonth(ends.getMonth() + 3); // 3 meses de trial

        const { error: subscriptionError } = await supabase
          .from("subscription")
          .insert({
            ferreteria_id: id_ferreteria,
            plan_id: trialPlan.id,
            status: "activa",
            is_trial: true,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
          });

        if (subscriptionError) {
          console.error("Error creando trial:", subscriptionError);
        } else {
          console.log(
            "Trial de 3 meses creado correctamente para ferretería:",
            id_ferreteria
          );
        }
      }
    } catch (err) {
      console.error("Error inesperado creando trial:", err);
    }

    return res.json({
      message: "Ferretería creada exitosamente.",
      ferreteria: newFerreteriaData[0],
    });
  } catch (error) {
    console.error("Error general:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/* ============================================
   🔶 2) Crear ferretería desde link-ferretería
   ============================================ */
router.post("/link-ferreteria", async (req, res) => {
  try {
    const {
      rut,
      razon_social,
      direccion,
      latitud,
      longitud,
      telefono,
      api_key,
      descripcion,
      horario,
    } = req.body;

    const parsedHorario = horario ? JSON.stringify(horario) : null;

    const { data: newFerreteriaData, error: insertFerreteriaError } =
      await supabase
        .from("ferreteria")
        .insert([
          {
            rut,
            razon_social,
            direccion,
            latitud: latitud ? parseFloat(latitud) : null,
            longitud: longitud ? parseFloat(longitud) : null,
            telefono: telefono || null,
            api_key,
            descripcion: descripcion || null,
            horario: parsedHorario || null,
          },
        ])
        .select();

    if (
      insertFerreteriaError ||
      !newFerreteriaData ||
      newFerreteriaData.length === 0
    ) {
      console.error(
        "Error al insertar ferretería desde link-ferreteria:",
        insertFerreteriaError
      );
      return res.status(500).json({
        error:
          insertFerreteriaError?.message ||
          "Error al crear la ferretería desde link.",
      });
    }

    const id_ferreteria = newFerreteriaData[0].id_ferreteria;

    /* ============================================================
       🔥 Trial automático aquí también
       ============================================================ */
    try {
      const { data: trialPlan } = await supabase
        .from("subscription_plan")
        .select("id")
        .eq("code", "trial3m")
        .maybeSingle();

      if (trialPlan) {
        const starts = new Date();
        const ends = new Date();
        ends.setMonth(ends.getMonth() + 3);

        await supabase.from("subscription").insert({
          ferreteria_id: id_ferreteria,
          plan_id: trialPlan.id,
          status: "activa",
          is_trial: true,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
        });

        console.log(
          "Trial creado correctamente (link-ferreteria) para:",
          id_ferreteria
        );
      }
    } catch (err) {
      console.error("Error creando trial en link-ferreteria:", err);
    }

    return res.json({
      message: "Ferretería creada correctamente.",
      ferreteria: newFerreteriaData[0],
    });
  } catch (error) {
    console.error("Error general:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Cambiar plan de suscripción
router.post("/change-plan", async (req, res) => {
  try {
    const { id_ferreteria, plan_code } = req.body;

    if (!id_ferreteria || !plan_code) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // 1. Buscar plan solicitado
    const { data: planData, error: planError } = await supabase
      .from("subscription_plan")
      .select("id")
      .eq("code", plan_code)
      .single();

    if (planError || !planData) {
      return res.status(400).json({ error: "El plan solicitado no existe." });
    }

    // 2. Verificar si ya tiene suscripción
    const { data: currentSub, error: findError } = await supabase
      .from("subscription")
      .select("*")
      .eq("ferreteria_id", id_ferreteria)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({ error: findError.message });
    }

    let updateError;

    if (currentSub) {
      // 👉 NO TOCAMOS starts_at ni ends_at (son DATE)
      const { error } = await supabase
        .from("subscription")
        .update({
          plan_id: planData.id,
          status: "active",
          is_trial: false,
        })
        .eq("ferreteria_id", id_ferreteria);

      updateError = error;
    } else {
      // 👉 Crear nueva suscripción con fechas correctas en formato DATE
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      const { error } = await supabase.from("subscription").insert({
        ferreteria_id: id_ferreteria,
        plan_id: planData.id,
        status: "active",
        is_trial: false,
        starts_at: today,
        ends_at: today,
      });

      updateError = error;
    }

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({
      ok: true,
      message: "Plan cambiado correctamente.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno en cambio de plan." });
  }
});



export default router;
