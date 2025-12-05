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

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatPrice = (value: number | undefined): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
};

const getStockTone = (stock: number): 'low' | 'medium' | 'high' => {
  if (stock <= 5) return 'low';
  if (stock <= 20) return 'medium';
  return 'high';
};

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  return (
    <div className="product-table-card">
      <div className="table-scroll">
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
            {products.map((product) => {
              const stockValue = Number((product as any).stock ?? 0);
              const stockTone = getStockTone(stockValue);
              const categoryName = product.categoria?.nombre || 'Sin categoría';

              return (
                <tr key={product.id_producto} className={stockTone === 'low' ? 'low-stock-row' : undefined}>
                  <td data-label="Imagen">
                    {product.imagen_url ? (
                      <img className="product-thumb" src={product.imagen_url} alt={product.nombre} />
                    ) : (
                      <div className="product-thumb-placeholder">N/A</div>
                    )}
                  </td>
                  <td data-label="Nombre">
                    <div className="cell-title">{product.nombre}</div>
                    <span className="cell-subtitle">ID: {product.id_producto}</span>
                  </td>
                  <td data-label="SKU" className="sku-cell">
                    {product.sku}
                  </td>
                  <td data-label="Precio">
                    <span className="price-value">{formatPrice(product.precio)}</span>
                  </td>
                  <td data-label="Stock">
                    <span className={`stock-pill stock-pill--${stockTone}`}>{stockValue}</span>
                  </td>
                  <td data-label="Categoría">
                    <span className="category-chip">{categoryName}</span>
                  </td>
                  <td data-label="Acciones">
                    <div className="action-buttons">
                      <button onClick={() => onEdit(product)} className="action-button edit-button">
                        Editar
                      </button>
                      <button onClick={() => onDelete(product)} className="action-button delete-button">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
