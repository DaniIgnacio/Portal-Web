import React, { useEffect, useMemo, useState } from 'react';
import './AnalisisPage.css';
import { useNotifications } from '../hooks/useNotifications';

type Pedido = {
  id_pedido: string;
  fecha_pedido: string;
  estado: string;
  monto_total: number;
  id_ferreteria: string;
  gateway?: string;
  detalle_pedido?: Array<{
    id_detalle_pedido: string;
    id_producto: string;
    cantidad: number;
    precio_unitario_venta?: number;
    nombre:string;
  }>;
};

type Cotizacion = {
  id_cotizacion: string;
  estado: string;
  total_estimada?: number;
  created_at?: string;
};

type Producto = {
  id_producto: string;
  id_ferreteria?: string;
  nombre?: string;
  precio?: number;
  stock?: number;
};

// MODIFICADO: Ahora busca la variable de entorno primero.
// Si usas Next.js, asegúrate de tener NEXT_PUBLIC_API_URL en tu archivo .env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const safeDate = (value?: string) => {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
};

const currency = (n: number) => `$${n.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;

const AnalisisPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ventasRange, setVentasRange] = useState<'day' | 'week' | 'month'>('day');
  const [ventasChannel, setVentasChannel] = useState<'all' | string>('all');
  const { addNotification } = useNotifications();

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pedidosRes, cotRes, prodRes] = await Promise.all([
          fetch(`${API_URL}/pedidos`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/cotizaciones`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/productos`, { headers: getAuthHeaders() }),
        ]);
        
        if (pedidosRes.ok) {
          const data = await pedidosRes.json();
          console.log(
            'DETALLE REAL:',
            data?.[0]?.detalle_pedido?.[0]
          );
          setPedidos(Array.isArray(data) ? data : []);
        }
        

        if (cotRes.ok) {
          const data = await cotRes.json();
          setCotizaciones(Array.isArray(data) ? data : []);
        }
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProductos(Array.isArray(data) ? data : []);
        }

      } catch (error) {
        console.error('Error cargando datos para análisis', error);
        addNotification('No se pudieron cargar todos los datos de análisis.', 'error');
      } finally {
        setIsLoading(false);
      }
      
      
    };
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = useMemo(() => new Date(), []);

  const filtroPorRango = (items: Pedido[], dias: number) => {
    const limite = new Date(now);
    limite.setDate(limite.getDate() - dias);
    return items.filter((p) => safeDate(p.fecha_pedido) >= limite);
  };

  const filtroPorCanal = (items: Pedido[]) =>
    ventasChannel === 'all' ? items : items.filter((p) => (p.gateway || '').toLowerCase() === ventasChannel.toLowerCase());

  const sumaMontos = (items: Pedido[]) => items.reduce((acc, p) => acc + (p.monto_total || 0), 0);

  const ventasDia = useMemo(
    () => sumaMontos(filtroPorCanal(filtroPorRango(pedidos, 1))),
    [pedidos, ventasChannel]
  );
  const ventasSemana = useMemo(
    () => sumaMontos(filtroPorCanal(filtroPorRango(pedidos, 7))),
    [pedidos, ventasChannel]
  );
  const ventasMes = useMemo(
    () => sumaMontos(filtroPorCanal(filtroPorRango(pedidos, 30))),
    [pedidos, ventasChannel]
  );

  const ticketPromedio = (items: Pedido[]) =>
    items.length ? sumaMontos(items) / items.length : 0;

  const ticketHoy = useMemo(() => ticketPromedio(filtroPorRango(pedidos, 1)), [pedidos]);
  const ticketSemana = useMemo(() => ticketPromedio(filtroPorRango(pedidos, 7)), [pedidos]);
  const ticketMes = useMemo(() => ticketPromedio(filtroPorRango(pedidos, 30)), [pedidos]);

  const tasaConversion = useMemo(() => {
    if (!cotizaciones.length) return 0;
    const exitosas = cotizaciones.filter((c) => ['convertida', 'confirmada', 'compra'].includes(c.estado?.toLowerCase()));
    return (exitosas.length / cotizaciones.length) * 100;
  }, [cotizaciones]);

  const horasDemanda = useMemo(() => {
    const horas = new Array(24).fill(0);
    pedidos.forEach((p) => {
      const h = safeDate(p.fecha_pedido).getHours();
      horas[h] += 1;
    });
    const top = horas
      .map((v, i) => ({ h: i, v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .filter((i) => i.v > 0);
    return top;
  }, [pedidos]);


    const productosMasVendidos = useMemo(() => {
      const map = new Map<string, { qty: number; nombre: string }>();

      pedidos.forEach((p) => {
        p.detalle_pedido?.forEach((d) => {
          const id = String(d.id_producto);
          const prev = map.get(id);

          // Intentar obtener nombre del detalle o del array de productos
          let nombreProducto = (d.nombre || '').trim();
          if (!nombreProducto) {
            const producto = productos.find(prod => prod.id_producto === d.id_producto);
            nombreProducto = (producto?.nombre || '').trim();
          }
          
          // Si aún no hay nombre, usar ID truncado
          if (!nombreProducto) {
            nombreProducto = id.length > 30 ? `ID: ${id.substring(0, 30)}...` : `ID: ${id}`;
          }

          const prevName = (prev?.nombre || '').trim();

          map.set(id, {
            qty: (prev?.qty || 0) + d.cantidad,
            nombre: prevName || nombreProducto,
          });
        });
      });

      return Array.from(map.entries())
        .map(([id, v]) => ({
          id,
          qty: v.qty,
          nombre: v.nombre,
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
    }, [pedidos, productos]);



  // Índice de competitividad simulado
  const competitividad = useMemo(() => {
    return productos.slice(0, 6).map((prod) => {
      const precio = prod.precio ?? 0;
      const mercado = Math.max(1, precio * (0.9 + Math.random() * 0.2)); // +-10%
      const diff = mercado ? ((precio - mercado) / mercado) * 100 : 0;
      let tag: 'cheap' | 'fair' | 'expensive' = 'fair';
      if (diff <= -2) tag = 'cheap';
      else if (diff >= 2) tag = 'expensive';
      return {
        id: prod.id_producto,
        nombre: prod.nombre || 'Producto',
        precio,
        mercado: Math.round(mercado),
        diff,
        tag,
      };
    });
  }, [productos]);

  const competitividadResumen = useMemo(() => {
    const cheap = competitividad.filter((c) => c.tag === 'cheap').length;
    const fair = competitividad.filter((c) => c.tag === 'fair').length;
    const expensive = competitividad.filter((c) => c.tag === 'expensive').length;
    const avgDiff = competitividad.length
      ? competitividad.reduce((acc, c) => acc + c.diff, 0) / competitividad.length
      : 0;
    return { cheap, fair, expensive, avgDiff };
  }, [competitividad]);

  const tendenciasTicket = [
    { label: 'Hoy', valor: ticketHoy },
    { label: 'Semana', valor: ticketSemana },
    { label: 'Mes', valor: ticketMes },
  ];

  const cards = [
    { label: 'Ventas hoy', value: currency(ventasDia) },
    { label: 'Ventas 7d', value: currency(ventasSemana) },
    { label: 'Ventas 30d', value: currency(ventasMes) },
    { label: 'Ticket promedio (hoy)', value: currency(ticketHoy || 0) },
    { label: 'Conversión', value: `${tasaConversion.toFixed(1)}%` },
    { label: 'Pedidos activos', value: pedidos.length.toString() },
  ];

  const buildVentasSeries = (days: number) => {
    const series: { label: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const ref = new Date(now);
      ref.setDate(ref.getDate() - i);
      const dayStr = ref.toISOString().slice(0, 10);
      const total = filtroPorCanal(pedidos)
        .filter((p) => p.fecha_pedido?.startsWith(dayStr))
        .reduce((acc, p) => acc + (p.monto_total || 0), 0);
      const label = ref.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      series.push({ label, total });
    }
    return series;
  };

  const ventasSeries = useMemo(() => {
    if (ventasRange === 'day') return buildVentasSeries(1);
    if (ventasRange === 'week') return buildVentasSeries(7);
    return buildVentasSeries(30);
  }, [ventasRange, pedidos]);

  const ventasMax = useMemo(
    () => Math.max(...ventasSeries.map((s) => s.total), 1),
    [ventasSeries]
  );
  const STEP = 48;
  const BAR_WIDTH = 18;
  const MIN_CHART_WIDTH = 360;

  const chartWidth = Math.max(ventasSeries.length * STEP, MIN_CHART_WIDTH);
  console.log('AnalisisPage render');


  return (
    <div className="analisis-page">
      <div className="analisis-header">
        <div>
          <h2>Análisis</h2>
          <p>Dashboard de métricas y competitividad</p>
        </div>
        <div className="filter-row">
          <select
            value={ventasChannel}
            onChange={(e) => setVentasChannel(e.target.value || 'all')}
          >
            <option value="all">Todos los canales</option>
            <option value="web">Web</option>
            <option value="app">App</option>
            <option value="pos">POS</option>
          </select>
          <select
            value={ventasRange}
            onChange={(e) => setVentasRange(e.target.value as 'day' | 'week' | 'month')}
          >
            <option value="day">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Últimos 30 días</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Cargando análisis...</div>
      ) : (
        <>
          <section className="ventas-hero">
            <div className="ventas-hero__header">
              <div>
                <h3>Ventas</h3>
                <p className="muted">Total por día en el rango seleccionado</p>
              </div>
              <div className="ventas-hero__controls">
                <select
                  value={ventasChannel}
                  onChange={(e) => setVentasChannel(e.target.value || 'all')}
                >
                  <option value="all">Todos los canales</option>
                  <option value="web">Web</option>
                  <option value="app">App</option>
                  <option value="pos">POS</option>
                </select>
                <div className="toggle-group">
                  {(['day', 'week', 'month'] as const).map((opt) => (
                    <button
                      key={opt}
                      className={`toggle-btn ${ventasRange === opt ? 'is-active' : ''}`}
                      onClick={() => setVentasRange(opt)}
                    >
                      {opt === 'day' && 'Hoy'}
                      {opt === 'week' && '7D'}
                      {opt === 'month' && '30D'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ventas-hero__chart">
              {ventasSeries.length === 0 || ventasMax === 0 ? (
                <div className="chart-empty">Sin ventas en el rango seleccionado.</div>
              ) : (
                <>
                  <div   className={`chart-scroll ${
                      chartWidth <= MIN_CHART_WIDTH ? 'chart-center' : ''
                    }`}>
                    <svg
                      className="chart"
                      width={chartWidth}
                      height={220}
                      viewBox={`0 0 ${chartWidth} 220`}
                      preserveAspectRatio="xMinYMin meet"
                    >
                      {[0.25, 0.5, 0.75, 1].map((p) => (
                        <line
                          key={p}
                          x1={0}
                          x2={chartWidth}
                          y1={170 - 120 * p}
                          y2={170 - 120 * p}
                          className="chart-grid"
                        />
                      ))}

                      {ventasSeries.map((v, idx) => {
                        const height = ventasMax ? (v.total / ventasMax) * 120 : 0;
                        const barWidth = 18;

                        const x =
                          ventasSeries.length === 1
                            ? chartWidth / 2 - barWidth / 2
                            : idx * STEP + 16;

                        const y = 170 - height;

                        return (
                          <g key={`${v.label}-${idx}`}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              rx={6}
                              className="chart-bar"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={195}
                              className="chart-xlabel"
                              textAnchor={ventasRange === 'month' ? 'end' : 'middle'}
                              transform={
                                ventasRange === 'month'
                                  ? `rotate(-45 ${x + barWidth / 2} 195)`
                                  : undefined
                              }
                            >
                              {v.label}
                            </text>
                          </g>
                        );
                      })}

                      <line
                        x1={0}
                        y1={170}
                        x2={chartWidth}
                        y2={170}
                        className="chart-axis"
                      />
                    </svg>
                  </div>

                  <div className="chart-legend">
                    <span>Máx: {currency(Math.round(ventasMax))}</span>
                    <span>
                      {ventasRange === 'day' && 'Hoy'}
                      {ventasRange === 'week' && '7 días'}
                      {ventasRange === 'month' && '30 días'}
                    </span>
                  </div>
                </>
              )}
            </div>

          </section>

          <div className="metrics-grid">
            {cards.map((card) => (
              <div key={card.label} className="metric-card">
                <span className="metric-label">{card.label}</span>
                <span className="metric-value">{card.value}</span>
              </div>
            ))}
          </div>

          <section className="compet-hero">
            <div className="compet-hero__header">
              <div>
                <h3>Índice de competitividad</h3>
                <p className="muted">Comparativa de precio vs. mercado</p>
              </div>
              <div className="compet-hero__summary">
                <div className="compet-pill pill-good">🟢 Más baratos: {competitividadResumen.cheap}</div>
                <div className="compet-pill pill-neutral">🔵 Estándar: {competitividadResumen.fair}</div>
                <div className="compet-pill pill-bad">🔴 Más caros: {competitividadResumen.expensive}</div>
                <div className="compet-pill pill-neutral">
                  Prom. diferencia: {competitividadResumen.avgDiff >= 0 ? '+' : ''}
                  {competitividadResumen.avgDiff.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="compet-hero__table">
              {competitividad.length === 0 ? (
                <div className="chart-empty">Sin productos para comparar.</div>
              ) : (
                <div className="compet-table">
                  <div className="compet-row header">
                    <span>Producto</span>
                    <span>Tu precio</span>
                    <span>Mercado</span>
                    <span>Dif.</span>
                    <span>Estado</span>
                  </div>
                  {competitividad.map((c) => (
                    <div key={c.id} className="compet-row">
                      <div className="compet-prod">
                        <span className="list-title">{c.nombre}</span>
                        <span className="list-sub">ID: {c.id}</span>
                      </div>
                      <span>{currency(c.precio || 0)}</span>
                      <span>{currency(c.mercado)}</span>
                      <span className={c.diff >= 0 ? 'text-bad' : 'text-good'}>
                        {c.diff >= 0 ? '+' : ''}
                        {c.diff.toFixed(1)}%
                      </span>
                      <span
                        className={`chip ${
                          c.tag === 'cheap' ? 'chip-good' : c.tag === 'fair' ? 'chip-neutral' : 'chip-bad'
                        }`}
                      >
                        {c.tag === 'cheap' && 'Más barato'}
                        {c.tag === 'fair' && 'Precio estándar'}
                        {c.tag === 'expensive' && 'Más caro'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="panel-grid">

            <div className="panel">
              <div className="panel-header">
                <h3>Ticket promedio</h3>
              </div>
              <div className="panel-body">
                <div className="bar-list">
                  {tendenciasTicket.map((t) => (
                    <div key={t.label} className="bar-row">
                      <div className="bar-label">{t.label}</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.min(100, (t.valor || 0) / Math.max(ticketMes || 1, 1) * 100)}%` }}
                        />
                      </div>
                      <div className="bar-value">{currency(Math.round(t.valor || 0))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Productos más vendidos</h3>
              </div>
              <div className="panel-body list-body">
                {productosMasVendidos.length === 0 ? (
                  <p className="muted">Sin ventas registradas</p>
                ) : (
                  productosMasVendidos.map((p, idx) => (
                    <div key={p.id} className="list-row">
                      <span className="badge-rank">{idx + 1}</span>
                      <div className="list-col">
                        <span className="list-title">{p.nombre}</span>
                        
                      </div>
                      <span className="list-value">{p.qty} uds</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Horas de mayor demanda</h3>
              </div>
              <div className="panel-body list-body">
                {horasDemanda.length === 0 ? (
                  <p className="muted">Sin pedidos recientes</p>
                ) : (
                  horasDemanda.map((h) => (
                    <div key={h.h} className="list-row">
                      <span className="list-title">Hora {h.h}:00</span>
                      <span className="list-value">{h.v} pedidos</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalisisPage;