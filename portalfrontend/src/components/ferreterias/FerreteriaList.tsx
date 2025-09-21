// src/components/ferreterias/FerreteriaList.tsx
import React from 'react';
import EditIcon from '../common/EditIcon';
import DeleteIcon from '../common/DeleteIcon';
import './FerreteriaList.css';

export interface Ferreteria {
  id_ferreteria: string;
  rut: string;
  razon_social: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  api_key: string;
}

interface FerreteriaListProps {
  ferreterias: Ferreteria[];
  onEdit: (ferreteria: Ferreteria) => void;
  onDelete: (ferreteria: Ferreteria) => void;
}

const FerreteriaList: React.FC<FerreteriaListProps> = ({ ferreterias, onEdit, onDelete }) => {
  return (
    <div className="ferreteria-list">
      {ferreterias.length === 0 ? (
        <div className="no-ferreterias">
          <p>No hay ferreterías registradas.</p>
        </div>
      ) : (
        <div className="ferreteria-grid">
          {ferreterias.map((ferreteria) => (
            <div key={ferreteria.id_ferreteria} className="ferreteria-card">
              <div className="ferreteria-header">
                <h3>{ferreteria.razon_social}</h3>
                <div className="ferreteria-actions">
                  <button
                    onClick={() => onEdit(ferreteria)}
                    className="edit-button"
                    title="Editar"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => onDelete(ferreteria)}
                    className="delete-button"
                    title="Eliminar"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              <div className="ferreteria-details">
                <p><strong>RUT:</strong> {ferreteria.rut}</p>
                <p><strong>Dirección:</strong> {ferreteria.direccion}</p>
                {ferreteria.telefono && (
                  <p><strong>Teléfono:</strong> {ferreteria.telefono}</p>
                )}
                <p><strong>API Key:</strong> {ferreteria.api_key}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FerreteriaList;
