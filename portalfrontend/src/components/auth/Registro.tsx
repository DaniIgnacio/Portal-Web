// src/pages/Registro.tsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Asegúrate de tener este archivo
import { Link } from 'react-router-dom';
import './AuthForm.css'; // <-- Importar el CSS de estilos
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';

const Registro = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      addNotification(`Error de registro: ${error.message}`, 'error');
    } else {
      addNotification('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.', 'success');
      // No redirigir automáticamente, permitir que el usuario vaya al login manualmente
    }
    setLoading(false);
  };

  return (
    <div className="auth-container"> {/* Contenedor principal para centrar */}
      <div className="auth-card"> {/* La tarjeta blanca */}
        <div className="auth-header">
          <h2>Crea tu Cuenta</h2>
          <p>Ingresa tus datos para registrarte.</p>
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
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
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default Registro;