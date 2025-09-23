// src/pages/ProductosPage.tsx
import React, { useState, useEffect } from 'react';
import ProductList, { Product, Category } from '../components/products/ProductList';
import AddEditProductModal from '../components/products/AddEditProductModal';
import AddIcon from '../components/common/AddIcon';
import './ProductosPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

// La URL de tu backend
const API_URL = 'http://localhost:5000/api';

const ProductosPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const headers = getAuthHeaders();

        // Cargar productos
        const productsResponse = await fetch(`${API_URL}/productos`, { headers });
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        } else if (productsResponse.status === 401 || productsResponse.status === 403) {
          addNotification('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.', 'error');
          setProducts([]);
        } else {
          console.error('Error al cargar productos:', productsResponse.status);
          addNotification(`Error al cargar productos: ${productsResponse.statusText || productsResponse.status}`, 'error');
          setProducts([]);
        }

        // Cargar categorías (las categorías son globales y no requieren id_ferreteria)
        const categoriesResponse = await fetch(`${API_URL}/categorias`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error('Error al cargar categorías:', categoriesResponse.status);
          addNotification(`Error al cargar categorías: ${categoriesResponse.statusText || categoriesResponse.status}`, 'error');
          setCategories([]);
        }

        // La carga de ferreterías ya no es necesaria aquí

      } catch (error) {
        console.error('Error al cargar los datos:', error);
        setProducts([]);
        setCategories([]);
        setError('Error al cargar los datos del servidor');
        addNotification('Error de red al cargar los datos.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addNotification]);

  const handleSaveProduct = async (product: Product) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...getAuthHeaders() };
    let url = `${API_URL}/productos`;
    let method = 'POST';

    if (productToEdit) {
      url = `${API_URL}/productos/${product.id_producto}`;
      method = 'PUT';
    }

    try {
      const { id_producto, id_ferreteria, ferreteria, ...productDataToSend } = product;
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(productDataToSend),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        if (method === 'POST') {
          setProducts([...products, savedProduct]);
          addNotification(`Producto \"${savedProduct.nombre}\" creado correctamente.`, 'success');
        } else {
          setProducts(products.map(p => (p.id_producto === savedProduct.id_producto ? savedProduct : p)));
          addNotification(`Producto \"${savedProduct.nombre}\" actualizado correctamente.`, 'success');
        }
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para realizar esta acción. Por favor, inicia sesión de nuevo.', 'error');
      } else {
        const errorData = await response.json();
        console.error(`Falló la ${method === 'POST' ? 'creación' : 'actualización'} del producto:`, errorData);
        addNotification(`Error al ${method === 'POST' ? 'crear' : 'actualizar'} el producto: ${errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error de red al guardar el producto:', error);
      addNotification('Error de red al guardar el producto.', 'error');
    }
    closeModal();
  };

  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    const headers = getAuthHeaders();
    try {
      const response = await fetch(`${API_URL}/productos/${productToDelete.id_producto}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id_producto !== productToDelete.id_producto));
        addNotification(`Producto \"${productToDelete.nombre}\" eliminado correctamente.`, 'success');
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para eliminar este producto. Por favor, inicia sesión de nuevo.', 'error');
      } else {
        const errorData = await response.json();
        addNotification(`Error al eliminar el producto: ${errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error de red al eliminar:', error);
      addNotification('Error de red al eliminar el producto.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  if (isLoading) return <div>Cargando productos...</div>;

  if (error) {
    return (
      <div>
        <div className="productos-page-header">
          <h2>Gestión de Productos</h2>
          <button onClick={handleAddNew} className="add-product-button">
            <AddIcon />
            Añadir Nuevo Producto
          </button>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div>
      <div className="productos-page-header">
        <h2>Gestión de Productos</h2>
        <button onClick={handleAddNew} className="add-product-button">
          <AddIcon />
          Añadir Nuevo Producto
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="stock-alert">
          <h3>⚠️ Alerta de Stock Bajo</h3>
          <ul>
            {lowStockProducts.map(p => (
              <li key={p.id_producto}>{p.nombre} - Stock: {p.stock}</li>
            ))}
          </ul>
        </div>
      )}

      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
        // Ya no necesitamos pasar ferreterias al modal porque el backend maneja la asociación
        // ferreterias={ferreterias}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto \"${productToDelete?.nombre}\"? Esta acción no se puede deshacer.`}
      />

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ProductosPage;
