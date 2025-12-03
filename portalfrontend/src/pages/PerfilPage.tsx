import React, { useState, useEffect, useCallback } from 'react';
import { formatHorarioList, formatHorarioSummary } from '../utils/horarioUtils';
import './PerfilPage.css';
import { useNotifications } from '../hooks/useNotifications';

interface UserData {
  id_usuario: string;
  nombre: string;
  email: string;
  id_ferreteria: string;
  ferreteria_razon_social: string;
}

interface FerreteriaData {
  id_ferreteria: string;
  rut: string;
  razon_social: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  api_key: string;
  descripcion?: string;
  horario?: any;
}

type HorarioState = { [key: string]: { apertura: string; cierre: string } };

const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const createEmptyHorario = (): HorarioState =>
  diasSemana.reduce((acc, dia) => {
    acc[dia] = { apertura: '', cierre: '' };
    return acc;
  }, {} as HorarioState);

const PerfilPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [ferreteriaData, setFerreteriaData] = useState<FerreteriaData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [isEditingFerreteria, setIsEditingFerreteria] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<Partial<UserData>>({});
  const [editedFerreteria, setEditedFerreteria] = useState<Partial<FerreteriaData>>({});
  const [editedHorario, setEditedHorario] = useState<HorarioState>(() => createEmptyHorario());
  const [stats, setStats] = useState({ totalProducts: 0, lowStockProducts: 0, activeOrders: 0 });
  const { addNotification } = useNotifications();

  const API_URL = 'http://localhost:5000/api';

  const normalizeHorario = useCallback((horario: any): HorarioState => {
    const base = createEmptyHorario();
    if (!horario) {
      return base;
    }

    let parsed = horario;
    if (typeof horario === 'string') {
      try {
        parsed = JSON.parse(horario);
      } catch (err) {
        return base;
      }
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return base;
    }

    diasSemana.forEach((dia) => {
      const value = parsed[dia];
      if (!value) return;
      if (typeof value === 'string') {
        const [apertura = '', cierre = ''] = value.split('-');
        base[dia] = { apertura, cierre };
      } else if (typeof value === 'object') {
        base[dia] = {
          apertura: value.apertura ?? '',
          cierre: value.cierre ?? '',
        };
      }
    });

    return base;
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/productos`, { headers }),
        fetch(`${API_URL}/pedidos`, { headers }),
      ]);

      let totalProducts = 0;
      let lowStockProducts = 0;
      if (productsRes.ok) {
        const products = (await productsRes.json()) as any[];
        totalProducts = products.length;
        lowStockProducts = products.filter((p) => Number(p?.stock) <= 5).length;
      } else if (productsRes.status === 401 || productsRes.status === 403) {
        addNotification('Debes iniciar sesión nuevamente para cargar los productos.', 'error');
      }

      let activeOrders = 0;
      if (ordersRes.ok) {
        const orders = (await ordersRes.json()) as any[];
        activeOrders = orders.filter((pedido) => {
          const estado = String(pedido?.estado || '').toLowerCase();
          return estado && estado !== 'completado' && estado !== 'cancelado';
        }).length;
      }

      setStats({ totalProducts, lowStockProducts, activeOrders });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      addNotification('No se pudieron cargar las estadísticas de la ferretería.', 'error');
    }
  }, [API_URL, addNotification]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token || !storedUser) {
        addNotification('No se encontró información de sesión. Por favor, inicia sesión.', 'error');
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser: UserData = JSON.parse(storedUser);
        setUserData(parsedUser);
        setEditedUser({ nombre: parsedUser.nombre, email: parsedUser.email });

        // Asumiendo que la ferretería asociada ya está disponible o se puede obtener
        // Aquí podríamos hacer una llamada al backend si la información completa de la ferretería no está en el token/localStorage
        // Por ahora, si solo tenemos razon_social en localStorage, simulamos la carga completa
        if (parsedUser.id_ferreteria) {
          const ferreteriaResponse = await fetch(`${API_URL}/ferreterias/${parsedUser.id_ferreteria}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (ferreteriaResponse.ok) {
            const ferreteriaDetails: FerreteriaData = await ferreteriaResponse.json();
            setFerreteriaData(ferreteriaDetails);
            setEditedFerreteria(ferreteriaDetails);
            setEditedHorario(normalizeHorario(ferreteriaDetails.horario));
            await fetchStats(token);
          } else {
            addNotification('Error al cargar los datos de la ferretería.', 'error');
          }
        }

      } catch (error) {
        console.error('Error al parsear datos de usuario:', error);
        addNotification('Error al cargar los datos de perfil.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [API_URL, addNotification, fetchStats, normalizeHorario]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleFerreteriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedFerreteria(prev => ({ ...prev, [name]: value }));
  };

  const handleHorarioChange = (dia: string, field: 'apertura' | 'cierre', value: string) => {
    setEditedHorario(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [field]: value,
      },
    }));
  };

  const handleFerreteriaTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedFerreteria(prev => ({ ...prev, [name]: value }));
  };

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    if (token) {
      return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    return {};
  };

  const handleSaveUser = async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userData.id_usuario}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editedUser),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      setUserData(prev => prev ? { ...prev, ...data } : null);
      localStorage.setItem('user', JSON.stringify({ ...userData, ...data })); // Actualizar localStorage
      addNotification('Usuario actualizado exitosamente.', 'success');
      setIsEditingUser(false);
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      addNotification(`Error al actualizar usuario: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFerreteria = async () => {
    if (!ferreteriaData) return;
    setIsLoading(true);
    try {
      const payload: any = { ...editedFerreteria };
      const horarioPayload: Record<string, string> = diasSemana.reduce((acc, dia) => {
        const { apertura, cierre } = editedHorario[dia] || { apertura: '', cierre: '' };
        if (apertura && cierre) {
          acc[dia] = `${apertura}-${cierre}`;
        }
        return acc;
      }, {} as Record<string, string>);
      payload.horario = Object.keys(horarioPayload).length > 0 ? horarioPayload : null;

      const response = await fetch(`${API_URL}/ferreterias/${ferreteriaData.id_ferreteria}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar ferretería');
      }

      const updated = Array.isArray(data) ? data[0] : data;
      setFerreteriaData(prev => prev ? { ...prev, ...updated } : updated);
      setEditedFerreteria(updated);
      setEditedHorario(normalizeHorario(updated?.horario));
      const token = localStorage.getItem('token');
      if (token) {
        await fetchStats(token);
      }
      addNotification('Ferretería actualizada exitosamente.', 'success');
      setIsEditingFerreteria(false);
    } catch (error: any) {
      console.error('Error al guardar ferretería:', error);
      addNotification(`Error al actualizar ferretería: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="perfil-page">Cargando perfil...</div>;
  }

  if (!userData) {
    return <div className="perfil-page error">No se pudo cargar la información del usuario.</div>;
  }

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <h2>Mi Perfil</h2>
      </div>

      <div className="perfil-content">
        {/* Sección de Información Personal */}
        <div className="perfil-card personal-info">
          <div className="card-header">
            <h3>Información Personal</h3>
            {!isEditingUser && (
              <button onClick={() => setIsEditingUser(true)} className="edit-button">Editar</button>
            )}
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Nombre:</label>
              {isEditingUser ? (
                <input type="text" name="nombre" value={editedUser.nombre || ''} onChange={handleUserChange} />
              ) : (
                <span>{userData.nombre}</span>
              )}
            </div>
            <div className="form-group">
              <label>Email:</label>
              {isEditingUser ? (
                <input type="email" name="email" value={editedUser.email || ''} onChange={handleUserChange} />
              ) : (
                <span>{userData.email}</span>
              )}
            </div>
            {isEditingUser && (
              <div className="edit-actions">
                <button onClick={handleSaveUser} className="button-primary">Guardar</button>
                <button onClick={() => {
                  setIsEditingUser(false);
                  setEditedUser({ nombre: userData.nombre, email: userData.email });
                }} className="button-secondary">Cancelar</button>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Información de la Ferretería */}
        {ferreteriaData ? (
          <div className="perfil-card ferreteria-info">
            <div className="card-header">
              <h3>Información de la Ferretería</h3>
              {!isEditingFerreteria && (
                <button
                  onClick={() => {
                    if (ferreteriaData) {
                      setEditedFerreteria(ferreteriaData);
                      setEditedHorario(normalizeHorario(ferreteriaData.horario));
                    }
                    setIsEditingFerreteria(true);
                  }}
                  className="edit-button"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Razón Social:</label>
                {isEditingFerreteria ? (
                  <input type="text" name="razon_social" value={editedFerreteria.razon_social || ''} onChange={handleFerreteriaChange} />
                ) : (
                  <span>{ferreteriaData.razon_social}</span>
                )}
              </div>
              <div className="form-group">
                <label>RUT:</label>
                {isEditingFerreteria ? (
                  <input type="text" name="rut" value={editedFerreteria.rut || ''} onChange={handleFerreteriaChange} />
                ) : (
                  <span>{ferreteriaData.rut}</span>
                )}
              </div>
              <div className="form-group">
                <label>Dirección:</label>
                {isEditingFerreteria ? (
                  <input type="text" name="direccion" value={editedFerreteria.direccion || ''} onChange={handleFerreteriaChange} />
                ) : (
                  <span>{ferreteriaData.direccion}</span>
                )}
              </div>
              <div className="form-group">
                <label>Teléfono:</label>
                {isEditingFerreteria ? (
                  <input type="text" name="telefono" value={editedFerreteria.telefono || ''} onChange={handleFerreteriaChange} />
                ) : (
                  <span>{ferreteriaData.telefono || 'N/A'}</span>
                )}
              </div>
              <div className="form-group">
                <label>API Key:</label>
                {isEditingFerreteria ? (
                  <input type="text" name="api_key" value={editedFerreteria.api_key || ''} onChange={handleFerreteriaChange} />
                ) : (
                  <span>{ferreteriaData.api_key}</span>
                )}
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                {isEditingFerreteria ? (
                  <textarea name="descripcion" value={editedFerreteria.descripcion as string || ''} onChange={handleFerreteriaTextAreaChange} rows={3} />
                ) : (
                  <span>{ferreteriaData.descripcion || 'N/A'}</span>
                )}
              </div>
              <div className="form-group">
                <label>Horario:</label>
                {isEditingFerreteria ? (
                  <div className="horario-grid">
                    {diasSemana.map((dia) => (
                      <div className="horario-item" key={dia}>
                        <div className="horario-day">{dia.charAt(0).toUpperCase() + dia.slice(1)}</div>
                        <div className="horario-inputs">
                          <div className="horario-input">
                            <span>Apertura</span>
                            <input
                              type="time"
                              value={editedHorario[dia]?.apertura || ''}
                              onChange={(e) => handleHorarioChange(dia, 'apertura', e.target.value)}
                            />
                          </div>
                          <div className="horario-input">
                            <span>Cierre</span>
                            <input
                              type="time"
                              value={editedHorario[dia]?.cierre || ''}
                              onChange={(e) => handleHorarioChange(dia, 'cierre', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <span>{formatHorarioSummary(ferreteriaData.horario)}</span>
                    <ul className="horario-list">
                      {formatHorarioList(ferreteriaData.horario).map(item => (
                        <li key={item.day}><strong>{item.day}:</strong> {item.time}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {isEditingFerreteria && (
                <div className="edit-actions">
                  <button onClick={handleSaveFerreteria} className="button-primary">Guardar</button>
                  <button onClick={() => {
                    setIsEditingFerreteria(false);
                    if (ferreteriaData) {
                      setEditedFerreteria(ferreteriaData);
                      setEditedHorario(normalizeHorario(ferreteriaData.horario));
                    }
                  }} className="button-secondary">Cancelar</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="perfil-card ferreteria-info">
            <div className="card-header">
              <h3>Información de la Ferretería</h3>
            </div>
            <div className="card-body">
              <p>No se encontró información de la ferretería asociada.</p>
            </div>
          </div>
        )}

        {/* Sección de Estadísticas/Resumen (Ejemplo de widgets) */}
        <div className="perfil-card stats-summary">
          <div className="card-header">
            <h3>Resumen de la Ferretería</h3>
          </div>
          <div className="card-body">
            <div className="stat-item">
              <span>Total de Productos:</span> <strong>{stats.totalProducts}</strong>
            </div>
            <div className="stat-item">
              <span>Productos en Stock Bajo:</span> <strong className="text-error">{stats.lowStockProducts}</strong>
            </div>
            <div className="stat-item">
              <span>Pedidos Activos:</span> <strong>{stats.activeOrders}</strong>
            </div>
            {/* Puedes añadir más estadísticas aquí */}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerfilPage;
