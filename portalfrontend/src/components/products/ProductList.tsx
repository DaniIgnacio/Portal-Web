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
          <th>Nombre</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Categoría</th>
          <th>Ferretería</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id_producto}>
            <td>{product.nombre}</td>
            <td>{product.sku}</td>
            <td>${(product.precio / 100).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>{product.stock}</td>
            <td>{product.categoria?.nombre || 'Sin categoría'}</td>
            <td>{product.ferreteria?.razon_social || 'Sin ferretería'}</td>
            <td>
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
