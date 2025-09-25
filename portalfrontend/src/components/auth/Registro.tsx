 // src/pages/Registro.tsx
import React, { useState } from 'react';
// La línea de SupabaseClient ya no es necesaria
// import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';

interface RegistroProps {
  onRegisterSuccess: () => void;
}

const Registro: React.FC<RegistroProps> = ({ onRegisterSuccess }) => {
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rut, setRut] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const registerData = {
      nombre,
      email,
      contraseña: password,
      rut,
      razon_social: razonSocial,
      direccion,
      latitud: latitud === '' ? undefined : latitud,
      longitud: longitud === '' ? undefined : longitud,
      telefono: telefono === '' ? undefined : telefono,
      api_key: apiKey,
    };

    try {
      const response = await fetch('http://localhost:5000/api/register-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Llama a la nueva función onRegisterSuccess para actualizar el estado en App.tsx
      onRegisterSuccess();
      
      addNotification('¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
      // navigate('/login'); // Ya no navegamos aquí
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
          <p>Ingresa tus datos para registrarte y tu ferretería.</p>
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
          <div className="form-separator"></div> {/* Separador visual */}
          <h3>Datos de la Ferretería</h3>
          <div className="form-group">
            <label htmlFor="rut">RUT de la Ferretería</label>
            <input
              id="rut"
              type="text"
              placeholder="Ej: 12.345.678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="razonSocial">Razón Social</label>
            <input
              id="razonSocial"
              type="text"
              placeholder="Nombre de tu ferretería"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              type="text"
              placeholder="Dirección de la ferretería"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitud">Latitud (Opcional)</label>
              <input
                id="latitud"
                type="number"
                step="any"
                placeholder="Ej: -33.456789"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitud">Longitud (Opcional)</label>
              <input
                id="longitud"
                type="number"
                step="any"
                placeholder="Ej: -70.648274"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="telefono">Teléfono (Opcional)</label>
            <input
              id="telefono"
              type="tel"
              placeholder="Ej: +56 9 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="text"
              placeholder="Clave única para tu ferretería"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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