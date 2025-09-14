// src/pages/ProductosPage.tsx
import React, { useState, useEffect } from 'react';
import ProductList, { Product } from '../components/products/ProductList';
import AddEditProductModal from '../components/products/AddEditProductModal';
import AddIcon from '../components/common/AddIcon';
import './ProductosPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';

// La URL de tu backend
const API_URL = 'http://localhost:5000/api';

const ProductosPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // --- Cargar productos del backend al iniciar ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error al cargar los productos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- Lógica para guardar (Crear o Editar) ---
// En src/pages/ProductosPage.tsx

const handleSaveProduct = async (product: Product) => {
  // --- LÓGICA PARA EDITAR UN PRODUCTO EXISTENTE ---
  if (productToEdit) {
    console.log('2. Enviando actualización (PUT) al backend:', product);
    try {
      const response = await fetch(`${API_URL}/productos/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        // Actualizamos el estado local reemplazando el producto antiguo por el nuevo
        setProducts(products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
      } else {
        console.error('Falló la actualización del producto');
      }
    } catch (error) {
      console.error('Error de red al actualizar:', error);
    }
  } 
  // --- LÓGICA PARA CREAR UN PRODUCTO NUEVO ---
  else {
    console.log('2. Enviando producto nuevo (POST) al backend:', product);
    try {
      const { id, ...newProductData } = product; // Quitamos el id temporal
      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductData),
      });

      if (response.ok) {
        const addedProductWithId = await response.json();
        setProducts([...products, addedProductWithId]);
      } else {
        console.error('Falló la creación del producto');
      }
    } catch (error) {
      console.error('Error de red al crear:', error);
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

    await fetch(`${API_URL}/productos/${productToDelete.id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== productToDelete.id));
    
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

  
  return (
    <div>
      {/* ... (el header de la página se mantiene igual) ... */}
      <div className="productos-page-header">
        <h2>Gestión de Productos</h2>
        <button onClick={handleAddNew} className="add-product-button">
          <AddIcon />
          Añadir Nuevo Producto
        </button>
      </div>
      
      {/* 5. Pasamos la nueva función handleDeleteRequest a la lista */}
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
      />
      
      {/* 6. Añadimos el nuevo modal al final */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default ProductosPage;