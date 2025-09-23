// src/components/categories/CategoryList.tsx
import React from 'react';
import './CategoryList.css';

export interface Category {
  id_categoria: string;
  nombre: string;
  descripcion?: string;
}

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onEdit, onDelete }) => {
  return (
    <div className="category-list">
      {categories.length === 0 ? (
        <p className="no-categories">No hay categorías disponibles.</p>
      ) : (
        <table className="category-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id_categoria}>
                <td data-label="Nombre">{category.nombre}</td>
                <td data-label="Descripción">{category.descripcion || 'N/A'}</td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(category)}
                      className="action-button edit-button"
                      title="Editar categoría"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(category)}
                      className="action-button delete-button"
                      title="Eliminar categoría"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CategoryList;
