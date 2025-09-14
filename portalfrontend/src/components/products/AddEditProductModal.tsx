import { Product } from './ProductList';
import './AddEditProductModal.css'; //
import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
}

const AddEditProductModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
  const [product, setProduct] = useState<Product>({ id: 0, nombre: '', sku: '', precio: 0, stock: 0 });

  useEffect(() => {
    if (productToEdit) {
      setProduct(productToEdit);
    } else {
      setProduct({ id: 0, nombre: '', sku: '', precio: 0, stock: 0 });
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
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
            
            <div className="form-group">
              <label htmlFor="precio">Precio</label>
              <input id="precio" name="precio" value={product.precio} onChange={handleChange} type="number" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="stock">Stock disponible</label>
              <input id="stock" name="stock" value={product.stock} onChange={handleChange} type="number" required />
            </div>
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