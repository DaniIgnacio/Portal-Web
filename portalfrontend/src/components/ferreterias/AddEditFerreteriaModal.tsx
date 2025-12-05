// src/components/ferreterias/AddEditFerreteriaModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Ferreteria } from './FerreteriaList';
import { dayOrder, parseHorarioInput, shortDayNames } from '../../utils/horarioUtils';
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
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const diasSemana = dayOrder;
  const emptyHorario = useMemo(
    () =>
      diasSemana.reduce(
        (acc, dia) => {
          acc[dia] = { apertura: '', cierre: '' };
          return acc;
        },
        {} as Record<string, { apertura: string; cierre: string }>
      ),
    [diasSemana]
  );
  const [horarioDias, setHorarioDias] = useState<Record<string, { apertura: string; cierre: string }>>(emptyHorario);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const baseHorario = emptyHorario;
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
      });

      const parsedHorario = parseHorarioInput(ferreteriaToEdit.horario);
      const nextHorario = { ...emptyHorario };
      if (parsedHorario) {
        for (const dia of diasSemana) {
          const rango = parsedHorario[dia];
          if (typeof rango === 'string') {
            const [apertura, cierre] = rango.split('-').map((value: string) => value?.trim() || '');
            if (apertura && cierre) {
              nextHorario[dia] = { apertura, cierre };
            } else {
              nextHorario[dia] = { apertura: '', cierre: '' };
            }
          }
        }
      } else if (typeof ferreteriaToEdit.horario === 'string' && ferreteriaToEdit.horario.trim() !== '') {
        // Single string (legacy). Apply to all days as opening hours if format valid.
        const [apertura, cierre] = ferreteriaToEdit.horario.split('-').map((value: string) => value?.trim() || '');
        if (apertura && cierre) {
          for (const dia of diasSemana) {
            nextHorario[dia] = { apertura, cierre };
          }
        }
      }
      setHorarioDias(nextHorario);
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
      });
      setHorarioDias(baseHorario);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    let horarioError = '';
    let hasAtLeastOneDay = false;
    diasSemana.forEach((dia) => {
      const { apertura, cierre } = horarioDias[dia];
      if ((apertura && !cierre) || (!apertura && cierre)) {
        horarioError = `Completa ambos horarios de ${dia} o déjalo vacío.`;
      }
      if (apertura && cierre) {
        hasAtLeastOneDay = true;
        if (apertura >= cierre && !horarioError) {
          horarioError = `En ${dia} la hora de apertura debe ser menor que la de cierre.`;
        }
      }
    });
    if (!horarioError && !hasAtLeastOneDay) {
      horarioError = 'Configura el horario de al menos un día.';
    }
    if (horarioError) newErrors.horario = horarioError;

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
      horario: (() => {
        const horarioPayload: Record<string, string> = {};
        diasSemana.forEach((dia) => {
          const { apertura, cierre } = horarioDias[dia];
          if (apertura && cierre) {
            horarioPayload[dia] = `${apertura}-${cierre}`;
          }
        });
        return Object.keys(horarioPayload).length > 0 ? horarioPayload : undefined;
      })(),
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

  const horarioPreview = useMemo(() => {
    const items: { etiqueta: string; rango: string }[] = [];
    diasSemana.forEach((dia) => {
      const { apertura, cierre } = horarioDias[dia];
      if (apertura && cierre) {
        items.push({
          etiqueta: shortDayNames[dia] || dia.charAt(0).toUpperCase() + dia.slice(1),
          rango: `${apertura} - ${cierre}`,
        });
      }
    });
    return items;
  }, [diasSemana, horarioDias]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{ferreteriaToEdit ? 'Editar Ferretería' : 'Añadir Ferretería'}</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="modal-form">
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

            <div className="form-group horario-group">
              <label>Horario de atención</label>
              <p className="horario-hint">Selecciona las horas de apertura y cierre por día. Deja vacío si la tienda está cerrada.</p>
              <div className="horario-grid">
                {diasSemana.map((dia) => (
                  <div className="horario-item" key={dia}>
                    <div className="horario-day">{dia.charAt(0).toUpperCase() + dia.slice(1)}</div>
                    <div className="horario-inputs">
                      <div className="horario-input">
                        <span>Apertura</span>
                        <input
                          type="time"
                          value={horarioDias[dia].apertura}
                          onChange={(e) =>
                            setHorarioDias((prev) => ({
                              ...prev,
                              [dia]: { ...prev[dia], apertura: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="horario-input">
                        <span>Cierre</span>
                        <input
                          type="time"
                          value={horarioDias[dia].cierre}
                          onChange={(e) =>
                            setHorarioDias((prev) => ({
                              ...prev,
                              [dia]: { ...prev[dia], cierre: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.horario && <span className="error-message horario-error">{errors.horario}</span>}
              <div className="horario-preview-card">
                <h4>Vista rápida</h4>
                {horarioPreview.length > 0 ? (
                  <ul>
                    {horarioPreview.map(({ etiqueta, rango }) => (
                      <li key={etiqueta}>
                        <span>{etiqueta}</span>
                        <strong>{rango}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="horario-empty">Configura al menos un día para ver el resumen.</p>
                )}
              </div>
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