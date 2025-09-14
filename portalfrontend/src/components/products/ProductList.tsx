
import React from 'react';
import './ProductList.css'; 

export interface Product {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  return (
    <table className="product-table"> {}
      <thead>
        <tr>
          <th>Nombre</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.nombre}</td>
            <td>{product.sku}</td>
            <td>${product.precio.toLocaleString('es-CL')}</td>
            <td>{product.stock}</td>
            <td>
              {}
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