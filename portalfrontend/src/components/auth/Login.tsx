// src/pages/Login.tsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Asegúrate de tener este archivo
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate para redireccionar
import './AuthForm.css'; // <-- Importar el CSS de estilos
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate(); // Hook para redireccionar
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      addNotification(`Error de inicio de sesión: ${error.message}`, 'error');
    } else {
      addNotification('¡Inicio de sesión exitoso!', 'success');
      navigate('/dashboard'); // Redirigir al dashboard después de iniciar sesión
    }
    setLoading(false);
  };

  return (
    <div className="auth-container"> {/* Contenedor principal para centrar */}
      <div className="auth-card"> {/* La tarjeta blanca */}
        <div className="auth-header">
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para acceder a tu portal.</p>
        </div>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default Login;