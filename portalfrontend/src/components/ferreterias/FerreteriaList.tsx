// src/components/ferreterias/FerreteriaList.tsx
import React from 'react';
import { formatHorarioSummary } from '../../utils/horarioUtils';
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
  descripcion?: string;
  horario?: any;
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
        <p className="no-ferreterias">No hay ferreterías registradas.</p>
      ) : (
        <table className="ferreteria-table">
          <thead>
            <tr>
              <th>RUT</th>
              <th>Razón Social</th>
              <th>Descripción</th>
              <th>Dirección</th>
              <th>Horario</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ferreterias.map((ferreteria) => (
              <tr key={ferreteria.id_ferreteria}>
                <td data-label="RUT">{ferreteria.rut}</td>
                <td data-label="Razón Social">{ferreteria.razon_social}</td>
                <td data-label="Descripción">{ferreteria.descripcion || 'N/A'}</td>
                <td data-label="Dirección">{ferreteria.direccion}</td>
                <td data-label="Horario" title={typeof ferreteria.horario === 'object' ? JSON.stringify(ferreteria.horario) : (ferreteria.horario || '')}>
                  <span className="horario-badge">{formatHorarioSummary(ferreteria.horario)}</span>
                </td>
                <td data-label="Teléfono">{ferreteria.telefono || 'N/A'}</td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(ferreteria)}
                      className="action-button edit-button"
                      title="Editar ferretería"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(ferreteria)}
                      className="action-button delete-button"
                      title="Eliminar ferretería"
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

export default FerreteriaList;
