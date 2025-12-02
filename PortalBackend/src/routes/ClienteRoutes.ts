import { Router } from 'express';
import { supabase } from '../supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || JWT_SECRET;

// Middleware para verificar token JWT (compatible con Supabase y tokens locales)
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
  }

  // intentamos verificar con la clave de Supabase primero
  try {
    const decodedSupabase = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub: string, email: string, iat: number, exp: number };
    req.user = { id_usuario: decodedSupabase.sub, email: decodedSupabase.email };
    return next();
  } catch (err) {
    // fallback a la clave local
    try {
      const decodedLocal = jwt.verify(token, JWT_SECRET) as { id_usuario: string, id_ferreteria?: string, iat: number, exp: number };
      req.user = decodedLocal;
      return next();
    } catch (errFallback) {
      console.error('Error al verificar token con Supabase y clave local:', err, errFallback);
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
  }
};

const router = Router();

// GET: Obtener todos los clientes de la tabla cliente_app
router.get('/clientes', verifyToken, async (req: any, res: any) => {
  try {
    // Solo administradores pueden acceder a esta ruta: verificamos rol en la tabla usuario
    const id_usuario = req.user?.id_usuario;
    const { data: userData, error: userError } = await supabase
      .from('usuario')
      .select('rol')
      .eq('id_usuario', id_usuario)
      .single();

    if (userError || !userData || userData.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Requiere rol admin.' });
    }
    const { data, error } = await supabase
      .from('cliente_app')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      console.error('Error de Supabase al obtener clientes:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (error) {
    console.error('Error interno al obtener clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
