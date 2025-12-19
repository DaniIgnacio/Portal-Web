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
        // JOIN con producto para nombre y con cliente_app para datos del cliente
        const { data, error } = await supabase
            .from('pedido')
            .select(`
                *,
                cliente:cliente_app (
                    nombre,
                    email,
                    telefono
                ),
                detalle_pedido:detalle_pedido (
                    id_detalle_pedido,
                    id_pedido,
                    id_producto,
                    cantidad,
                    precio_unitario_venta,
                    precio_unitario_compra,
                    producto:producto (
                        nombre
                    )
                )
            `)
            .eq('id_ferreteria', id_ferreteria)
            .order('fecha_pedido', { ascending: false });

        if (error) {
            console.error('Error de Supabase al obtener pedidos:', error);
            return res.status(500).json({ error: error.message });
        }

        // Transformar los datos para aplanar el nombre del producto y del cliente
        const pedidosTransformados = data?.map((pedido: any) => ({
            ...pedido,
            // Aplanamos datos del cliente para que el frontend los lea directo
            nombre_cliente: pedido.cliente?.nombre || 'Cliente Desconocido',
            email_cliente: pedido.cliente?.email || '',
            telefono_cliente: pedido.cliente?.telefono || '',
            cliente: undefined, // Limpiamos el objeto anidado

            // Aplanamos el detalle del producto
            detalle_pedido: pedido.detalle_pedido?.map((detalle: any) => ({
                ...detalle,
                // Mapeamos a 'nombre_producto' que es lo que espera tu interfaz React
                nombre_producto: detalle.producto?.nombre || 'Producto sin nombre',
                producto: undefined
            }))
        }));

        res.json(pedidosTransformados);
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
            .select(`
                *,
                cliente:cliente_app (
                    nombre,
                    email,
                    telefono
                ),
                detalle_pedido:detalle_pedido (
                    *,
                    producto:producto (
                        nombre
                    )
                )
            `)
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria)
            .single();

        if (error || !data) {
            console.error('Error de Supabase al obtener pedido por ID:', error);
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Transformar para aplanar nombres
        const pedidoTransformado = {
            ...data,
            nombre_cliente: data.cliente?.nombre || 'Cliente Desconocido',
            email_cliente: data.cliente?.email || '',
            telefono_cliente: data.cliente?.telefono || '',
            cliente: undefined,
            
            detalle_pedido: data.detalle_pedido?.map((detalle: any) => ({
                ...detalle,
                nombre_producto: detalle.producto?.nombre || 'Producto sin nombre',
                producto: undefined
            }))
        };

        res.json(pedidoTransformado);
    } catch (err) {
        console.error('Error interno al obtener el pedido:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT: Actualizar estado del pedido (flujo simple + correo)
router.put('/pedidos/:id/estado', verifyToken, async (req: any, res) => {
    const { id_ferreteria } = req.user;
    const { id } = req.params;
    const { estado } = req.body;
    console.log('👉 Estado recibido:', estado);

    const FLUJO_ESTADOS: Record<string, string[]> = {
        pagado: ['preparando'],
        preparando: ['listo_retiro'],
        listo_retiro: ['retirado'],
    };

    if (!estado) {
        return res.status(400).json({ error: 'Estado requerido' });
    }

    try {
        // 1. Buscar pedido
        const { data: pedido, error } = await supabase
            .from('pedido')
            .select('estado, id_cliente')
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria)
            .single();

        if (error || !pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // 2. Validar transición
        const permitidos = FLUJO_ESTADOS[pedido.estado];
        // Nota: Permitimos re-enviar el mismo estado por seguridad o forzamos validación estricta
        if (!permitidos || !permitidos.includes(estado)) {
             // Opcional: Puedes comentar esto si quieres permitir saltos manuales para pruebas
            return res.status(400).json({
                error: `No se puede cambiar de '${pedido.estado}' a '${estado}'`,
            });
        }

        // 3. Actualizar estado
        const { error: updateError } = await supabase
            .from('pedido')
            .update({ estado })
            .eq('id_pedido', id)
            .eq('id_ferreteria', id_ferreteria);

        if (updateError) {
            console.error('Error actualizando estado:', updateError);
            return res.status(500).json({ error: updateError.message });
        }

        // 4. 👉 SI queda listo para retiro, enviar correo
        if (estado === 'listo_retiro') {
            console.log('🚀 Entró a listo_retiro, enviando correo');
            // Obtener datos del cliente
            const { data: cliente } = await supabase
                .from('cliente_app')
                .select('email, nombre')
                .eq('id_cliente', pedido.id_cliente)
                .single();
            console.log('📧 Cliente obtenido:', cliente);

            if (cliente?.email) {
                console.log('📤 Llamando Edge Function...');

                const response = await fetch(
                    'https://bhlsmetxwtqypdyxcmyk.supabase.co/functions/v1/pedido-listo-retiro',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                        },
                        body: JSON.stringify({
                            id_pedido: id,
                            email: cliente.email,
                            nombre: cliente.nombre,
                        }),
                    }
                );
                const text = await response.text();
                console.log('📨 Respuesta Edge Function:', text);
            } else {
                console.warn('Pedido listo para retiro, pero cliente sin email');
            }
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