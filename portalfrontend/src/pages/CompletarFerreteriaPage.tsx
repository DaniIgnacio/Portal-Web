import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CategoriasPage.css'; // Reutilizamos estilos de página para mantener consistencia
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

const API_URL = 'http://localhost:5000/api';

const CompletarFerreteriaPage: React.FC = () => {
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.id_ferreteria) {
        // Si ya tiene ferretería asociada, no tiene sentido estar en esta página
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error al parsear usuario en CompletarFerreteriaPage:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      addNotification('Tu sesión ha expirado. Vuelve a iniciar sesión.', 'error');
      navigate('/login');
      setLoading(false);
      return;
    }

    let userParsed: any;
    try {
      userParsed = JSON.parse(storedUser);
    } catch (error) {
      console.error('Error al parsear usuario antes de crear ferretería:', error);
      addNotification('Ocurrió un problema con los datos de tu sesión. Por favor, inicia sesión nuevamente.', 'error');
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userParsed.id_usuario}/link-ferreteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rut,
          razon_social: razonSocial,
          direccion,
          latitud: latitud === '' ? undefined : latitud,
          longitud: longitud === '' ? undefined : longitud,
          telefono: telefono === '' ? undefined : telefono,
          api_key: apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear y enlazar la ferretería.');
      }

      // Actualizar datos de usuario y token en localStorage con la respuesta del backend
      if (data.user && data.token) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
      }

      addNotification('¡Ferretería creada y enlazada exitosamente! Ya puedes usar el portal completo.', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error al crear ferretería desde CompletarFerreteriaPage:', error);
      addNotification(`Error al crear ferretería: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Completa los datos de tu ferretería</h2>
        <p>Detectamos que tu usuario no tiene una ferretería asociada. Completa este formulario para continuar.</p>
      </div>
      <div className="page-content">
        <div className="card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rut">RUT de la Ferretería</label>
                <input
                  id="rut"
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="Ej: 12.345.678-9"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="razonSocial">Razón Social</label>
                <input
                  id="razonSocial"
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Nombre de tu ferretería"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección de la ferretería"
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
                  value={latitud}
                  onChange={(e) => setLatitud(e.target.value)}
                  placeholder="Ej: -33.456789"
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitud">Longitud (Opcional)</label>
                <input
                  id="longitud"
                  type="number"
                  step="any"
                  value={longitud}
                  onChange={(e) => setLongitud(e.target.value)}
                  placeholder="Ej: -70.648274"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono (Opcional)</label>
              <input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +56 9 1234 5678"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apiKey">API Key</label>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Clave única para tu ferretería"
                required
              />
            </div>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Ferretería'}
            </button>
          </form>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default CompletarFerreteriaPage;




