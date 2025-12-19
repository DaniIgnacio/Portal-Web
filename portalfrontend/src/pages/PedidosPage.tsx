import React, { useEffect, useState, useRef } from 'react';
import './PedidosPage.css'; // Asegúrate de importar el CSS aquí

interface PedidoDetalle {
  id_detalle_pedido: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
  precio_unitario_venta?: number;
  nombre_producto?: string;
  stock_disponible?: number;
}

interface Pedido {
  id_pedido: string;
  id_ferreteria: string;
  fecha_pedido: string;
  estado: string;
  monto_total: number;
  id_cliente?: string;
  nombre_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  gateway?: string;
  gateway_ref?: string;
  paid_at?: string | null;
  detalle_pedido?: PedidoDetalle[];
}

const API_URL = 'http://localhost:5000/api';

const PedidosMejorado: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [ticketPedido, setTicketPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  };

  const fetchPedidos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/pedidos`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 403 || res.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        return;
      }

      if (!res.ok) throw new Error('Error al cargar pedidos');

      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Error al cargar pedidos');
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const actualizarEstadoPedido = async (
    idPedido: string,
    nuevoEstado: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/pedidos/${idPedido}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.status === 403 || res.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }

      await fetchPedidos();
    } catch (error: any) {
      console.error('ERROR CAMBIO ESTADO:', error);
      alert(error.message);
    }
  };

  const imprimirTicket = () => {
    if (ticketRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket - Pedido ${ticketPedido?.id_pedido}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', monospace; padding: 20px; }
                .ticket { max-width: 400px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
                h1 { font-size: 20px; text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                .header { margin-bottom: 15px; }
                .info-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                .label { font-weight: bold; }
                .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #000; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
                th, td { padding: 5px; text-align: left; border-bottom: 1px dotted #999; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .total-row { font-size: 16px; font-weight: bold; text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #000; }
                .footer { margin-top: 20px; text-align: center; font-size: 11px; border-top: 2px dashed #000; padding-top: 15px; }
                @media print {
                  body { padding: 0; }
                  .ticket { border: none; }
                }
              </style>
            </head>
            <body>
              ${ticketRef.current.innerHTML}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 250);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const toggleExpand = (id: string) =>
    setExpandedPedido((prev) => (prev === id ? null : id));

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const date = new Date(iso);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper para clases CSS del badge
  const getBadgeClass = (estado: string) => {
    const estadoLower = estado?.toLowerCase().trim();
    if (estadoLower === 'pagado') return 'status-badge pagado'; // Azul
    if (estadoLower === 'preparando') return 'status-badge preparando'; // Naranja
    if (estadoLower === 'listo_retiro') return 'status-badge listo'; // Verde (puedes agregar CSS si quieres)
    return 'status-badge'; // Default gris
  };

  // Botón de acción principal según estado
  const renderAccionBoton = (pedido: Pedido) => {
    const estado = pedido.estado?.toLowerCase().trim();
    
    let label = '';
    let nuevoEstado = '';
    let btnClass = '';

    if (estado === 'pagado') {
        label = 'Empezar a Preparar';
        nuevoEstado = 'preparando';
        btnClass = 'btn-card btn-blue';
    } else if (estado === 'preparando') {
        label = 'Marcar Listo';
        nuevoEstado = 'listo_retiro';
        btnClass = 'btn-card btn-green';
    } else if (estado === 'listo_retiro') {
        label = 'Confirmar Retiro';
        nuevoEstado = 'retirado';
        btnClass = 'btn-card'; // Default gris o añade uno específico
    } else {
        return null; // Sin acción para 'retirado'
    }

    return (
      <button
        className={btnClass}
        onClick={() => actualizarEstadoPedido(pedido.id_pedido, nuevoEstado)}
      >
        {label}
      </button>
    );
  };

  // Renderizado de tarjeta individual
  const renderPedidoCard = (pedido: Pedido) => (
    <div key={pedido.id_pedido} className="pedido-card">
      {/* Header: ID y Estado */}
      <div className="card-header">
        <span className="order-id">#{pedido.id_pedido.slice(0, 8)}</span>
        <span className={getBadgeClass(pedido.estado)}>
           {pedido.estado}
        </span>
      </div>

      {/* Info: Fecha y Precio */}
      <div className="card-info-row">
        <span className="order-date">
            📅 {formatDate(pedido.fecha_pedido)}
        </span>
        <span className="order-price">
            ${pedido.monto_total.toLocaleString('es-CL')}
        </span>
      </div>

      {/* Cliente */}
      <div className="client-info">
        👤 {pedido.nombre_cliente || 'Cliente sin nombre'}
      </div>

      {/* Productos (Expandible) */}
      {pedido.detalle_pedido && pedido.detalle_pedido.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => toggleExpand(pedido.id_pedido)}
            className="toggle-products"
          >
            {expandedPedido === pedido.id_pedido ? '▼' : '▶'} Ver Productos ({pedido.detalle_pedido.length})
          </button>

          {expandedPedido === pedido.id_pedido && (
            <div style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px', marginTop: '8px', fontSize: '0.85rem' }}>
              {pedido.detalle_pedido.map((detalle) => (
                <div key={detalle.id_detalle_pedido} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px dashed #eee', paddingBottom: '2px' }}>
                  <span>{detalle.cantidad}x {detalle.nombre_producto || detalle.id_producto}</span>
                  {detalle.stock_disponible !== undefined && (
                     <span style={{ color: detalle.stock_disponible < detalle.cantidad ? 'red' : 'green', fontSize: '0.75rem' }}>
                        (Stock: {detalle.stock_disponible})
                     </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="card-actions">
        {renderAccionBoton(pedido)}
        <button
          className="btn-card btn-ticket"
          onClick={() => setTicketPedido(pedido)}
        >
          🖨 Ticket
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="pedidos-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>⏳ Cargando tablero...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pedidos-page">
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '16px', color: '#991b1b' }}>
          <strong>❌ Error:</strong> {error}
        </div>
      </div>
    );
  }

  // Filtrar pedidos por estado para las columnas
  const pedidosNuevos = pedidos.filter(p => p.estado?.toLowerCase() === 'pagado');
  const pedidosProceso = pedidos.filter(p => p.estado?.toLowerCase() === 'preparando');
  const pedidosFinalizados = pedidos.filter(p => ['listo_retiro', 'retirado'].includes(p.estado?.toLowerCase()));

  return (
    <div className="pedidos-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
          Tablero de Control
        </h1>
      </div>

      <div className="kanban-container">
          
          {/* Columna 1: Por Preparar (Nuevos/Pagados) */}
          <div className="kanban-column">
            <div className="column-header" style={{ borderBottomColor: '#3B82F6' }}>
              <h3>📋 Por Preparar</h3>
              <span className="column-count" style={{ backgroundColor: '#3B82F6' }}>{pedidosNuevos.length}</span>
            </div>
            {pedidosNuevos.map(renderPedidoCard)}
            {pedidosNuevos.length === 0 && <p style={{textAlign:'center', color:'#aaa', marginTop:'20px'}}>Sin pedidos pendientes</p>}
          </div>

          {/* Columna 2: En Preparación */}
          <div className="kanban-column">
            <div className="column-header" style={{ borderBottomColor: '#F59E0B' }}>
              <h3>⚙️ En Preparación</h3>
              <span className="column-count" style={{ backgroundColor: '#F59E0B' }}>{pedidosProceso.length}</span>
            </div>
            {pedidosProceso.map(renderPedidoCard)}
            {pedidosProceso.length === 0 && <p style={{textAlign:'center', color:'#aaa', marginTop:'20px'}}>Nada en cocina</p>}
          </div>

          {/* Columna 3: Listos / Historial */}
          <div className="kanban-column">
            <div className="column-header" style={{ borderBottomColor: '#10B981' }}>
              <h3>✅ Listos / Retirados</h3>
              <span className="column-count" style={{ backgroundColor: '#10B981' }}>{pedidosFinalizados.length}</span>
            </div>
            {pedidosFinalizados.map(renderPedidoCard)}
            {pedidosFinalizados.length === 0 && <p style={{textAlign:'center', color:'#aaa', marginTop:'20px'}}>Historial vacío</p>}
          </div>

      </div>

      {/* Modal de Ticket (Mantenido igual, solo ajuste de z-index si es necesario) */}
      {ticketPedido && (
        <div style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
             {/* ... Contenido del modal se mantiene igual ... */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Vista Previa Ticket</h2>
                <button onClick={() => setTicketPedido(null)} style={{ border:'none', background:'none', fontSize:'20px', cursor:'pointer' }}>✕</button>
              </div>

              <div ref={ticketRef} style={{ border: '1px solid #ddd', padding: '15px', background: 'white' }}>
                <div className="ticket">
                  <h1 style={{fontSize:'18px', textAlign:'center', borderBottom:'1px dashed #000', paddingBottom:'10px'}}>TICKET DE PEDIDO</h1>
                  <div className="header" style={{marginTop:'10px', fontSize:'12px'}}>
                    <div><strong>Pedido #:</strong> {ticketPedido.id_pedido}</div>
                    <div><strong>Fecha:</strong> {formatDate(ticketPedido.fecha_pedido)}</div>
                    <div><strong>Cliente:</strong> {ticketPedido.nombre_cliente || 'Anónimo'}</div>
                  </div>
                  <div style={{marginTop:'15px', borderTop:'1px solid #000', paddingTop:'5px'}}>
                    <table style={{width:'100%', fontSize:'12px'}}>
                        <thead>
                            <tr style={{textAlign:'left'}}><th>Prod</th><th>Cant</th><th style={{textAlign:'right'}}>Total</th></tr>
                        </thead>
                        <tbody>
                        {ticketPedido.detalle_pedido?.map((d) => (
                            <tr key={d.id_detalle_pedido}>
                                <td>{d.nombre_producto || 'Prod'}</td>
                                <td>{d.cantidad}</td>
                                <td style={{textAlign:'right'}}>${((d.precio_unitario_venta ?? 0) * d.cantidad).toLocaleString('es-CL')}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  </div>
                  <div style={{textAlign:'right', fontSize:'16px', fontWeight:'bold', marginTop:'15px', borderTop:'2px solid #000', paddingTop:'10px'}}>
                    TOTAL: ${ticketPedido.monto_total.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button onClick={() => setTicketPedido(null)} className="btn-card" style={{background:'#e5e7eb'}}>Cerrar</button>
                <button onClick={imprimirTicket} className="btn-card btn-blue">🖨️ Imprimir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosMejorado;