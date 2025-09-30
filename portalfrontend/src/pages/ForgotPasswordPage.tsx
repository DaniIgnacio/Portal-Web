import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Importar el cliente de Supabase
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';
import '../components/auth/AuthForm.css'; // Reutilizamos estilos del formulario de autenticación

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage('¡Enlace de recuperación enviado! Revisa tu correo electrónico.');
      addNotification('¡Enlace de recuperación enviado! Revisa tu correo electrónico.', 'success');
      setEmail(''); // Limpiar el campo de email
    } catch (error: any) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      setMessage(error.message || 'Error al enviar el enlace de recuperación.');
      addNotification(`Error: ${error.message || 'Error al enviar el enlace de recuperación.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card"> {/* Reutilizamos la tarjeta de autenticación */}
        <div className="auth-header">
          <h2>Recuperar Contraseña</h2>
          <p>Ingresa tu correo electrónico para recibir un enlace de restablecimiento.</p>
        </div>
        <form className="auth-form" onSubmit={handleForgotPassword}>
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
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ForgotPasswordPage;






