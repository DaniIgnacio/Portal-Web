import { Router } from 'express';
import { supabase } from '../supabase';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

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

// GET: Obtener pedidos de la ferretería autenticada
router.get('/pedidos', verifyToken, async (req: any, res) => {
    const { id_ferreteria } = req.user;

    try {
        // Seleccionamos campos importantes y agregamos la relación detalle_pedido si existe
        const { data, error } = await supabase
            .from('pedido')
            .select(`*, detalle_pedido:detalle_pedido(*)`)
            .eq('id_ferreteria', id_ferreteria)
            .order('fecha_pedido', { ascending: false });

        if (error) {
            console.error('Error de Supabase al obtener pedidos:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Error interno al obtener pedidos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET: Obtener un pedido por ID (solo si pertenece a la ferretería autenticada)
router.get('/pedidos/:id', verifyToken, async (req: any, res) => {
    const { id_ferreteria } = req.user;
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('pedido')
            .select(`*, detalle_pedido:detalle_pedido(*)`)
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria)
            .single();

        if (error || !data) {
            console.error('Error de Supabase al obtener pedido por ID:', error);
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(data);
    } catch (err) {
        console.error('Error interno al obtener el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT: Actualizar estado del pedido (flujo simple)
router.put('/pedidos/:id/estado', verifyToken, async (req: any, res) => {
    const { id_ferreteria } = req.user;
    const { id } = req.params;
    const { estado } = req.body;

    const FLUJO_ESTADOS: Record<string, string[]> = {
        pagado: ['preparando'],
        preparando: ['listo_retiro'],
        listo_retiro: ['retirado'],
    };

    if (!estado) {
        return res.status(400).json({ error: 'Estado requerido' });
    }

    try {
        // 1. Buscar pedido y validar pertenencia
        const { data: pedido, error } = await supabase
            .from('pedido')
            .select('estado')
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria)
            .single();

        if (error || !pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // 2. Validar transición de estado
        const permitidos = FLUJO_ESTADOS[pedido.estado];

        if (!permitidos || !permitidos.includes(estado)) {
            return res.status(400).json({
                error: `No se puede cambiar de '${pedido.estado}' a '${estado}'`,
            });
        }

        // 3. Actualizar estado
        const { error: updateError } = await supabase
            .from('pedido')
            .update({
                estado,
                
            })
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria);

        if (updateError) {
            console.error('Error actualizando estado:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        res.json({
            message: 'Estado del pedido actualizado correctamente',
            estado,
        });

    } catch (err) {
        console.error('Error interno al actualizar estado:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


export default router;
