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

  // Hook para controlar la visibilidad de la alerta de stock
  const [isAlertVisible, setIsAlertVisible] = useState(true);

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

        // Cargar categorías
        const categoriesResponse = await fetch(`${API_URL}/categorias`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error('Error al cargar categorías:', categoriesResponse.status);
          addNotification(`Error al cargar categorías: ${categoriesResponse.statusText || categoriesResponse.status}`, 'error');
          setCategories([]);
        }
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
  
  // Vuelve a mostrar la alerta si la lista de productos cambia
  useEffect(() => {
    if (products.length > 0) {
      setIsAlertVisible(true);
    }
  }, [products]);

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
          addNotification(`Producto "${savedProduct.nombre}" creado correctamente.`, 'success');
        } else {
          setProducts(products.map(p => (p.id_producto === savedProduct.id_producto ? savedProduct : p)));
          addNotification(`Producto "${savedProduct.nombre}" actualizado correctamente.`, 'success');
        }
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para realizar esta acción. Por favor, inicia sesión de nuevo.', 'error');
      } else {
        const errorData = await response.json();
        addNotification(`Error al ${method === 'POST' ? 'crear' : 'actualizar'} el producto: ${errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
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
        addNotification(`Producto "${productToDelete.nombre}" eliminado correctamente.`, 'success');
      } else if (response.status === 401 || response.status === 403) {
        addNotification('No autorizado para eliminar este producto. Por favor, inicia sesión de nuevo.', 'error');
      } else {
        const errorData = await response.json();
        addNotification(`Error al eliminar el producto: ${errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
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

  const handleDismissAlert = () => {
    setIsAlertVisible(false);
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

      {isAlertVisible && lowStockProducts.length > 0 && (
        <div className="stock-alert">
          <div className="stock-alert-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          
          <div className="stock-alert-content">
            <h4>Alerta: Productos con stock bajo</h4>
            <p>
              Los siguientes productos se están agotando: {' '}
              {lowStockProducts.map(p => `${p.nombre} (Stock: ${p.stock})`).join(', ')}.
            </p>
          </div>

          <button onClick={handleDismissAlert} className="stock-alert-close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ProductosPage;