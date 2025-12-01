 // src/pages/Registro.tsx
import React, { useState } from 'react';
// La línea de SupabaseClient ya no es necesaria
// import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';
import usePasswordStrength from '../../hooks/usePasswordStrength'; // Importar el hook
import { supabase } from '../../supabaseClient'; // Corregir la ruta de importación
import { formatHorarioList } from '../../utils/horarioUtils';

interface RegistroProps {
  onRegisterSuccess: () => void;
}

const Registro: React.FC<RegistroProps> = ({ onRegisterSuccess }) => {
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rutUsuario, setRutUsuario] = useState<string>(''); // Nuevo estado para el RUT del usuario
  const [rut, setRut] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [horario, setHorario] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  
  const passwordStrength = usePasswordStrength(password); // Usar el hook

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Validar fortaleza mínima de la contraseña antes de enviar
    if (passwordStrength.strength === 'Débil') {
      addNotification('Tu contraseña es demasiado débil. Por favor, mejora su fortaleza.', 'error');
      setLoading(false);
      return;
    }

    try {
      // Paso 1: Registrar al usuario en Supabase Auth primero
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Caso especial: el usuario ya existe en Supabase Auth
        if (authError.message && authError.message.toLowerCase().includes('already registered')) {
          addNotification('Este correo ya tiene una cuenta. Por favor, inicia sesión para registrar tu ferretería.', 'info');
          navigate('/login');
          return;
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener el usuario de Supabase Auth después del registro.');
      }

      const supabaseAuthId = authData.user.id; // Obtener el UUID del usuario de Supabase Auth

      // Paso 2: Construir los datos para tu backend, incluyendo el ID de Supabase Auth
      // Validar horario JSON si está presente
      if (horario) {
        try {
          JSON.parse(horario);
        } catch (err) {
          addNotification('El formato del horario JSON es inválido.', 'error');
          setLoading(false);
          return;
        }
      }

      const registerDataToBackend = {
        supabase_auth_id: supabaseAuthId, // ID de Supabase Auth
        nombre,
        email,
        // Enviamos la contraseña al backend para mantener sincronizada la contraseña_hash
        password,
        rut_usuario: rutUsuario,
        rut,
        razon_social: razonSocial,
        direccion,
        latitud: latitud === '' ? undefined : latitud,
        longitud: longitud === '' ? undefined : longitud,
        telefono: telefono === '' ? undefined : telefono,
        api_key: apiKey,
        descripcion: descripcion === '' ? undefined : descripcion,
        horario: horario ? JSON.parse(horario) : undefined,
      };

      // Paso 3: Llamar a tu backend para guardar los detalles adicionales en public.usuario y ferreteria
      const response = await fetch('http://localhost:5000/api/register-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerDataToBackend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario y ferretería en el backend.');
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
      <div className="auth-card register"> {/* Añadir clase 'register' aquí */}
        <div className="auth-header">
          <h2>Crea tu Cuenta</h2>
          <p>Ingresa tus datos para registrarte y tu ferretería.</p>
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="register-grid"> {/* Contenedor para las dos columnas */}
            <div className="grid-column"> {/* Columna para datos de usuario */}
              <h3>Datos de Usuario</h3>
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
              <div className="form-group"> {/* Nuevo campo para RUT del usuario */}
                <label htmlFor="rutUsuario">RUT del Usuario</label>
                <input
                  id="rutUsuario"
                  type="text"
                  placeholder="Ej: 12.345.678-9"
                  value={rutUsuario}
                  onChange={(e) => setRutUsuario(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-column"> {/* Columna para datos de ferretería */}
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
              <div className="form-group">
                <label htmlFor="descripcion">Descripción (Opcional)</label>
                <textarea
                  id="descripcion"
                  placeholder="Breve descripción de la ferretería"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label htmlFor="horario">Horario (Opcional, JSON)</label>
                <textarea
                  id="horario"
                  placeholder={`{\n  "lunes": "09:00-18:00",\n  "sabado": "10:00-14:00"\n}`}
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  rows={4}
                  style={{fontFamily:'monospace'}}
                />
                {horario && (() => {
                  try {
                    const parsed = JSON.parse(horario);
                    const items = formatHorarioList(parsed);
                    return (
                      <ul style={{padding:0, listStyle:'none', marginTop:8}}>
                        {items.map(i => <li key={i.day}><strong>{i.day}:</strong> {i.time}</li>)}
                      </ul>
                    );
                  } catch (err) {
                    return <div style={{color:'#e63946'}}>JSON inválido</div>;
                  }
                })()}
              </div>
            </div>
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || password.length === 0 || passwordStrength.strength === 'Débil' || !passwordStrength.isLongEnough}
          >
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