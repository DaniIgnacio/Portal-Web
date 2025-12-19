import React, { useEffect, useMemo, useState } from 'react';
import './ClientesPage.css';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

interface Cliente {
  id_cliente: string;
  auth_user_id: string;
  nombre: string;
  email: string;
  telefono: string;
  rut: string;
  direccion: string;
  fecha_registro: string;
  tipo_combustible: string;
  rendimiento_km_l: number;
  latitud?: number;
  longitud?: number;
}

type ClienteListado = Pick<
  Cliente,
  'id_cliente' | 'auth_user_id' | 'nombre' | 'email' | 'telefono' | 'rut' | 'fecha_registro'
>;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

 
const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteListado[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const { notifications, addNotification, dismissNotification } = useNotifications();

  useEffect(() => {
    const fetchClientes = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/clientes`, { headers });

        if (res.status === 401) {
          addNotification('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
          setClientes([]);
          setIsLoading(false);
          return;
        }

        if (res.status === 403) {
          addNotification('No tienes permisos para ver el listado de clientes.', 'error');
          setClientes([]);
          setIsLoading(false);
          return;
        }

        if (!res.ok) {
          const serverMessage = await res.text();
          addNotification(serverMessage || 'Error al cargar clientes', 'error');
          setClientes([]);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        console.log('Respuesta clientes', data);
        if (!Array.isArray(data)) {
          setClientes([]);
          setIsLoading(false);
          return;
        }

        const sanitizados: ClienteListado[] = data.map(
          ({ id_cliente, auth_user_id, nombre, email, telefono, rut, fecha_registro }: Cliente) => ({
            id_cliente,
            auth_user_id,
            nombre,
            email,
            telefono,
            rut,
            fecha_registro,
          })
        );

        setClientes(sanitizados);
      } catch (err) {
        addNotification('Error de red al cargar clientes', 'error');
        setClientes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientes();
  }, [addNotification]);

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return clientes;
    const term = search.toLowerCase();
    return clientes.filter((cliente) => {
      const values = [
        cliente.nombre,
        cliente.email,
        cliente.telefono,
        cliente.rut,
        cliente.auth_user_id,
      ];
      return values.some((value) => value?.toLowerCase().includes(term));
    });
  }, [clientes, search]);

  const totalClientes = clientes.length;

  const clientesRecientes = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return clientes.filter((cliente) => new Date(cliente.fecha_registro) >= cutoff).length;
  }, [clientes]);

  const ultimaFechaRegistro = useMemo(() => {
    if (!clientes.length) return null;
    const latest = clientes.reduce((latestDate, cliente) => {
      const current = new Date(cliente.fecha_registro).getTime();
      return current > latestDate ? current : latestDate;
    }, 0);
    return new Date(latest);
  }, [clientes]);

  const renderSkeleton = () => (
    <div className="clientes-page">
      <section className="clientes-hero clientes-hero--loading">
        <div className="hero-content">
          <div className="skeleton skeleton-badge" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
          <div className="hero-metrics loading">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton hero-metric-skeleton" />
            ))}
          </div>
        </div>
      </section>
      <section className="clientes-content">
        <div className="clientes-card">
          <div className="clientes-card-header loading">
            <div className="skeleton skeleton-title small" />
            <div className="skeleton skeleton-chip" />
          </div>
          <div className="skeleton skeleton-bar large" />
          <div className="skeleton-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton skeleton-item" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderEmptyState = () => (
    <div className="clientes-empty-state">
      <div className="empty-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4Z"
          />
        </svg>
      </div>
      <h3>No hay clientes registrados</h3>
      <p>Cuando se registren nuevos usuarios desde la app móvil, aparecerán automáticamente aquí.</p>
    </div>
  );

  if (isLoading) {
    return renderSkeleton();
  }

  return (
    <div className="clientes-page">
      <section className="clientes-hero">
        <div className="hero-content">
          <span className="hero-badge">Usuarios móviles</span>
          <h1>Panel de clientes</h1>
          <p>
            Supervisa a los clientes registrados desde la aplicación móvil, gestiona su información de contacto
            y mantén el control de la base de usuarios.
          </p>

          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-label">Total clientes</span>
              <span className="metric-value">{totalClientes}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Nuevos últimos 30 días</span>
              <span className="metric-value">{clientesRecientes}</span>
            </div>
            <div className="metric-card metric-card--soft">
              <span className="metric-label">Último registro</span>
              <span className="metric-value">
                {ultimaFechaRegistro ? ultimaFechaRegistro.toLocaleDateString('es-CL') : 'N/D'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="clientes-content">
        <div className="clientes-card">
          <div className="clientes-card-header">
            <div>
              <h2>Listado de clientes</h2>
              <p>Filtra por nombre, email, RUT o certificado de autenticación para encontrar usuarios específicos.</p>
            </div>
            <div className="result-chip">
              <span className="chip-label">Mostrando</span>
              <span className="chip-value">{filteredClientes.length}</span>
            </div>
          </div>

          <div className="clientes-toolbar">
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar clientes…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {filteredClientes.length > 0 ? (
            <div className="clientes-table-card">
              <div className="table-scroll">
                <table className="clientes-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Auth User ID</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>RUT</th>
                      <th>Fecha registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cliente) => (
                      <tr key={cliente.id_cliente}>
                        <td data-label="ID">
                          <span className="cell-title">{cliente.id_cliente}</span>
                          <span className="cell-subtitle">Auth: {cliente.auth_user_id}</span>
                        </td>
                        <td data-label="Auth User ID" className="mono-cell">
                          {cliente.auth_user_id}
                        </td>
                        <td data-label="Nombre">
                          <span className="cell-title">{cliente.nombre}</span>
                          <span className="cell-subtitle">{cliente.email}</span>
                        </td>
                        <td data-label="Email" className="mono-cell">
                          {cliente.email}
                        </td>
                        <td data-label="Teléfono">
                          <span className="tag tag--neutral">{cliente.telefono || 'S/D'}</span>
                        </td>
                        <td data-label="RUT">
                          <span className="tag tag--accent">{cliente.rut || 'S/D'}</span>
                        </td>
                        <td data-label="Fecha registro">
                          {new Date(cliente.fecha_registro).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>
      </section>

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ClientesPage;
