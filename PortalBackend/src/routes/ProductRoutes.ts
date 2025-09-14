import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET: Obtener todos los productos
router.get('/productos', async (req, res) => {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST: Crear un nuevo producto
router.post('/productos', async (req, res) => {
    const { nombre, sku, precio, stock } = req.body;
    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);
    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }
    const { data, error } = await supabase
        .from('productos')
        .insert([{ nombre, sku, precio: numericPrecio, stock: integerStock }])
        .select();
    if (error) {
        console.error('Error detallado de Supabase:', JSON.stringify(error, null, 2)); 
        return res.status(500).json({ error: error.message });
    }

    console.log('Respuesta de Supabase al insertar:', data);
    res.status(201).json(data[0]);
});


// PUT: Actualizar un producto existente
router.put('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, sku, precio, stock } = req.body;

    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);
    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }
    const { data, error } = await supabase
        .from('productos')
        .update({ nombre, sku, precio: numericPrecio, stock: integerStock })
        .eq('id', id)
        .select();
    if (error) {
        console.error('Error de Supabase al actualizar:', error);
        return res.status(500).json({ error: error.message });
    }
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(data[0]);
});

// DELETE: Eliminar un producto
router.delete('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('productos').delete().eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send(); 
});

export default router;