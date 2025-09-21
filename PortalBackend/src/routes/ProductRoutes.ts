import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

// GET: Obtener todos los productos con sus categorías
router.get('/productos', async (req, res) => {
    const { data, error } = await supabase
        .from('producto')
        .select(`
            *,
            categoria:id_categoria (
                id_categoria,
                nombre,
                descripcion
            )
        `);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST: Crear un nuevo producto
router.post('/productos', async (req, res) => {
    const { nombre, sku, precio, stock, id_categoria, id_ferreteria } = req.body;

    // Validaciones
    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);
    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }
    if (!id_categoria || !id_ferreteria) {
        return res.status(400).json({ error: 'La categoría y ferretería son requeridas.' });
    }

    // Convertir precio a centavos (ya que la BD usa INT para precio)
    const precioEnCentavos = Math.round(numericPrecio * 100);

    const { data, error } = await supabase
        .from('producto')
        .insert([{
            nombre,
            sku,
            precio: precioEnCentavos,
            stock: integerStock,
            id_categoria,
            id_ferreteria
        }])
        .select(`
            *,
            categoria:id_categoria (
                id_categoria,
                nombre,
                descripcion
            )
        `);

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
    const { nombre, sku, precio, stock, id_categoria, id_ferreteria } = req.body;

    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);
    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }

    // Convertir precio a centavos (ya que la BD usa INT para precio)
    const precioEnCentavos = Math.round(numericPrecio * 100);

    const updateData: any = {
        nombre,
        sku,
        precio: precioEnCentavos,
        stock: integerStock
    };

    if (id_categoria) updateData.id_categoria = id_categoria;
    if (id_ferreteria) updateData.id_ferreteria = id_ferreteria;

    const { data, error } = await supabase
        .from('producto')
        .update(updateData)
        .eq('id_producto', id)
        .select(`
            *,
            categoria:id_categoria (
                id_categoria,
                nombre,
                descripcion
            )
        `);

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
    const { error } = await supabase.from('producto').delete().eq('id_producto', id);

    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
});

export default router;
