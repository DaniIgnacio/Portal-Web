// src/pages/Login.tsx
import React, { useState } from 'react';
// La línea de SupabaseClient ya no es necesaria
// import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void; // Cambiado de setIsAuthenticated.
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, contraseña: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Llama a la nueva función onLoginSuccess para actualizar el estado en App.tsx
      onLoginSuccess(data.user, data.token);
      
      // Ya no navegamos aquí, lo hace App.tsx
      // addNotification('¡Inicio de sesión exitoso!', 'success');
      // navigate('/dashboard');
    } catch (error: any) {
      console.error('Error en el inicio de sesión:', error);
      addNotification(`Error de inicio de sesión: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
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
          <p className="forgot-password-link">
            <Link to="/forgot-password">Olvidé mi contraseña</Link>
          </p>
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