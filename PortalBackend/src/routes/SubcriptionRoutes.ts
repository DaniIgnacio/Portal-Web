import { Router } from 'express';
import { supabase } from '../supabase'; 

const router = Router();

// POST: Obtener suscripción por ID de ferretería
// Nota: Tu App.tsx hace un POST enviando { id_ferreteria } en el body
router.post('/suscripcion/get', async (req: any, res) => {
    const { id_ferreteria } = req.body;

    if (!id_ferreteria) {
        return res.status(400).json({ error: 'Falta id_ferreteria' });
    }

    try {
        // Buscamos la suscripción más reciente y traemos los datos del plan
        const { data: sub, error } = await supabase
            .from('ferreteria_subscription')
            .select(`
                *,
                plan:subscription_plan (*)
            `)
            .eq('ferreteria_id', id_ferreteria)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Si no hay suscripción, devolvemos null (no es un error 500)
        if (error && error.code === 'PGRST116') {
             return res.json(null);
        }

        if (error) {
            console.error('Error Supabase:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(sub);
    } catch (error: any) {
        console.error('Error interno:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;