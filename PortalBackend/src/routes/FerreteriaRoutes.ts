import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET: Obtener todas las ferreterías
router.get('/ferreterias', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ferreteria')
            .select('*')
            .order('razon_social');

        if (error) {
            console.error('Error de Supabase:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json(data);
    } catch (error) {
        console.error('Error al obtener ferreterías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST: Crear una nueva ferretería
router.post('/ferreterias', async (req, res) => {
    try {
        const { rut, razon_social, direccion, latitud, longitud, telefono, api_key } = req.body;

        if (!rut || !razon_social || !direccion) {
            return res.status(400).json({
                error: 'RUT, razón social y dirección son requeridos'
            });
        }

        const { data, error } = await supabase
            .from('ferreteria')
            .insert([{ rut, razon_social, direccion, latitud, longitud, telefono, api_key }])
            .select();

        if (error) {
            console.error('Error detallado de Supabase:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error al crear ferretería:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT: Actualizar una ferretería existente
router.put('/ferreterias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rut, razon_social, direccion, latitud, longitud, telefono, api_key } = req.body;

        if (!rut || !razon_social || !direccion) {
            return res.status(400).json({
                error: 'RUT, razón social y dirección son requeridos'
            });
        }

        const { data, error } = await supabase
            .from('ferreteria')
            .update({ rut, razon_social, direccion, latitud, longitud, telefono, api_key })
            .eq('id_ferreteria', id)
            .select();

        if (error) {
            console.error('Error de Supabase al actualizar:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Ferretería no encontrada' });
        }

        res.json(data[0]);
    } catch (error) {
        console.error('Error al actualizar ferretería:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE: Eliminar una ferretería
router.delete('/ferreterias/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('ferreteria')
            .delete()
            .eq('id_ferreteria', id);

        if (error) {
            console.error('Error de Supabase al eliminar:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar ferretería:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
