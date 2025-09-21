// src/pages/ProductosPage.tsx
import React, { useState, useEffect } from 'react';
import ProductList, { Product, Category, Ferreteria } from '../components/products/ProductList';
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
  const [ferreterias, setFerreterias] = useState<Ferreteria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  // --- Cargar productos, categorías y ferreterías del backend al iniciar ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar productos
        const productsResponse = await fetch(`${API_URL}/productos`);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        } else {
          console.error('Error al cargar productos:', productsResponse.status);
          setProducts([]);
        }

        // Cargar categorías
        const categoriesResponse = await fetch(`${API_URL}/categorias`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } else {
          console.error('Error al cargar categorías:', categoriesResponse.status);
          setCategories([]);
        }

        // Cargar ferreterías
        const ferreteriasResponse = await fetch(`${API_URL}/ferreterias`);
        if (ferreteriasResponse.ok) {
          const ferreteriasData = await ferreteriasResponse.json();
          setFerreterias(Array.isArray(ferreteriasData) ? ferreteriasData : []);
        } else {
          console.error('Error al cargar ferreterías:', ferreteriasResponse.status);
          setFerreterias([]);
        }
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        setProducts([]);
        setCategories([]);
        setFerreterias([]);
        setError('Error al cargar los datos del servidor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Lógica para guardar (Crear o Editar) ---
  const handleSaveProduct = async (product: Product) => {
    // --- LÓGICA PARA EDITAR UN PRODUCTO EXISTENTE ---
    if (productToEdit) {
      console.log('2. Enviando actualización (PUT) al backend:', product);
      try {
        const response = await fetch(`${API_URL}/productos/${product.id_producto}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });

        if (response.ok) {
          const updatedProduct = await response.json();
          // Actualizamos el estado local reemplazando el producto antiguo por el nuevo
          setProducts(products.map(p => (p.id_producto === updatedProduct.id_producto ? updatedProduct : p)));
          addNotification(`Producto "${updatedProduct.nombre}" actualizado correctamente.`, 'success');
        } else {
          console.error('Falló la actualización del producto');
          addNotification('Error al actualizar el producto.', 'error');
        }
      } catch (error) {
        console.error('Error de red al actualizar:', error);
        addNotification('Error de red al actualizar el producto.', 'error');
      }
    }
    // --- LÓGICA PARA CREAR UN PRODUCTO NUEVO ---
    else {
      console.log('2. Enviando producto nuevo (POST) al backend:', product);
      try {
        const { id_producto, ...newProductData } = product; // Quitamos el id temporal
        const response = await fetch(`${API_URL}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProductData),
        });

        if (response.ok) {
          const addedProductWithId = await response.json();
          setProducts([...products, addedProductWithId]);
          addNotification(`Producto "${addedProductWithId.nombre}" creado correctamente.`, 'success');
        } else {
          console.error('Falló la creación del producto');
          addNotification('Error al crear el producto.', 'error');
        }
      } catch (error) {
        console.error('Error de red al crear:', error);
        addNotification('Error de red al crear el producto.', 'error');
      }
    }
    closeModal();
  };

  // --- Lógica para eliminar ---
  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`${API_URL}/productos/${productToDelete.id_producto}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p.id_producto !== productToDelete.id_producto));
        addNotification(`Producto "${productToDelete.nombre}" eliminado correctamente.`, 'success');
      } else {
        addNotification('Error al eliminar el producto.', 'error');
      }
    } catch (error) {
      console.error('Error de red al eliminar:', error);
      addNotification('Error de red al eliminar el producto.', 'error');
    }

    // Cerrar el modal y limpiar el estado
    setIsConfirmModalOpen(false);
    setProductToDelete(null);
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

      {/* Alerta de stock bajo */}
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
        ferreterias={ferreterias}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      {/* Contenedor de notificaciones */}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default ProductosPage;
