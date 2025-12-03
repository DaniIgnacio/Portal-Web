import React, { useEffect, useState } from 'react';
import './ClientesPage.css';
import { useNotifications } from '../hooks/useNotifications';

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

const API_URL = 'http://localhost:5000/api';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteListado[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addNotification } = useNotifications();

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

  return (
    <div className="clientes-page">
      <h2>Clientes</h2>
      {isLoading ? (
        <div>Cargando clientes...</div>
      ) : clientes.length === 0 ? (
        <div>No hay clientes para mostrar</div>
      ) : (
        <div className="clientes-table-container">
          <table className="clientes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Auth User ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>RUT</th>
                <th>Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id_cliente}>
                  <td>{c.id_cliente}</td>
                  <td>{c.auth_user_id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.email}</td>
                  <td>{c.telefono}</td>
                  <td>{c.rut}</td>
                  <td>{new Date(c.fecha_registro).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientesPage;
