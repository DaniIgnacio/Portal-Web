// src/pages/CategoriasPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  const [search, setSearch] = useState('');

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

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const term = search.toLowerCase();
    return categories.filter((category) => {
      const values = [category.nombre, category.descripcion ?? ''];
      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [categories, search]);

  const totalCategorias = categories.length;
  const sinDescripcion = categories.filter((category) => !category.descripcion?.trim()).length;
  const ultimaCategoria = useMemo(() => {
    if (!categories.length) return null;
    return categories[categories.length - 1];
  }, [categories]);

  const renderSkeleton = () => (
    <div className="categorias-page">
      <section className="categorias-hero categorias-hero--loading">
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
      <section className="categorias-content">
        <div className="categorias-card">
          <div className="categorias-card-header loading">
            <div className="skeleton skeleton-title small" />
            <div className="skeleton skeleton-chip" />
          </div>
          <div className="skeleton skeleton-bar large" />
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton skeleton-item" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  if (isLoading) {
    return renderSkeleton();
  }

  return (
    <div className="categorias-page">
      <section className="categorias-hero">
        <div className="hero-content">
          <span className="hero-badge">Catálogo</span>
          <h1>Gestión de categorías</h1>
          <p>
            Define y organiza las categorías que estructuran tu inventario. Mantén un catálogo consistente para
            mejorar la navegación y los reportes.
          </p>

          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-label">Categorías activas</span>
              <span className="metric-value">{totalCategorias}</span>
            </div>
            <div className="metric-card metric-card--soft">
              <span className="metric-label">Sin descripción</span>
              <span className="metric-value">{sinDescripcion}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Última creada</span>
              <span className="metric-value">
                {ultimaCategoria ? ultimaCategoria.nombre : 'N/D'}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <button onClick={handleAddNew} className="add-category-button hero-primary">
            <AddIcon />
            Nueva categoría
          </button>
          <button
            className="ghost-button ghost-button--light"
            onClick={() => window.location.reload()}
            type="button"
          >
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

      <section className="categorias-content">
        <div className="categorias-card">
          <div className="categorias-card-header">
            <div>
              <h2>Listado de categorías</h2>
              <p>Usa el buscador para encontrar categorías específicas o detectar brechas en tu catálogo.</p>
            </div>
            <div className="result-chip">
              <span className="chip-label">Mostrando</span>
              <span className="chip-value">{filteredCategories.length}</span>
            </div>
          </div>

          <div className="categorias-toolbar">
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar categorías…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                Reintentar
              </button>
            </div>
          ) : (
            <CategoryList categories={filteredCategories} onEdit={handleEdit} onDelete={handleDeleteRequest} />
          )}
        </div>
      </section>

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

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default CategoriasPage;
