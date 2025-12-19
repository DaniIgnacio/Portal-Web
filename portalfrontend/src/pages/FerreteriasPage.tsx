// src/pages/FerreteriasPage.tsx
import React, { useState, useEffect } from 'react';
import FerreteriaList, { Ferreteria } from '../components/ferreterias/FerreteriaList';
import AddEditFerreteriaModal from '../components/ferreterias/AddEditFerreteriaModal';
import AddIcon from '../components/common/AddIcon';
import './FerreteriasPage.css';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';
import NotificationContainer from '../components/common/Notification';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

const FerreteriasPage = () => {
  const [ferreterias, setFerreterias] = useState<Ferreteria[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ferreteriaToEdit, setFerreteriaToEdit] = useState<Ferreteria | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ferreteriaToDelete, setFerreteriaToDelete] = useState<Ferreteria | null>(null);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  // --- Cargar ferreterías del backend al iniciar ---
  useEffect(() => {
    const fetchFerreterias = async () => {
      try {
        const response = await fetch(`${API_URL}/ferreterias`);
        if (response.ok) {
          const data = await response.json();
          setFerreterias(Array.isArray(data) ? data : []);
        } else {
          console.error('Error al cargar ferreterías:', response.status);
          setFerreterias([]);
        }
      } catch (error) {
        console.error('Error al cargar las ferreterías:', error);
        setFerreterias([]);
        setError('Error al cargar las ferreterías del servidor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFerreterias();
  }, []);

  // --- Lógica para guardar (Crear o Editar) ---
  const handleSaveFerreteria = async (ferreteria: Ferreteria) => {
    // --- LÓGICA PARA EDITAR UNA FERRETERÍA EXISTENTE ---
    if (ferreteriaToEdit) {
      console.log('2. Enviando actualización (PUT) al backend:', ferreteria);
      try {
        const response = await fetch(`${API_URL}/ferreterias/${ferreteria.id_ferreteria}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ferreteria),
        });

        if (response.ok) {
          const updatedFerreteria = await response.json();
          // Actualizamos el estado local reemplazando la ferretería antigua por la nueva
          setFerreterias(ferreterias.map(f => (f.id_ferreteria === updatedFerreteria.id_ferreteria ? updatedFerreteria : f)));
          addNotification(`Ferretería "${updatedFerreteria.razon_social}" actualizada correctamente.`, 'success');
        } else {
          console.error('Falló la actualización de la ferretería');
          addNotification('Error al actualizar la ferretería.', 'error');
        }
      } catch (error) {
        console.error('Error de red al actualizar:', error);
        addNotification('Error de red al actualizar la ferretería.', 'error');
      }
    }
    // --- LÓGICA PARA CREAR UNA FERRETERÍA NUEVA ---
    else {
      console.log('2. Enviando ferretería nueva (POST) al backend:', ferreteria);
      try {
        const { id_ferreteria, ...newFerreteriaData } = ferreteria; // Quitamos el id temporal
        const response = await fetch(`${API_URL}/ferreterias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFerreteriaData),
        });

        if (response.ok) {
          const addedFerreteriaWithId = await response.json();
          setFerreterias([...ferreterias, addedFerreteriaWithId]);
          addNotification(`Ferretería "${addedFerreteriaWithId.razon_social}" creada correctamente.`, 'success');
        } else {
          console.error('Falló la creación de la ferretería');
          addNotification('Error al crear la ferretería.', 'error');
        }
      } catch (error) {
        console.error('Error de red al crear:', error);
        addNotification('Error de red al crear la ferretería.', 'error');
      }
    }
    closeModal();
  };

  // --- Lógica para eliminar ---
  const handleDeleteRequest = (ferreteria: Ferreteria) => {
    setFerreteriaToDelete(ferreteria);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ferreteriaToDelete) return;

    try {
      const response = await fetch(`${API_URL}/ferreterias/${ferreteriaToDelete.id_ferreteria}`, { method: 'DELETE' });
      if (response.ok) {
        setFerreterias(ferreterias.filter(f => f.id_ferreteria !== ferreteriaToDelete.id_ferreteria));
        addNotification(`Ferretería "${ferreteriaToDelete.razon_social}" eliminada correctamente.`, 'success');
      } else {
        addNotification('Error al eliminar la ferretería.', 'error');
      }
    } catch (error) {
      console.error('Error de red al eliminar:', error);
      addNotification('Error de red al eliminar la ferretería.', 'error');
    }

    // Cerrar el modal y limpiar el estado
    setIsConfirmModalOpen(false);
    setFerreteriaToDelete(null);
  };

  const handleEdit = (ferreteria: Ferreteria) => {
    setFerreteriaToEdit(ferreteria);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFerreteriaToEdit(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFerreteriaToEdit(null);
  };

  if (isLoading) return <div>Cargando ferreterías...</div>;

  if (error) {
    return (
      <div>
        <div className="ferreterias-page-header">
          <h2>Gestión de Ferreterías</h2>
          <button onClick={handleAddNew} className="add-ferreteria-button">
            <AddIcon />
            Añadir Nueva Ferretería
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
      <div className="ferreterias-page-header">
        <h2>Gestión de Ferreterías</h2>
        <button onClick={handleAddNew} className="add-ferreteria-button">
          <AddIcon />
          Añadir Nueva Ferretería
        </button>
      </div>

      <FerreteriaList
        ferreterias={ferreterias}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <AddEditFerreteriaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveFerreteria}
        ferreteriaToEdit={ferreteriaToEdit}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la ferretería "${ferreteriaToDelete?.razon_social}"? Esta acción no se puede deshacer.`}
      />

      {/* Contenedor de notificaciones */}
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};

export default FerreteriasPage;
