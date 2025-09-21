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

    // Validar formato RUT chileno básico
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/;
    if (formData.rut.trim() && !rutRegex.test(formData.rut.trim())) {
      newErrors.rut = 'Formato de RUT inválido (ej: 12.345.678-9)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const ferreteriaData: Ferreteria = {
      id_ferreteria: ferreteriaToEdit?.id_ferreteria || '',
      rut: formData.rut.trim(),
      razon_social: formData.razon_social.trim(),
      direccion: formData.direccion.trim(),
      latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
      longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
      telefono: formData.telefono.trim() || undefined,
      api_key: formData.api_key.trim(),
    };

    onSave(ferreteriaData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{ferreteriaToEdit ? 'Editar Ferretería' : 'Añadir Nueva Ferretería'}</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ferreteria-form">
          <div className="form-row">
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="save-button">
              {ferreteriaToEdit ? 'Actualizar' : 'Crear'} Ferretería
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditFerreteriaModal;
