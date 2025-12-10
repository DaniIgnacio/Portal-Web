// src/pages/ProductosPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import ProductList, { Product, Category } from '../components/products/ProductList';
import AddEditProductModal from '../components/products/AddEditProductModal';
import AddIcon from '../components/common/AddIcon';
import './ProductosPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

const API_URL = 'http://localhost:5000/api';

const ProductosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // UI / filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Alerta stock
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const fetchData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();

      // Productos
      const productsResponse = await fetch(`${API_URL}/productos`, { headers });
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else if (productsResponse.status === 401 || productsResponse.status === 403) {
        addNotification('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.', 'error');
        setProducts([]);
      } else {
        addNotification(
          `Error al cargar productos: ${productsResponse.statusText || productsResponse.status}`,
          'error'
        );
        setProducts([]);
      }

      // Categorías
      const categoriesResponse = await fetch(`${API_URL}/categorias`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        addNotification(
          `Error al cargar categorías: ${categoriesResponse.statusText || categoriesResponse.status}`,
          'error'
        );
        setCategories([]);
      }
    } catch (err) {
      setProducts([]);
      setCategories([]);
      setError('Error al cargar los datos del servidor');
      addNotification('Error de red al cargar los datos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuelve a mostrar la alerta si cambia la lista
  useEffect(() => {
    if (products.length > 0) setIsAlertVisible(true);
  }, [products]);

  const handleSaveProduct = async (product: Product): Promise<void> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    let url = `${API_URL}/productos`;
    let method: 'POST' | 'PUT' = 'POST';

    if (productToEdit) {
      url = `${API_URL}/productos/${product.id_producto}`;
      method = 'PUT';
    }

    // Optimistic: guarda snapshot previo
    const previous = products;
    try {
      // Evita enviar campos calculados/relacionales y asegura id_categoria
      const {
        id_producto,
        id_ferreteria,
        ferreteria,
        categoria,
        ...rest
      } = product as unknown as Record<string, unknown>;

      const productDataToSend = {
        ...rest,
        id_categoria: (product as any).id_categoria ?? (product as any).categoria?.id_categoria ?? '',
      };

      // Optimistic: aplicar cambio local
      if (method === 'POST') {
        const tempId = `temp-${Date.now()}`;
        setProducts((prev) => [...prev, { ...(product as any), id_producto: tempId }]);
      } else {
        setProducts((prev) => prev.map((p) => (p.id_producto === (product as any).id_producto ? { ...p, ...product } : p)));
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(productDataToSend),
      });

      if (response.ok) {
        const savedProduct: Product = await response.json();
        if (method === 'POST') {
          setProducts(prev => [...prev, savedProduct]);
          addNotification(`Producto "${savedProduct.nombre}" creado correctamente.`, 'success');
        } else {
          setProducts(prev => prev.map(p => (p.id_producto === savedProduct.id_producto ? savedProduct : p)));
          addNotification(`Producto "${savedProduct.nombre}" actualizado correctamente.`, 'success');
        }
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para realizar esta acción. Por favor, inicia sesión de nuevo.', 'error');
      } else {
        const errorData = await response.json().catch(() => ({}));
        addNotification(
          `Error al ${method === 'POST' ? 'crear' : 'actualizar'} el producto: ${(errorData as any).error || response.statusText}`,
          'error'
        );
        // Rollback
        setProducts(previous);
      }
    } catch {
      addNotification('Error de red al guardar el producto.', 'error');
      setProducts(previous);
    }
    closeModal();
  };

  const handleDeleteRequest = (product: Product): void => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!productToDelete) return;

    const headers = getAuthHeaders();
    const previous = products;
    // Optimistic remove
    setProducts((prev) => prev.filter((p) => p.id_producto !== productToDelete.id_producto));
    try {
      const response = await fetch(`${API_URL}/productos/${productToDelete.id_producto}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id_producto !== productToDelete.id_producto));
        addNotification(`Producto "${productToDelete.nombre}" eliminado correctamente.`, 'success');
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para eliminar este producto. Por favor, inicia sesión de nuevo.', 'error');
        setProducts(previous);
      } else {
        const errorData = await response.json().catch(() => ({}));
        addNotification(
          `Error al eliminar el producto: ${(errorData as any).error || response.statusText}`,
          'error'
        );
        setProducts(previous);
      }
    } catch {
      addNotification('Error de red al eliminar el producto.', 'error');
      setProducts(previous);
    } finally {
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product: Product): void => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleAddNew = (): void => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleDismissAlert = (): void => setIsAlertVisible(false);

  const lowStockProducts = useMemo(
    () => products.filter((p) => (p as any).stock <= 5),
    [products]
  );

  const totalStock = useMemo(
    () =>
      products.reduce((sum, product) => {
        const stock = Number((product as any).stock ?? 0);
        return sum + (Number.isNaN(stock) ? 0 : stock);
      }, 0),
    [products]
  );

  const categoriesInUse = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach((product) => {
      const categoryId =
        (product as any).categoria?.id_categoria ?? (product as any).id_categoria;
      if (categoryId) {
        uniqueCategories.add(String(categoryId));
      }
    });
    return uniqueCategories.size;
  }, [products]);

  // Filtro en memoria (nombre, categoría, stock bajo)
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(p => {
      const nombre = (p as any).nombre as string | undefined;
      const nameMatch = !term || nombre?.toLowerCase().includes(term);

      const catId =
        (p as any).id_categoria ??
        (p as any).categoria?.id_categoria ??
        '';

      const catMatch = !selectedCategory || String(catId) === selectedCategory;
      const stockMatch = !showLowStockOnly || (p as any).stock <= 5;
      return nameMatch && catMatch && stockMatch;
    });
  }, [products, search, selectedCategory, showLowStockOnly]);

  const renderStockAlert = (): React.ReactNode => {
    if (!isAlertVisible || lowStockProducts.length === 0) return null;

    return (
      <div className="stock-alert">
        <div className="stock-alert-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            fill="none"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="stock-alert-content">
          <h4>Alerta: productos con stock bajo</h4>
          <p>
            Los siguientes productos se están agotando:{' '}
            {lowStockProducts
              .map((p: any) => `${p.nombre} (Stock: ${p.stock})`)
              .join(', ')}
            .
          </p>
        </div>
        <button
          onClick={handleDismissAlert}
          className="stock-alert-close"
          aria-label="Cerrar alerta"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            fill="none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  const renderEmptyState = (): React.ReactNode => (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <h3>No hay resultados</h3>
      <p>Ajusta tu búsqueda o filtros. También puedes crear un nuevo producto.</p>
      <button onClick={handleAddNew} className="add-product-button small">
        <AddIcon /> Crear producto
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="productos-page">
        <section className="productos-hero productos-hero--loading">
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
        <section className="productos-content">
          <div className="productos-card">
            <div className="productos-card-header loading">
              <div className="skeleton skeleton-title small" />
              <div className="skeleton skeleton-chip" />
            </div>
            <div className="skeleton skeleton-bar large" />
            <div className="skeleton-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-item" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="productos-page">
      <section className="productos-hero">
        <div className="hero-content">
          <span className="hero-badge">Inventario</span>
          <h1>Gestión de Productos</h1>
          <p>
            Supervisa el estado de tu catálogo, identifica oportunidades y toma decisiones basadas en
            datos en cuestión de segundos.
          </p>

          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-label">Productos activos</span>
              <span className="metric-value">{products.length}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Categorías en uso</span>
              <span className="metric-value">{categoriesInUse}</span>
            </div>
            <div className={`metric-card ${lowStockProducts.length > 0 ? 'metric-card--warning' : ''}`}>
              <span className="metric-label">Alertas de stock</span>
              <span className="metric-value">{lowStockProducts.length}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Unidades en inventario</span>
              <span className="metric-value">{totalStock.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <button onClick={handleAddNew} className="add-product-button hero-primary">
            <AddIcon />
            Añadir producto
          </button>
          <button className="ghost-button ghost-button--light" onClick={() => void fetchData()}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 .65-.13 1.27-.36 1.84l1.46 1.46A6.984 6.984 0 0 0 19 13c0-3.87-3.13-7-7-7zm-7.64.36L2.9 7.82A6.984 6.984 0 0 0 5 13c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5 0-.65.13-1.27.36-1.84l-1.46-1.46z"
              />
            </svg>
            Recargar
          </button>
        </div>
      </section>

      <section className="productos-content">
        <div className="productos-card">
          <div className="productos-card-header">
            <div>
              <h2>Listado de productos</h2>
              <p>Filtra por nombre, categoría o alertas para mantener el inventario al día.</p>
            </div>
            <div className="result-chip">
              <span className="chip-label">Mostrando</span>
              <span className="chip-value">{filteredProducts.length}</span>
            </div>
          </div>

          <div className="productos-toolbar">
            <div className="filter-field">
              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-field">
              <select
                className="select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c: any) => (
                  <option
                    key={(c.id_categoria ?? c.id)?.toString()}
                    value={(c.id_categoria ?? c.id)?.toString()}
                  >
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <label className="checkbox filter-field">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
              />
              <span>Solo stock bajo (≤5)</span>
            </label>
          </div>

          {renderStockAlert()}

          {filteredProducts.length > 0 ? (
            <ProductList products={filteredProducts} onEdit={handleEdit} onDelete={handleDeleteRequest} />
          ) : (
            renderEmptyState()
          )}
        </div>
      </section>

      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ProductosPage;
