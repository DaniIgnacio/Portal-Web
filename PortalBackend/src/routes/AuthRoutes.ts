import { Router } from 'express';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

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
router.post('/register-full', async (req, res) => {
    try {
        const { 
            nombre, email, contraseña,
            rut, razon_social, direccion,
            latitud, longitud, telefono, api_key
        } = req.body;

        // 1. Validar campos requeridos para Ferretería y Usuario
        if (!nombre || !email || !contraseña || !rut || !razon_social || !direccion || !api_key) {
            return res.status(400).json({ error: 'Todos los campos de usuario y ferretería son requeridos (excepto latitud, longitud, teléfono).' });
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

        // 3. Verificar si el email del usuario ya existe
        const { data: existingUser, error: findUserError } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado para otro usuario.' });
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

        // 5. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // 6. Crear el Usuario asociado a la Ferretería
        const { data: newUserData, error: insertUserError } = await supabase
            .from('usuario')
            .insert([{ nombre, email, contraseña_hash: hashedPassword, id_ferreteria, fecha_registro: new Date().toISOString() }])
            .select();

        if (insertUserError || !newUserData || newUserData.length === 0) {
            console.error('Error al insertar usuario:', insertUserError);
            // Si falla el usuario, idealmente deberíamos hacer un rollback de la ferretería
            // Por simplicidad, no se implementará el rollback aquí, pero es una consideración importante.
            return res.status(500).json({ error: insertUserError?.message || 'Error al crear el usuario.' });
        }
        const newUser = newUserData[0];

        // 7. Generar JWT
        const token = jwt.sign({ id_usuario: newUser.id_usuario, id_ferreteria: newUser.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Ferretería y usuario registrados exitosamente', user: newUser, token });

    } catch (error: any) {
        console.error('Error en el registro completo:', error);
        res.status(500).json({ error: 'Error interno del servidor durante el registro.' });
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
