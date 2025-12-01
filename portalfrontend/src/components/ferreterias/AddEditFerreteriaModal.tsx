// src/components/ferreterias/AddEditFerreteriaModal.tsx
import React, { useState, useEffect } from 'react';
import { Ferreteria } from './FerreteriaList';
import './AddEditFerreteriaModal.css';

interface AddEditFerreteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ferreteria: Ferreteria) => void;
  ferreteriaToEdit: Ferreteria | null;
}

const AddEditFerreteriaModal: React.FC<AddEditFerreteriaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ferreteriaToEdit,
}) => {
  const [formData, setFormData] = useState({
    rut: '',
    razon_social: '',
    direccion: '',
    latitud: '',
    longitud: '',
    telefono: '',
    api_key: '',
    descripcion: '',
    horario: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (ferreteriaToEdit) {
      setFormData({
        rut: ferreteriaToEdit.rut,
        razon_social: ferreteriaToEdit.razon_social,
        direccion: ferreteriaToEdit.direccion,
        latitud: ferreteriaToEdit.latitud?.toString() || '',
        longitud: ferreteriaToEdit.longitud?.toString() || '',
        telefono: ferreteriaToEdit.telefono || '',
        api_key: ferreteriaToEdit.api_key,
        descripcion: ferreteriaToEdit.descripcion || '',
        horario: ferreteriaToEdit.horario ? JSON.stringify(ferreteriaToEdit.horario, null, 2) : '',
      });
    } else {
      setFormData({
        rut: '',
        razon_social: '',
        direccion: '',
        latitud: '',
        longitud: '',
        telefono: '',
        api_key: '',
        descripcion: '',
        horario: '',
      });
    }
    setErrors({});
  }, [ferreteriaToEdit, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    }

    if (!formData.razon_social.trim()) {
      newErrors.razon_social = 'La razón social es requerida';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'La API key es requerida';
    }

    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
    if (formData.rut.trim() && !rutRegex.test(formData.rut.trim())) {
      newErrors.rut = 'Formato de RUT inválido (ej: 12.345.678-9)';
    }

    if (formData.horario) {
      try {
        JSON.parse(formData.horario);
      } catch (error) {
        newErrors.horario = 'Formato de JSON inválido para el horario';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const ferreteriaData: Ferreteria = {
      id_ferreteria: ferreteriaToEdit?.id_ferreteria || '',
      rut: formData.rut.trim(),
      razon_social: formData.razon_social.trim(),
      direccion: formData.direccion.trim(),
      latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
      longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
      telefono: formData.telefono.trim() || undefined,
      api_key: formData.api_key.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      horario: formData.horario ? JSON.parse(formData.horario) : undefined,
    };
    onSave(ferreteriaData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{ferreteriaToEdit ? 'Editar Ferretería' : 'Añadir Ferretería'}</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="rut">RUT *</label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                className={errors.rut ? 'error' : ''}
                placeholder="12.345.678-9"
              />
              {errors.rut && <span className="error-message">{errors.rut}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="razon_social">Razón Social *</label>
              <input
                type="text"
                id="razon_social"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                className={errors.razon_social ? 'error' : ''}
                placeholder="Nombre de la empresa"
              />
              {errors.razon_social && <span className="error-message">{errors.razon_social}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección *</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className={errors.direccion ? 'error' : ''}
                placeholder="Dirección completa"
              />
              {errors.direccion && <span className="error-message">{errors.direccion}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitud">Latitud</label>
                <input
                  type="number"
                  step="any"
                  id="latitud"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleChange}
                  placeholder="-33.456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitud">Longitud</label>
                <input
                  type="number"
                  step="any"
                  id="longitud"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  placeholder="-70.648274"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Breve descripción de la ferretería"
                rows={3}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="horario">Horario (JSON)</label>
              <textarea
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                className={errors.horario ? 'error' : ''}
                placeholder='{
  "lunes": "09:00-18:00",
  "martes": "09:00-18:00",
  "miercoles": "09:00-18:00",
  "jueves": "09:00-18:00",
  "viernes": "09:00-18:00",
  "sabado": "10:00-14:00",
  "domingo": "cerrado"
}'
                rows={7}
              ></textarea>
              {errors.horario && <span className="error-message">{errors.horario}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="api_key">API Key *</label>
              <input
                type="text"
                id="api_key"
                name="api_key"
                value={formData.api_key}
                onChange={handleChange}
                className={errors.api_key ? 'error' : ''}
                placeholder="Clave única para integración"
              />
              {errors.api_key && <span className="error-message">{errors.api_key}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button-secondary">
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              {ferreteriaToEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditFerreteriaModal;