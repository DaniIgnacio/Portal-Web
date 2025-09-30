import { Router } from 'express';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Clave para tokens emitidos por tu backend
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || JWT_SECRET; // Clave para verificar tokens de Supabase

console.log('Backend JWT_SECRET cargado:', JWT_SECRET);
console.log('Backend SUPABASE_JWT_SECRET cargado:', SUPABASE_JWT_SECRET);

const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    try {
        // Intentar verificar el token con la clave de Supabase primero
        const decodedSupabase = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub: string, email: string, iat: number, exp: number }; // Tipado para token de Supabase
        req.user = { id_usuario: decodedSupabase.sub, email: decodedSupabase.email }; // Mapear sub a id_usuario
        next();
    } catch (err) {
        console.error('Error al verificar token con clave de Supabase (intentando fallback a clave local):', err);
        // Si falla con la clave de Supabase, intentar con la clave local (por si es un token de login/registro de tu propio backend)
        try {
            const decodedLocal = jwt.verify(token, JWT_SECRET) as { id_usuario: string, id_ferreteria: string, iat: number, exp: number }; // Tipado para token local
            req.user = decodedLocal; // Usar el payload completo para tokens locales
            next();
        } catch (errFallback) {
            console.error('Error al verificar token con clave local:', errFallback);
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
    }
};

// Ruta de registro existente (mantenida por si acaso, aunque el frontend usará la nueva)
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, contraseña, id_ferreteria } = req.body;

        if (!nombre || !email || !contraseña || !id_ferreteria) {
            return res.status(400).json({ error: 'Nombre, email, contraseña e ID de ferretería son requeridos' });
        }

        const { data: ferreteriaData, error: ferreteriaError } = await supabase
            .from('ferreteria')
            .select('id_ferreteria')
            .eq('id_ferreteria', id_ferreteria)
            .single();

        if (ferreteriaError || !ferreteriaData) {
            return res.status(400).json({ error: 'ID de ferretería inválido o no existente.' });
        }

        const { data: existingUser, error: findUserError } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);

        const { data, error } = await supabase
            .from('usuario')
            .insert([{ nombre, email, contraseña_hash: hashedPassword, id_ferreteria }])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const newUser = data[0];
        const token = jwt.sign({ id_usuario: newUser.id_usuario, id_ferreteria: newUser.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser, token });
    } catch (error: any) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Nueva ruta para registro completo (Ferretería + Usuario)
