import React from 'react';
import './ProductList.css';

export interface Category {
  id_categoria: string;
  nombre: string;
  descripcion?: string;
}

export interface Ferreteria {
  id_ferreteria: string;
  rut: string;
  razon_social: string;
  direccion: string;
}

export interface Product {
  id_producto: string;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
  id_categoria: string;
  id_ferreteria: string;
  imagen_url?:string;
  categoria?: Category;
  ferreteria?: Ferreteria;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Categoría</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id_producto}>
            <td data-label="Imagen">
              {product.imagen_url ? (
                <img className="product-thumb" src={product.imagen_url} alt={product.nombre} />
              ) : (
                <div className="product-thumb-placeholder">N/A</div>
              )}
            </td>
            <td data-label="Nombre">{product.nombre}</td>
            <td data-label="SKU">{product.sku}</td>
            <td data-label="Precio">${(product.precio / 100).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td data-label="Stock">{product.stock}</td>
            <td data-label="Categoría">{product.categoria?.nombre || 'Sin categoría'}</td>
            <td data-label="Acciones">
              <button onClick={() => onEdit(product)} className="action-button edit-button">Editar</button>
              <button onClick={() => onDelete(product)} className="action-button delete-button">Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProductList;
