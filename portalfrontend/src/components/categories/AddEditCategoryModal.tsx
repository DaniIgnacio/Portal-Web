// src/components/categories/AddEditCategoryModal.tsx
import React, { useState, useEffect } from 'react';
import { Category } from './CategoryList';
import './AddEditCategoryModal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  categoryToEdit: Category | null;
}

const AddEditCategoryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, categoryToEdit }) => {
  const [category, setCategory] = useState<Category>({
    id_categoria: '',
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    if (categoryToEdit) {
      setCategory(categoryToEdit);
    } else {
      setCategory({
        id_categoria: '',
        nombre: '',
        descripcion: ''
      });
    }
  }, [categoryToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategory(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(category);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{categoryToEdit ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</h2>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la categoría</label>
              <input
                id="nombre"
                name="nombre"
                value={category.nombre}
                onChange={handleChange}
                required
                type="text" // Asegurar que es un input de texto
              />
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={category.descripcion || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCategoryModal;
