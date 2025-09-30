import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Importar el cliente de Supabase
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';
import usePasswordStrength from '../hooks/usePasswordStrength'; // Importar el hook
import '../components/auth/AuthForm.css'; // Reutilizamos estilos del formulario de autenticación

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null); // Nuevo estado para el tipo de mensaje
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const passwordStrength = usePasswordStrength(password); // Usar el hook

  // useEffect para manejar el token de la URL (si es necesario)
  // Supabase automáticamente maneja la sesión después de redirigir, así que no es estrictamente necesario extraerlo aquí manualmente
  // Pero es bueno para depuración o si la lógica cambia.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('access_token'); // Supabase usa 'access_token' para el enlace de restablecimiento
    if (!token) {
      // Si no hay token, el usuario no debería estar en esta página directamente
      // O se maneja de alguna otra forma (ej. redirigir a forgot-password)
      console.warn("No se encontró token de acceso en la URL para restablecer contraseña.");
    }
  }, [location.search]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setMessageType(null); // Limpiar el tipo de mensaje

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setMessageType('error'); // Mensaje de error
      addNotification('Las contraseñas no coinciden.', 'error');
      setLoading(false);
      return;
    }

    // Validar fortaleza mínima de la contraseña antes de enviar
    if (passwordStrength.strength === 'Débil') {
      addNotification('Tu nueva contraseña es demasiado débil. Por favor, mejora su fortaleza.', 'error');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }

      // --- INICIO: NUEVA LÓGICA PARA ACTUALIZAR CONTRASEÑA EN BACKEND ---
      const { data: { session } } = await supabase.auth.getSession();

      if (session && session.user && session.access_token) {
        const id_usuario = session.user.id;
        const token = session.access_token;

        const backendResponse = await fetch(`http://localhost:5000/api/users/${id_usuario}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: password }),
        });

        if (!backendResponse.ok) {
          const backendErrorData = await backendResponse.json();
          throw new Error(backendErrorData.error || 'Error al sincronizar contraseña con el backend.');
        }
        // console.log("Backend password update success:", await backendResponse.json()); // Para depuración
      } else {
        console.warn("No hay sesión activa después de restablecer contraseña. No se pudo sincronizar con el backend.");
      }
      // --- FIN: NUEVA LÓGICA PARA ACTUALIZAR CONTRASEÑA EN BACKEND ---

      setMessage('¡Tu contraseña ha sido restablecida exitosamente! Redirigiendo al login...');
      setMessageType('success'); // Mensaje de éxito
      addNotification('¡Contraseña restablecida! Ya puedes iniciar sesión con tu nueva contraseña.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirigir al login después de 3 segundos
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      setMessage(error.message || 'Error al restablecer la contraseña.');
      setMessageType('error'); // Mensaje de error
      addNotification(`Error: ${error.message || 'Error al restablecer la contraseña.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card"> {/* Reutilizamos la tarjeta de autenticación */}
        <div className="auth-header">
          <h2>Restablecer Contraseña</h2>
          <p>Ingresa tu nueva contraseña.</p>
        </div>
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Tu nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="password-strength-feedback"> {/* Contenedor para el feedback de la contraseña */}
              <p className="strength-label">Fortaleza: <span className={`strength-${passwordStrength.strength.toLowerCase()}`}>{passwordStrength.strength}</span></p>
              <ul>
                <li className={passwordStrength.isLongEnough ? 'fulfilled' : ''}>Al menos 8 caracteres</li>
                <li className={passwordStrength.hasUpperCase ? 'fulfilled' : ''}>Una letra mayúscula</li>
                <li className={passwordStrength.hasLowerCase ? 'fulfilled' : ''}>Una letra minúscula</li>
                <li className={passwordStrength.hasNumber ? 'fulfilled' : ''}>Un número</li>
                <li className={passwordStrength.hasSymbol ? 'fulfilled' : ''}>Un símbolo (!@#$...)</li>
              </ul>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirma tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || password.length === 0 || confirmPassword.length === 0 || password !== confirmPassword || passwordStrength.strength === 'Débil' || !passwordStrength.isLongEnough}
          >
            {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
          </button>
        </form>
        {message && (
          <p className={`message-feedback ${messageType === 'success' ? 'success-message' : 'error-message'}`} style={{ textAlign: 'center', marginTop: '20px' }}>
            {message}
          </p>
        )}
        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ResetPasswordPage;
