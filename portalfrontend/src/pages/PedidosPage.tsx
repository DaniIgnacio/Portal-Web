import React, { useEffect, useState } from 'react';
import './PedidosPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface PedidoDetalle {
  id_detalle_pedido: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [pedidoToDelete, setPedidoToDelete] = useState<string | null>(null);

  const { addNotification } = useNotifications();

  /* =========================
     HEADERS AUTH
  ========================= */
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* =========================
     CARGAR PEDIDOS
  ========================= */
  const fetchPedidos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/pedidos`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Error al cargar pedidos');

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      addNotification(error.message, 'error');
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  /* =========================
     CAMBIO DE ESTADO
  ========================= */
  const actualizarEstadoPedido = async (
    idPedido: string,
    nuevoEstado: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/pedidos/${idPedido}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }

      addNotification('Estado del pedido actualizado', 'success');

      // 🔥 CLAVE: volver a cargar desde BD
      await fetchPedidos();

    } catch (error: any) {
      console.error('ERROR CAMBIO ESTADO:', error);
      addNotification(error.message, 'error');
    }
  };

  /* =========================
     ELIMINAR PEDIDO
  ========================= */
  const confirmDeletePedido = async () => {
    if (!pedidoToDelete) return;

    try {
      const res = await fetch(`${API_URL}/pedidos/${pedidoToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('No se pudo eliminar el pedido');

      addNotification('Pedido eliminado', 'success');
      await fetchPedidos();
    } catch (error: any) {
      console.error(error);
      addNotification(error.message, 'error');
    } finally {
      setPedidoToDelete(null);
    }
  };

  const toggleExpand = (id: string) =>
    setExpandedPedido((prev) => (prev === id ? null : id));

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : '-';

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="pedidos-page">
      <h2>Gestión de Pedidos</h2>

      {isLoading ? (
        <div>Cargando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div>No hay pedidos registrados</div>
      ) : (
        <div className="pedidos-table-container">
          <table className="pedidos-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Cliente</th>
                <th>Pago</th>
                <th>Detalles</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((p) => {
                const estado = p.estado?.toLowerCase().trim();

                return (
                  <React.Fragment key={p.id_pedido}>
                    <tr>
                      <td>{p.id_pedido}</td>
                      <td>{formatDate(p.fecha_pedido)}</td>
                      <td>{estado}</td>
                      <td>${p.monto_total.toFixed(0)}</td>
                      <td>{p.id_cliente ?? '-'}</td>
                      <td>
                        {p.gateway
                          ? `${p.gateway} (${p.gateway_ref ?? ''})`
                          : '-'}
                      </td>
                      <td>
                        {p.detalle_pedido?.length ? (
                          <button
                            className="btn-small"
                            onClick={() => toggleExpand(p.id_pedido)}
                          >
                            {expandedPedido === p.id_pedido
                              ? 'Ocultar'
                              : `Ver (${p.detalle_pedido.length})`}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {estado === 'pagado' && (
                            <button
                              onClick={() =>
                                actualizarEstadoPedido(
                                  p.id_pedido,
                                  'preparando'
                                )
                              }
                            >
                              Confirmar pedido
                            </button>
                          )}

                          {estado === 'preparando' && (
                            <button
                              onClick={() =>
                                actualizarEstadoPedido(
                                  p.id_pedido,
                                  'listo_retiro'
                                )
                              }
                            >
                              Marcar listo para retiro
                            </button>
                          )}

                          {estado === 'listo_retiro' && (
                            <button
                              onClick={() =>
                                actualizarEstadoPedido(
                                  p.id_pedido,
                                  'retirado'
                                )
                              }
                            >
                              Confirmar retiro
                            </button>
                          )}

                          <button
                            className="delete-button"
                            onClick={() => setPedidoToDelete(p.id_pedido)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedPedido === p.id_pedido && (
                      <tr>
                        <td colSpan={8}>
                          <table className="detalle-table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio unit.</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.detalle_pedido?.map((d) => (
                                <tr key={d.id_detalle_pedido}>
                                  <td>{d.id_producto}</td>
                                  <td>{d.cantidad}</td>
                                  <td>
                                    ${d.precio_unitario_venta?.toFixed(0)}
                                  </td>
                                  <td>
                                    $
                                    {(
                                      (d.precio_unitario_venta ?? 0) *
                                      d.cantidad
                                    ).toFixed(0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
