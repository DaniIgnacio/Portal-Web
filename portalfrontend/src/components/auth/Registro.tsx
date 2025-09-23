 // src/pages/Registro.tsx
import React, { useState } from 'react';
// La línea de SupabaseClient ya no es necesaria
// import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';

const Registro = () => {
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [idFerreteria, setIdFerreteria] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, email, contraseña: password, id_ferreteria: idFerreteria.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      addNotification('¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
      navigate('/login');
    } catch (error: any) {
      console.error('Error en el registro:', error);
      addNotification(`Error de registro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Crea tu Cuenta</h2>
          <p>Ingresa tus datos para registrarte.</p>
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
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
          <div className="form-group">
            <label htmlFor="idFerreteria">ID de Ferretería</label>
            <input
              id="idFerreteria"
              type="text"
              placeholder="ID de tu ferretería"
              value={idFerreteria}
              onChange={(e) => setIdFerreteria(e.target.value)}
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