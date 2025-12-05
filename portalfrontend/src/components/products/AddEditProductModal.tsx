import { Product, Category } from './ProductList';
import './AddEditProductModal.css';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  categories: Category[];
}

const formatCurrencyInput = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  const formatter = new Intl.NumberFormat('es-CL');
  return formatter.format(Math.round(value));
};

const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  return parseInt(cleaned, 10);
};

const AddEditProductModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
}) => {
  const [product, setProduct] = useState<Product>({
    id_producto: '',
    nombre: '',
    sku: '',
    precio: '' as unknown as number,
    stock: '' as unknown as number,
    id_categoria: '',
    id_ferreteria: '',
    imagen_url: '',
  });
  const [precioInput, setPrecioInput] = useState<string>('');

  useEffect(() => {
    if (productToEdit) {
      setProduct(productToEdit);
      setPrecioInput(formatCurrencyInput(productToEdit.precio));
    } else {
      setProduct({
        id_producto: '',
        nombre: '',
        sku: '',
        precio: '' as unknown as number,
        stock: '' as unknown as number,
        id_categoria: '',
        id_ferreteria: '',
        imagen_url: '',
      });
      setPrecioInput('0');
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'stock') {
      setProduct((prev) => ({
        ...prev,
        stock: parseInt(value, 10) || 0,
      }));
      return;
    }

    setProduct((prev) => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value,
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrecioInput(value);
    setProduct((prev) => ({
      ...prev,
      precio: parseCurrencyInput(value),
    }));
  };

  const handlePriceFocus = () => {
    setPrecioInput(product.precio.toString());
  };

  const handlePriceBlur = () => {
    setPrecioInput(formatCurrencyInput(product.precio));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `productos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('productos')
      .upload(filePath, file, { upsert: false });

    if (error) {
      console.error('Error subiendo imagen:', error);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);

    setProduct((prev) => ({
      ...prev,
      imagen_url: publicUrlData.publicUrl,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...product, precio: product.precio });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-header">
            <h2>{productToEdit ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nombre">Nombre del producto</label>
              <input id="nombre" name="nombre" value={product.nombre} onChange={handleChange} required type="text" />
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input id="sku" name="sku" value={product.sku} onChange={handleChange} required type="text" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="precio">Precio</label>
                <input
                  id="precio"
                  name="precio"
                  value={precioInput}
                  placeholder="0"
                  onChange={handlePriceChange}
                  onFocus={() => setPrecioInput(precioInput === '0' ? '' : precioInput)}
                  onBlur={() => setPrecioInput(formatCurrencyInput(product.precio))}
                  inputMode="numeric"
                  pattern="[0-9\.]*"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock disponible</label>
                <input 
                id="stock" 
                name="stock" 
                value={product.stock === 0 ? '' : product.stock} 
                placeholder="0"
                onChange={handleChange}
                type="number" 
                required />
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

            <div className="form-group">
              <label htmlFor="imagen">Imagen del producto</label>
              <input
                id="imagen"
                name="imagen"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {product.imagen_url && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={product.imagen_url}
                    alt="Preview"
                    style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: 6 }}
                  />
                </div>
              )}
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

export default AddEditProductModal;
