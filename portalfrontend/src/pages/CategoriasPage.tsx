// src/pages/CategoriasPage.tsx
import React, { useState, useEffect } from 'react';
import CategoryList, { Category } from '../components/categories/CategoryList';
import AddEditCategoryModal from '../components/categories/AddEditCategoryModal';
import AddIcon from '../components/common/AddIcon';
import './CategoriasPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

// La URL de tu backend
const API_URL = 'http://localhost:5000/api';

const CategoriasPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  // --- Cargar categorías del backend al iniciar ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/categorias`);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data : []);
        } else {
          console.error('Error al cargar categorías:', response.status);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error al cargar las categorías:', error);
        setCategories([]);
        setError('Error al cargar las categorías del servidor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // --- Lógica para guardar (Crear o Editar) ---
  const handleSaveCategory = async (category: Category) => {
    // --- LÓGICA PARA EDITAR UNA CATEGORÍA EXISTENTE ---
    if (categoryToEdit) {
      console.log('2. Enviando actualización (PUT) al backend:', category);
      try {
        const response = await fetch(`${API_URL}/categorias/${category.id_categoria}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        });

        if (response.ok) {
          const updatedCategory = await response.json();
          // Actualizamos el estado local reemplazando la categoría antigua por la nueva
          setCategories(categories.map(c => (c.id_categoria === updatedCategory.id_categoria ? updatedCategory : c)));
          addNotification(`Categoría "${updatedCategory.nombre}" actualizada correctamente.`, 'success');
        } else {
          console.error('Falló la actualización de la categoría');
          addNotification('Error al actualizar la categoría.', 'error');
        }
      } catch (error) {
        console.error('Error de red al actualizar:', error);
        addNotification('Error de red al actualizar la categoría.', 'error');
      }
    }
    // --- LÓGICA PARA CREAR UNA CATEGORÍA NUEVA ---
    else {
      console.log('2. Enviando categoría nueva (POST) al backend:', category);
      try {
        const { id_categoria, ...newCategoryData } = category; // Quitamos el id temporal
        const response = await fetch(`${API_URL}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCategoryData),
        });

        if (response.ok) {
          const addedCategoryWithId = await response.json();
          setCategories([...categories, addedCategoryWithId]);
          addNotification(`Categoría "${addedCategoryWithId.nombre}" creada correctamente.`, 'success');
        } else {
          console.error('Falló la creación de la categoría');
          addNotification('Error al crear la categoría.', 'error');
        }
      } catch (error) {
        console.error('Error de red al crear:', error);
        addNotification('Error de red al crear la categoría.', 'error');
      }
    }
    closeModal();
  };

  // --- Lógica para eliminar ---
  const handleDeleteRequest = (category: Category) => {
    setCategoryToDelete(category);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`${API_URL}/categorias/${categoryToDelete.id_categoria}`, { method: 'DELETE' });
      if (response.ok) {
        setCategories(categories.filter(c => c.id_categoria !== categoryToDelete.id_categoria));
        addNotification(`Categoría "${categoryToDelete.nombre}" eliminada correctamente.`, 'success');
      } else {
        addNotification('Error al eliminar la categoría.', 'error');
      }
    } catch (error) {
      console.error('Error de red al eliminar:', error);
      addNotification('Error de red al eliminar la categoría.', 'error');
    }

    // Cerrar el modal y limpiar el estado
    setIsConfirmModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  if (isLoading) return <div>Cargando categorías...</div>;

  if (error) {
    return (
      <div>
        <div className="categorias-page-header">
          <h2>Gestión de Categorías</h2>
          <button onClick={handleAddNew} className="add-category-button">
            <AddIcon />
            Añadir Nueva Categoría
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

  return (
    <div>
      <div className="categorias-page-header">
        <h2>Gestión de Categorías</h2>
        <button onClick={handleAddNew} className="add-category-button">
          <AddIcon />
          Añadir Nueva Categoría
        </button>
      </div>

      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <AddEditCategoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />

      {/* Contenedor de notificaciones */}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default CategoriasPage;
