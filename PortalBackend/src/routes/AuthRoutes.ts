import { Router } from 'express';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Usar variable de entorno real

// Middleware para verificar token (opcional, para rutas protegidas)
// const verifyToken = (req: any, res: any, next: any) => {
//     const token = req.header('Authorization');
//     if (!token) return res.status(401).json({ error: 'Acceso denegado' });

//     try {
//         const verified = jwt.verify(token, JWT_SECRET);
//         req.user = verified;
//         next();
//     } catch (err) {
//         res.status(400).json({ error: 'Token inválido' });
//     }
// };

// POST: Registrar un nuevo usuario y asociarlo a una ferretería
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, contraseña, id_ferreteria } = req.body;

        if (!nombre || !email || !contraseña || !id_ferreteria) {
            return res.status(400).json({ error: 'Nombre, email, contraseña e ID de ferretería son requeridos' });
        }

        // Verificar si la ferretería existe
        const { data: ferreteriaData, error: ferreteriaError } = await supabase
            .from('ferreteria') // Cambiado de 'Ferreteria' a 'ferreteria'
            .select('id_ferreteria')
            .eq('id_ferreteria', id_ferreteria)
            .single();
        
        if (ferreteriaError || !ferreteriaData) {
            return res.status(400).json({ error: 'ID de ferretería inválido o no existente.' });
        }

        // Verificar si el usuario ya existe
        const { data: existingUser, error: findUserError } = await supabase
            .from('usuario') // Cambiado de 'Usuario' a 'usuario'
            .select('id_usuario')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);

        const { data, error } = await supabase
            .from('usuario') // Cambiado de 'Usuario' a 'usuario'
            .insert([{ nombre, email, contraseña_hash: hashedPassword, id_ferreteria }])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const newUser = data[0];
        // Opcional: Generar token JWT en el registro también
        const token = jwt.sign({ id_usuario: newUser.id_usuario, id_ferreteria: newUser.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser, token });
    } catch (error: any) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST: Iniciar sesión de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, contraseña } = req.body;

        if (!email || !contraseña) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data: userData, error } = await supabase
            .from('usuario') // Cambiado de 'Usuario' a 'usuario'
            .select('*, ferreteria:id_ferreteria(razon_social)') // Seleccionar también la razón social de la ferretería
            .eq('email', email)
            .single();

        if (error || !userData) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(contraseña, userData.contraseña_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign({ id_usuario: userData.id_usuario, id_ferreteria: userData.id_ferreteria }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Inicio de sesión exitoso', token, user: { id_usuario: userData.id_usuario, nombre: userData.nombre, email: userData.email, id_ferreteria: userData.id_ferreteria, ferreteria_razon_social: userData.ferreteria?.razon_social } });
    } catch (error: any) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
