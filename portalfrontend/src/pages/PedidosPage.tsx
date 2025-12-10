import React, { useEffect, useState } from 'react';
import './PedidosPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface PedidoDetalle {
  id_detalle_pedido: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
  precio_unitario_compra?: number;
  precio_unitario_venta?: number;
}

interface Pedido {
  id_pedido: string;
  id_ferreteria: string;
  fecha_pedido: string;
  estado: string;
  monto_total: number;
  id_cliente?: string;
  gateway?: string;
  gateway_ref?: string;
  paid_at?: string | null;
  detalle_pedido?: PedidoDetalle[];
}

const API_URL = 'http://localhost:5000/api';

const PedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [pedidoToDelete, setPedidoToDelete] = useState<string | null>(null);

  const { addNotification } = useNotifications();

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const confirmDeletePedido = async () => {
    if (!pedidoToDelete) return;
    try {
      const res = await fetch(`${API_URL}/pedidos/${pedidoToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('No se pudo eliminar el pedido');
      }
      setPedidos((prev) => prev.filter((p) => p.id_pedido !== pedidoToDelete));
      addNotification('Pedido eliminado', 'success');
    } catch (err: any) {
      console.error('Error deleting pedido:', err);
      addNotification(err.message || 'Error al eliminar el pedido', 'error');
    } finally {
      setPedidoToDelete(null);
    }
  };

  const fetchPedidos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/pedidos`, { headers: getAuthHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          addNotification('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.', 'error');
        } else {
          addNotification(`Error al cargar pedidos: ${res.statusText || res.status}`, 'error');
        }
        setPedidos([]);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching pedidos:', err);
      addNotification('Error de red al cargar pedidos.', 'error');
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id: string) => setExpandedPedido(prev => (prev === id ? null : id));

  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleString() : '-';

  return (
    <div className="pedidos-page">
      <h2>Pedidos</h2>

      {isLoading ? (
        <div>Cargando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div>No hay pedidos para mostrar</div>
      ) : (
        <div className="pedidos-table-container">
          <table className="pedidos-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Monto total</th>
                <th>Cliente</th>
                <th>Gateway</th>
                <th>Paid At</th>
                <th>Detalles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <React.Fragment key={p.id_pedido}>
                  <tr className="pedido-row">
                    <td>{p.id_pedido}</td>
                    <td>{formatDate(p.fecha_pedido)}</td>
                    <td>{p.estado}</td>
                    <td>${p.monto_total.toFixed(0)}</td>
                    <td>{p.id_cliente || '-'}</td>
                    <td>{p.gateway ? `${p.gateway} (${p.gateway_ref || ''})` : '-'}</td>
                    <td>{formatDate(p.paid_at || undefined)}</td>
                    <td>
                      {p.detalle_pedido && p.detalle_pedido.length > 0 ? (
                        <button className="btn-small" onClick={() => toggleExpand(p.id_pedido)}>
                          {expandedPedido === p.id_pedido ? 'Ocultar' : `Ver (${p.detalle_pedido.length})`}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-button delete-button"
                          onClick={() => setPedidoToDelete(p.id_pedido)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedPedido === p.id_pedido && (
                    <tr className="pedido-details-row">
                      <td colSpan={9}>
                        <div className="pedido-details">
                          <table className="detalle-table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio unit. venta</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.detalle_pedido && p.detalle_pedido.map((d) => (
                                <tr key={d.id_detalle_pedido}>
                                  <td>{d.id_producto}</td>
                                  <td>{d.cantidad}</td>
                                  <td>${(d.precio_unitario_venta ?? 0).toFixed(0)}</td>
                                  <td>${((d.precio_unitario_venta ?? 0) * d.cantidad).toFixed(0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmationModal
        isOpen={Boolean(pedidoToDelete)}
        onClose={() => setPedidoToDelete(null)}
        onConfirm={confirmDeletePedido}
        title="Eliminar pedido"
        message="¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default PedidosPage;
