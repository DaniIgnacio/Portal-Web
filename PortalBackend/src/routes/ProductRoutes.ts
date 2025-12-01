import { Router } from 'express';
import { supabase } from '../supabase';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // ¡Usar una variable de entorno segura en producción!

// Middleware para verificar el token JWT y adjuntar id_ferreteria al request
const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id_usuario: string, id_ferreteria: string, iat: number, exp: number };
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Error al verificar token:', err);
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// GET: Obtener todos los productos con sus categorías, filtrados por la ferretería del usuario autenticado
router.get('/productos', verifyToken, async (req: any, res) => {
    const { id_ferreteria } = req.user;

    const { data, error } = await supabase
        .from('producto')
        .select(`
            *,
            categoria:id_categoria (
                id_categoria,
                nombre,
                descripcion
            )
        `)
        .eq('id_ferreteria', id_ferreteria);
    if (error) {
        console.error('Error de Supabase al obtener productos:', error);
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// POST: Crear un nuevo producto
router.post('/productos', verifyToken, async (req: any, res) => {
    const {
        nombre,
        sku,
        precio,
        stock,
        id_categoria,
        imagen_url  // 🔥 AGREGADO
    } = req.body;

    const { id_ferreteria } = req.user;

    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);

    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }

    if (!id_categoria) {
        return res.status(400).json({ error: 'La categoría es requerida.' });
    }

    const id_producto = uuidv4();
    const { data, error } = await supabase
        .from('producto')
        .insert([
            {
                id_producto,
                nombre,
                sku,
                precio: numericPrecio,
                stock: integerStock,
                id_categoria,
                id_ferreteria,
                imagen_url  // 🔥 AHORA SÍ SE GUARDA EN LA BD
            }
        ])
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

    res.status(201).json(data[0]);
});


// PUT: Actualizar un producto existente
router.put('/productos/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params;
    const {
        nombre,
        sku,
        precio,
        stock,
        id_categoria,
        imagen_url  // 🔥 AGREGADO
    } = req.body;

    const numericPrecio = parseFloat(precio);
    const integerStock = parseInt(stock, 10);

    if (isNaN(numericPrecio) || isNaN(integerStock)) {
        return res.status(400).json({ error: 'Precio y stock deben ser números válidos.' });
    }

    const { data, error } = await supabase
        .from('producto')
        .update({
            nombre,
            sku,
            precio: numericPrecio,
            stock: integerStock,
            id_categoria,
            imagen_url  // 🔥 AHORA SÍ ACTUALIZA LA IMAGEN
        })
        .eq('id_producto', id)
        .select();

    if (error) {
        console.error('Error en Supabase:', error);
        return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data[0]);
});


// DELETE: Eliminar un producto
router.delete('/productos/:id', verifyToken, async (req: any, res) => {
    const { id } = req.params;
    const { id_ferreteria } = req.user;

    const { error } = await supabase
        .from('producto')
        .delete()
        .eq('id_producto', id)
        .eq('id_ferreteria', id_ferreteria);

    if (error) {
        console.error('Error de Supabase al eliminar:', error);
        return res.status(500).json({ error: error.message });
    }

    res.status(204).send();
});

export default router;