// Esta ruta ahora SOLO crea la Ferretería y el registro del usuario en public.usuario
// El registro de AUTH del usuario se hace desde el frontend con Supabase Auth.
router.post('/register-full', async (req, res) => {
    try {
        const { 
            supabase_auth_id, // El ID UUID del usuario de Supabase Auth
            nombre, email, // Nombre y email del usuario (para public.usuario)
            rut, razon_social, direccion,
            latitud, longitud, telefono, api_key,
            rut_usuario // Añadir RUT del usuario
        } = req.body;

        // 1. Validar campos requeridos para Ferretería y Usuario (excluyendo contraseña del body aquí)
        if (!supabase_auth_id || !nombre || !email || !rut_usuario || !rut || !razon_social || !direccion || !api_key) {
            return res.status(400).json({ error: 'Todos los campos de usuario (ID de Supabase, nombre, email, RUT) y ferretería son requeridos (excepto latitud, longitud, teléfono).' });
        }

        // 2. Verificar si el RUT de la ferretería ya existe
        const { data: existingFerreteria, error: findFerreteriaError } = await supabase
            .from('ferreteria')
            .select('id_ferreteria')
            .eq('rut', rut)
            .single();

        if (existingFerreteria) {
            return res.status(409).json({ error: 'Ya existe una ferretería con este RUT.' });
        }

        // 3. Verificar si el email del usuario ya existe en public.usuario (aunque Supabase Auth ya lo maneja para auth.users)
        const { data: existingPublicUser, error: findPublicUserError } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', email)
            .single();
        
        if (existingPublicUser) {
            // Esto no debería pasar si el signup en Supabase Auth es exitoso y único
            // Pero como fallback, si ya existe en public.usuario, es un conflicto.
            return res.status(409).json({ error: 'El email ya está registrado para otro usuario en la base de datos pública.' });
        }

        // 4. Crear la Ferretería
        const { data: newFerreteriaData, error: insertFerreteriaError } = await supabase
            .from('ferreteria')
            .insert([{ 
                rut, razon_social, direccion,
                latitud: latitud ? parseFloat(latitud) : null,
                longitud: longitud ? parseFloat(longitud) : null,
                telefono: telefono || null,
                api_key
            }])
            .select();

        if (insertFerreteriaError || !newFerreteriaData || newFerreteriaData.length === 0) {
            console.error('Error al insertar ferretería:', insertFerreteriaError);
            return res.status(500).json({ error: insertFerreteriaError?.message || 'Error al crear la ferretería.' });
        }
        const id_ferreteria = newFerreteriaData[0].id_ferreteria;

        // 5. Crear el Usuario en public.usuario, usando el ID de Supabase Auth
        const { data: newUserData, error: insertUserError } = await supabase
            .from('usuario')
            .insert([{ 
                id_usuario: supabase_auth_id, // Usar el ID de Supabase Auth aquí
                nombre, email, 
                contraseña_hash: '', // La contraseña_hash ya no es la principal, pero se mantiene por compatibilidad si es NOT NULL.
                                    // Opcional: podrías eliminar esta columna si confías solo en Supabase Auth.
                id_ferreteria, fecha_registro: new Date().toISOString(), rut: rut_usuario 
            }])
            .select();

        if (insertUserError || !newUserData || newUserData.length === 0) {
            console.error('Error al insertar usuario en la tabla pública:', insertUserError);
            // Si falla el usuario, idealmente deberíamos hacer un rollback de la ferretería
            return res.status(500).json({ error: insertUserError?.message || 'Error al crear el usuario en la tabla pública.' });
        }
        const newUser = newUserData[0];

        // 6. Generar JWT (este token sigue siendo para tu sistema, pero puede no ser necesario si solo usas Supabase Auth)
        const token = jwt.sign({ id_usuario: newUser.id_usuario, id_ferreteria: newUser.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Ferretería y usuario registrados exitosamente', user: newUser, token });

    } catch (error: any) {
        console.error('Error en el registro completo (backend):', error);
        res.status(500).json({ error: 'Error interno del servidor durante el registro completo.' });
    }
});

// PUT: Actualizar información del usuario
router.put('/users/:id', verifyToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { nombre, email } = req.body;
        const { id_usuario } = req.user; // ID del usuario autenticado desde el token

        // Asegurarse de que el usuario solo pueda actualizar su propio perfil
        if (id !== id_usuario) {
            return res.status(403).json({ error: 'No autorizado para actualizar este perfil de usuario.' });
        }

        const updateData: { nombre?: string; email?: string } = {};
        if (nombre) updateData.nombre = nombre;
        if (email) {
            // Opcional: verificar si el nuevo email ya está en uso por otro usuario
            const { data: existingUser, error: findUserError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('email', email)
                .neq('id_usuario', id_usuario) // Excluir al propio usuario
                .single();

            if (existingUser) {
                return res.status(409).json({ error: 'El nuevo email ya está registrado para otro usuario.' });
            }
            updateData.email = email;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
        }

        const { data, error } = await supabase
            .from('usuario')
            .update(updateData)
            .eq('id_usuario', id)
            .select();

        if (error) {
            console.error('Error de Supabase al actualizar usuario:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o no autorizado para actualizar.' });
        }

        res.json(data[0]);
    } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT: Actualizar solo la contraseña_hash del usuario en la tabla public.usuario
router.put('/users/:id/password', verifyToken, async (req: any, res) => {
    try {
        const { id } = req.params; // id del usuario a actualizar
        const { newPassword } = req.body; // La nueva contraseña sin hashear
        const id_usuario_from_token = req.user.id_usuario; // ID del usuario autenticado desde el token (ahora puede ser de Supabase Auth o local)

        // Asegurarse de que el usuario solo pueda actualizar su propia contraseña
        if (id !== id_usuario_from_token) {
            return res.status(403).json({ error: 'No autorizado para actualizar la contraseña de este usuario. ID del token no coincide con el ID de la URL.' });
        }

        if (!newPassword) {
            return res.status(400).json({ error: 'Nueva contraseña es requerida.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Antes de actualizar, verificar que el ID de Supabase Auth existe en tu tabla public.usuario
        const { data: existingPublicUser, error: publicUserError } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('id_usuario', id_usuario_from_token) // Buscar por el ID que viene del token de Supabase
            .single();

        if (publicUserError || !existingPublicUser) {
            console.error('Error: Usuario de la base de datos pública no encontrado para el ID del token.', publicUserError);
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos pública o no autorizado.' });
        }

        const { data, error } = await supabase
            .from('usuario')
            .update({ contraseña_hash: hashedPassword })
            .eq('id_usuario', id_usuario_from_token) // Usar el ID del token para la actualización
            .select();

        if (error) {
            console.error('Error de Supabase al actualizar contraseña de usuario:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o no autorizado para actualizar la contraseña.' });
        }

        res.json({ message: 'Contraseña de usuario actualizada exitosamente en la base de datos pública.' });

    } catch (error: any) {
        console.error('Error al actualizar la contraseña de usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT: Actualizar información de la ferretería asociada al usuario
router.put('/ferreterias/:id', verifyToken, async (req: any, res) => {
    try {
        const { id } = req.params; // id de la ferretería a actualizar
        const { rut, razon_social, direccion, latitud, longitud, telefono, api_key } = req.body;
        const { id_ferreteria } = req.user; // id_ferreteria del usuario autenticado

        // Asegurarse de que el usuario solo pueda actualizar su ferretería asociada
        if (id !== id_ferreteria) {
            return res.status(403).json({ error: 'No autorizado para actualizar esta ferretería.' });
        }

        const updateData: any = {};
        if (rut) {
            // Opcional: verificar si el nuevo RUT ya está en uso por otra ferretería
            const { data: existingFerreteria, error: findFerreteriaError } = await supabase
                .from('ferreteria')
                .select('id_ferreteria')
                .eq('rut', rut)
                .neq('id_ferreteria', id_ferreteria) // Excluir a la propia ferretería
                .single();

            if (existingFerreteria) {
                return res.status(409).json({ error: 'El nuevo RUT ya está registrado para otra ferretería.' });
            }
            updateData.rut = rut;
        }
        if (razon_social) updateData.razon_social = razon_social;
        if (direccion) updateData.direccion = direccion;
        if (latitud !== undefined) updateData.latitud = parseFloat(latitud); // Permitir null o valor
        if (longitud !== undefined) updateData.longitud = parseFloat(longitud); // Permitir null o valor
        if (telefono !== undefined) updateData.telefono = telefono; // Permitir null o valor
        if (api_key) updateData.api_key = api_key;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
        }

        const { data, error } = await supabase
            .from('ferreteria')
            .update(updateData)
            .eq('id_ferreteria', id)
            .select();

        if (error) {
            console.error('Error de Supabase al actualizar ferretería:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Ferretería no encontrada o no autorizado para actualizar.' });
        }

        res.json(data[0]);
    } catch (error: any) {
        console.error('Error al actualizar ferretería:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, contraseña } = req.body;

        if (!email || !contraseña) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data: userData, error } = await supabase
            .from('usuario')
            .select('*, ferreteria:id_ferreteria(razon_social)')
            .eq('email', email)
            .single();

        if (error || !userData) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(contraseña, userData.contraseña_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id_usuario: userData.id_usuario, id_ferreteria: userData.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Inicio de sesión exitoso', token, user: { id_usuario: userData.id_usuario, nombre: userData.nombre, email: userData.email, id_ferreteria: userData.id_ferreteria, ferreteria_razon_social: userData.ferreteria?.razon_social } });
    } catch (error: any) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
