import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET: Obtener todas las categorías
router.get('/categorias', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categoria')
            .select('*')
            .order('nombre');

        if (error) {
            console.error('Error de Supabase:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json(data);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST: Crear una nueva categoría
router.post('/categorias', async (req, res) => {
    try {
        const { nombre, descripcion, id_categoria_padre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
        }

        const { data, error } = await supabase
            .from('categoria')
            .insert([{ nombre, descripcion, id_categoria_padre }])
            .select();

        if (error) {
            console.error('Error detallado de Supabase:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: error.message });
        }

        console.log('Categoría creada:', data);
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT: Actualizar una categoría existente
router.put('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, id_categoria_padre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
        }

        const { data, error } = await supabase
            .from('categoria')
            .update({ nombre, descripcion, id_categoria_padre })
            .eq('id_categoria', id)
            .select();

        if (error) {
            console.error('Error de Supabase al actualizar:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json(data[0]);
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE: Eliminar una categoría
router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('categoria')
            .delete()
            .eq('id_categoria', id);

        if (error) {
            console.error('Error de Supabase al eliminar:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
