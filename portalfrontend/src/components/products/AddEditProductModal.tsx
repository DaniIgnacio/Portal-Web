import { Product, Category } from './ProductList';
import './AddEditProductModal.css';
import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  categories: Category[];
  // ferreterias: Ferreteria[]; // Ya no es necesario
}

const AddEditProductModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  // ferreterias // Ya no es necesario
}) => {
  const [product, setProduct] = useState<Product>({
    id_producto: '',
    nombre: '',
    sku: '',
    precio: 0,
    stock: 0,
    id_categoria: '',
    id_ferreteria: '' // id_ferreteria se mantendrá en el estado pero no se modificará desde aquí
  });

  useEffect(() => {
    if (productToEdit) {
      setProduct(productToEdit);
    } else {
      setProduct({
        id_producto: '',
        nombre: '',
        sku: '',
        precio: 0,
        stock: 0,
        id_categoria: '',
        id_ferreteria: '' // Se inicializa vacío, el backend lo asignará
      });
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'precio') {
      const numericValue = parseFloat(value) || 0;
      setProduct(prev => ({
        ...prev,
        [name]: Math.round(numericValue * 100),
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(product);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{productToEdit ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nombre">Nombre del producto</label>
              <input id="nombre" name="nombre" value={product.nombre} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input id="sku" name="sku" value={product.sku} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="precio">Precio</label>
                <input
                  id="precio"
                  name="precio"
                  value={product.precio / 100}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock disponible</label>
                <input id="stock" name="stock" value={product.stock} onChange={handleChange} type="number" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="id_categoria">Categoría</label>
              <select
                id="id_categoria"
                name="id_categoria"
                value={product.id_categoria}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id_categoria} value={category.id_categoria}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* El campo de Ferretería ya no es necesario aquí, el backend lo asigna automáticamente */}
            {/* <div className="form-group">
              <label htmlFor="id_ferreteria">Ferretería</label>
              <select
                id="id_ferreteria"
                name="id_ferreteria"
                value={product.id_ferreteria}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar ferretería</option>
                {ferreterias.map((ferreteria) => (
                  <option key={ferreteria.id_ferreteria} value={ferreteria.id_ferreteria}>
                    {ferreteria.razon_social} ({ferreteria.rut})
                  </option>
                ))}
              </select>
            </div> */}
          </div>

          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProductModal;
