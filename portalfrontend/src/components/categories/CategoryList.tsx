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
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.id_categoria} className="category-card">
              <div className="category-header">
                <h3>{category.nombre}</h3>
                <div className="category-actions">
                  <button
                    onClick={() => onEdit(category)}
                    className="edit-button"
                    title="Editar categoría"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="delete-button"
                    title="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {category.descripcion && (
                <p className="category-description">{category.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryList;
