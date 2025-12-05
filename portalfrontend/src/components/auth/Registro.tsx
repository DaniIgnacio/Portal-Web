// src/pages/Registro.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForm.css';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationContainer from '../common/Notification';
import usePasswordStrength from '../../hooks/usePasswordStrength';
import { supabase } from '../../supabaseClient';
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.25 12s3.75-6.75 9.75-6.75 9.75 6.75 9.75 6.75-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3.98 8.223C3.352 9.22 3 10.346 3 11.5c0 4.142 3.357 7.499 7.5 7.499 1.154 0 2.28-.352 3.277-.98m3.243-2.19c.622-.99.98-2.11.98-3.33 0-4.142-3.358-7.5-7.5-7.5-1.22 0-2.34.358-3.33.98" />
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path d="M21 21 3 3" />
  </svg>
);
interface RegistroProps {
  onRegisterSuccess: () => void;
}

const STEPS = [
  {
    id: 'usuario',
    title: 'Datos de Usuario',
    description: 'Completa la información personal para la cuenta principal.',
  },
  {
    id: 'ferreteria',
    title: 'Datos de la Ferretería',
    description: 'Describe tu negocio y cómo podemos contactarte.',
  },
  {
    id: 'horario',
    title: 'Horario y Confirmación',
    description: 'Define horarios y revisa el resumen antes de registrar.',
  },
];

let googleMapsScriptPromise: Promise<void> | null = null;

const loadGoogleMapsApi = (apiKey: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  const google = (window as any).google;
  if (google?.maps) return Promise.resolve();

  if (!apiKey) {
    return Promise.reject(new Error('No se ha configurado la clave de Google Maps.'));
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const scriptId = 'google-maps-script';
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => {
          googleMapsScriptPromise = null;
          reject(new Error('No se pudo cargar Google Maps.'));
        });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        googleMapsScriptPromise = null;
        reject(new Error('No se pudo cargar Google Maps.'));
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
};

const Registro: React.FC<RegistroProps> = ({ onRegisterSuccess }) => {
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [rutUsuario, setRutUsuario] = useState<string>('');
  const [rut, setRut] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const [horarioDias, setHorarioDias] = useState<{ [key: string]: { apertura: string; cierre: string } }>(
    diasSemana.reduce((acc, dia) => {
      acc[dia] = { apertura: '', cierre: '' };
      return acc;
    }, {} as { [key: string]: { apertura: string; cierre: string } })
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -33.4489,
    lng: -70.6693,
  });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapClickListenerRef = useRef<any>(null);
  const markerDragListenerRef = useRef<any>(null);
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  
  const passwordStrength = usePasswordStrength(password);
  const strengthVariant = passwordStrength.strength.toLowerCase();
  const currentStepConfig = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isPasswordWeak =
    passwordStrength.strength === 'Débil' ||
    !passwordStrength.isLongEnough ||
    password.length === 0;
  const isPasswordMismatch = password !== confirmPassword;
  const isPasswordGuard = isPasswordWeak || isPasswordMismatch;
  const passwordRequirements = useMemo(
    () => [
      { label: 'Al menos 8 caracteres', met: passwordStrength.isLongEnough },
      { label: 'Una letra mayúscula', met: passwordStrength.hasUpperCase },
      { label: 'Una letra minúscula', met: passwordStrength.hasLowerCase },
      { label: 'Un número', met: passwordStrength.hasNumber },
      { label: 'Un símbolo (!@#$...)', met: passwordStrength.hasSymbol },
    ],
    [
      passwordStrength.hasLowerCase,
      passwordStrength.hasNumber,
      passwordStrength.hasSymbol,
      passwordStrength.hasUpperCase,
      passwordStrength.isLongEnough,
    ]
  );
  const mapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? '';

  const horarioPreview = useMemo(
    () =>
      diasSemana
        .map((dia) => {
          const apertura = horarioDias[dia].apertura;
          const cierre = horarioDias[dia].cierre;
          if (!apertura || !cierre) return null;
          return {
            etiqueta: dia.charAt(0).toUpperCase() + dia.slice(1),
            rango: `${apertura} - ${cierre}`,
          };
        })
        .filter((item): item is { etiqueta: string; rango: string } => item !== null),
    [horarioDias, diasSemana]
  );

  const apiKeyPreview = useMemo(() => {
    if (!apiKey) return 'N/D';
    if (apiKey.length <= 12) return apiKey;
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
  }, [apiKey]);

  useEffect(() => {
    const latNum = parseFloat(latitud);
    const lngNum = parseFloat(longitud);

    if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
      const next = { lat: latNum, lng: lngNum };
      setMapCenter(next);
      setMarkerPosition(next);
    } else if (latitud === '' && longitud === '') {
      setMarkerPosition(null);
      setMapCenter({ lat: -33.4489, lng: -70.6693 });
    }
  }, [latitud, longitud]);

  useEffect(() => {
    if (!mapsApiKey) {
      setMapReady(false);
      setMapError('Configura REACT_APP_GOOGLE_MAPS_API_KEY para habilitar Google Maps.');
      return;
    }

    setMapError(null);
    setMapReady(false);

    let isCancelled = false;

    loadGoogleMapsApi(mapsApiKey)
      .then(() => {
        if (!isCancelled) {
          setMapReady(true);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setMapError(error.message);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mapsApiKey]);

  const handleMapClick = useCallback(
    (event: any) => {
      if (event?.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setLatitud(lat.toFixed(6));
        setLongitud(lng.toFixed(6));
        const next = { lat, lng };
        setMarkerPosition(next);
        setMapCenter(next);
      }
    },
    []
  );

  const handleMarkerDragEnd = useCallback((event: any) => {
    if (event?.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setLatitud(lat.toFixed(6));
      setLongitud(lng.toFixed(6));
      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });
    }
  }, []);

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current) {
      return;
    }

    const google = (window as any).google;
    if (!google?.maps) {
      setMapError('No se pudo inicializar Google Maps.');
      return;
    }

    const map = new google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: markerPosition ? 16 : 12,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      minZoom: 4,
    });

    mapInstanceRef.current = map;

    mapClickListenerRef.current = map.addListener('click', handleMapClick);

    if (markerPosition) {
      markerRef.current = new google.maps.Marker({
        position: markerPosition,
        map,
        draggable: true,
      });
      markerDragListenerRef.current = markerRef.current.addListener('dragend', handleMarkerDragEnd);
    }

    return () => {
      if (mapClickListenerRef.current) {
        mapClickListenerRef.current.remove();
        mapClickListenerRef.current = null;
      }
      if (markerDragListenerRef.current) {
        markerDragListenerRef.current.remove();
        markerDragListenerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [mapReady, handleMapClick, handleMarkerDragEnd]);

  useEffect(() => {
    if (!mapReady || currentStep !== 1 || !mapContainerRef.current) {
      return;
    }

    const google = (window as any).google;
    if (!google?.maps) {
      setMapError('No se pudo inicializar Google Maps.');
      return;
    }

    const map = new google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: markerPosition ? 16 : 12,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      minZoom: 4,
    });

    mapInstanceRef.current = map;

    mapClickListenerRef.current = map.addListener('click', handleMapClick);

    if (markerPosition) {
      markerRef.current = new google.maps.Marker({
        position: markerPosition,
        map,
        draggable: true,
      });
      markerDragListenerRef.current = markerRef.current.addListener('dragend', handleMarkerDragEnd);
    }

    return () => {
      if (mapClickListenerRef.current) {
        mapClickListenerRef.current.remove();
        mapClickListenerRef.current = null;
      }
      if (markerDragListenerRef.current) {
        markerDragListenerRef.current.remove();
        markerDragListenerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [mapReady, currentStep, handleMapClick, handleMarkerDragEnd]);

  useEffect(() => {
    if (!mapReady || currentStep !== 1 || !mapInstanceRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const map = mapInstanceRef.current;
    map.panTo(mapCenter);

    if (markerPosition) {
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: markerPosition,
          map,
          draggable: true,
        });
        markerDragListenerRef.current = markerRef.current.addListener('dragend', handleMarkerDragEnd);
      } else {
        markerRef.current.setPosition(markerPosition);
        markerRef.current.setMap(map);
      }
      map.setZoom(16);
    } else if (markerRef.current) {
      if (markerDragListenerRef.current) {
        markerDragListenerRef.current.remove();
        markerDragListenerRef.current = null;
      }
      markerRef.current.setMap(null);
      markerRef.current = null;
      map.setZoom(12);
    }
  }, [mapReady, currentStep, mapCenter, markerPosition, handleMarkerDragEnd]);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: {
        if (!nombre.trim() || !email.trim() || !rutUsuario.trim()) {
          addNotification('Completa todos los datos del usuario antes de continuar.', 'error');
          return false;
        }
        if (isPasswordMismatch) {
          addNotification('Las contraseñas deben coincidir para continuar.', 'error');
          return false;
        }
        if (isPasswordWeak) {
          addNotification('Mejora la fortaleza de la contraseña para continuar.', 'error');
          return false;
        }
        return true;
      }
      case 1: {
        if (!rut.trim() || !razonSocial.trim() || !direccion.trim() || !apiKey.trim()) {
          addNotification('Completa los datos obligatorios de la ferretería.', 'error');
          return false;
        }
        return true;
      }
      case 2: {
        let hasAtLeastOneDay = false;
        for (const dia of diasSemana) {
          const { apertura, cierre } = horarioDias[dia];
          if ((apertura && !cierre) || (!apertura && cierre)) {
            addNotification(`Completa ambos horarios de ${dia} o déjalo vacío.`, 'error');
            return false;
          }
          if (apertura && cierre) {
            hasAtLeastOneDay = true;
            if (apertura >= cierre) {
              addNotification(`En ${dia} la hora de apertura debe ser menor que la de cierre.`, 'error');
              return false;
            }
          }
        }
        if (!hasAtLeastOneDay) {
          addNotification('Configura el horario de al menos un día.', 'error');
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    if (!isLastStep) {
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message && authError.message.toLowerCase().includes('already registered')) {
          addNotification('Este correo ya tiene una cuenta. Por favor, inicia sesión para registrar tu ferretería.', 'info');
          navigate('/login');
          return;
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener el usuario de Supabase Auth después del registro.');
      }

      const supabaseAuthId = authData.user.id;

      const horarioJson: { [key: string]: string } = {};
      diasSemana.forEach((dia) => {
        const apertura = horarioDias[dia].apertura;
        const cierre = horarioDias[dia].cierre;
        if (apertura && cierre) {
          horarioJson[dia] = `${apertura}-${cierre}`;
        }
      });

      const registerDataToBackend = {
        supabase_auth_id: supabaseAuthId,
        nombre,
        email,
        password,
        rut_usuario: rutUsuario,
        rut,
        razon_social: razonSocial,
        direccion,
        latitud: latitud === '' ? undefined : latitud,
        longitud: longitud === '' ? undefined : longitud,
        telefono: telefono === '' ? undefined : telefono,
        api_key: apiKey,
        descripcion: descripcion === '' ? undefined : descripcion,
        horario: horarioJson,
      };

      const response = await fetch('http://localhost:5000/api/register-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerDataToBackend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario y ferretería en el backend.');
      }

      onRegisterSuccess();
      addNotification('¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
    } catch (error: any) {
      console.error('Error en el registro:', error);
      addNotification(`Error de registro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-page">
      <div className="register-wizard">
        <div className="wizard-progress">
          {STEPS.map((step, index) => {
            const status =
              index === currentStep ? 'is-active' : index < currentStep ? 'is-complete' : '';
            return (
              <div key={step.id} className={`progress-step ${status}`}>
                <div className="progress-circle">{index + 1}</div>
                <div className="progress-text">
                  <span>{step.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        <header className="wizard-step-header">
          <h2>{currentStepConfig.title}</h2>
          <p>{currentStepConfig.description}</p>
        </header>

        <form className="wizard-form" onSubmit={handleRegister}>
          {currentStep === 0 && (
            <section className="register-section wizard-section">
              <header className="section-header">
                <span className="section-tag">Paso 1</span>
                <div>
                  <h3>Credenciales principales</h3>
                  <p>Introduce la información personal del administrador de la cuenta.</p>
                </div>
              </header>
              <div className="section-body form-grid form-grid-two">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-with-action">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-action-button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                    </button>
                  </div>
                  <div className="password-strength-feedback">
                    <div className="strength-header">
                      <div>
                        <span className="strength-title">Fortaleza de la contraseña</span>
                        <p className="strength-subtitle">Cumple los requisitos para proteger tu cuenta.</p>
                      </div>
                      <span className={`strength-pill strength-${strengthVariant}`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="strength-progress">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={`progress-segment${index < passwordStrength.score ? ` is-filled strength-${strengthVariant}` : ''}`}
                        />
                      ))}
                    </div>
                    <p className="strength-summary">
                      {passwordRequirements.map((requirement, index) => {
                        const prefix = `${index + 1}.`;
                        const status = requirement.met ? 'Listo' : 'Pendiente';
                        return (
                          <span
                            key={requirement.label}
                            className={`summary-item ${requirement.met ? 'fulfilled' : ''}`}
                          >
                            <strong>{prefix}</strong> {requirement.label} <em>({status})</em>
                            {index < passwordRequirements.length - 1 ? ' · ' : ''}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="input-with-action">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-action-button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    >
                      {showConfirmPassword ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <span className="input-error">Las contraseñas no coinciden.</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="rutUsuario">RUT del Usuario</label>
                  <input
                    id="rutUsuario"
                    type="text"
                    placeholder="Ej: 12.345.678-9"
                    value={rutUsuario}
                    onChange={(e) => setRutUsuario(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {currentStep === 1 && (
            <section className="register-section wizard-section">
              <header className="section-header">
                <span className="section-tag">Paso 2</span>
                <div>
                  <h3>Información de la ferretería</h3>
                  <p>Cuéntanos sobre tu negocio y cómo podemos ubicarlo.</p>
                </div>
              </header>
              <div className="section-body form-grid form-grid-two">
                <div className="form-group">
                  <label htmlFor="rut">RUT de la Ferretería</label>
                  <input
                    id="rut"
                    type="text"
                    placeholder="Ej: 12.345.678-9"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="razonSocial">Razón Social</label>
                  <input
                    id="razonSocial"
                    type="text"
                    placeholder="Nombre de tu ferretería"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="Dirección de la ferretería"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group span-2">
                  <label>Ubicación en el mapa</label>
                  <div className="map-wrapper">
                    <p className="map-instruction">
                      Haz clic o arrastra el marcador para fijar la ubicación y rellenar latitud/longitud.
                    </p>
                    {mapError ? (
                      <div className="map-loading map-error">{mapError}</div>
                    ) : mapReady ? (
                      <div ref={mapContainerRef} className="register-map" />
                    ) : (
                      <div className="map-loading">Cargando mapa...</div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="latitud">Latitud </label>
                  <input
                    id="latitud"
                    type="number"
                    step="any"
                    placeholder="Ej: -33.456789"
                    value={latitud}
                    onChange={(e) => setLatitud(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="longitud">Longitud </label>
                  <input
                    id="longitud"
                    type="number"
                    step="any"
                    placeholder="Ej: -70.648274"
                    value={longitud}
                    onChange={(e) => setLongitud(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono </label>
                  <input
                    id="telefono"
                    type="tel"
                    placeholder="Ej: +56 9 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apiKey">API Key</label>
                  <input
                    id="apiKey"
                    type="text"
                    placeholder="Clave única para tu ferretería"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="descripcion">Descripción (Opcional)</label>
                  <textarea
                    id="descripcion"
                    placeholder="Breve descripción de la ferretería"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <div className="wizard-columns">
              <section className="register-section wizard-section">
                <header className="section-header">
                  <span className="section-tag">Paso 3</span>
                  <div>
                    <h3>Horarios de atención</h3>
                    <p>Configura la disponibilidad semanal antes de finalizar el registro.</p>
                  </div>
                </header>
                <div className="section-body">
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
                </div>
              </section>

              <aside className="wizard-summary">
                <div className="sidebar-card highlight">
                  <h4>Resumen del registro</h4>
                  <p>Confirma que los datos sean correctos antes de finalizar.</p>
                  <div className="summary-grid">
                    <div>
                      <span className="summary-label">Nombre</span>
                      <span className="summary-value">{nombre || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="summary-label">Correo</span>
                      <span className="summary-value">{email || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="summary-label">RUT Usuario</span>
                      <span className="summary-value">{rutUsuario || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="summary-label">Ferretería</span>
                      <span className="summary-value">{razonSocial || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="summary-label">RUT Ferretería</span>
                      <span className="summary-value">{rut || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="summary-label">API Key</span>
                      <span className="summary-value">{apiKeyPreview}</span>
                    </div>
                  </div>
                  <div className={`strength-chip strength-${passwordStrength.strength.toLowerCase()}`}>
                    Contraseña: {passwordStrength.strength}
                  </div>
                </div>

                <div className="sidebar-card">
                  <h4>Horario configurado</h4>
                  {horarioPreview.length > 0 ? (
                    <ul className="horario-preview">
                      {horarioPreview.map(({ etiqueta, rango }) => (
                        <li key={etiqueta}>
                          <span>{etiqueta}</span>
                          <strong>{rango}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Completa al menos un día para ver el resumen.</p>
                  )}
                  <small className="preview-hint">
                    Puedes dejar días vacíos para marcarlos como cerrados.
                  </small>
                </div>
              </aside>
            </div>
          )}

          <div className="wizard-actions">
            {currentStep > 0 && (
              <button
                type="button"
                className="wizard-button secondary"
                onClick={handlePrevStep}
                disabled={loading}
              >
                Volver
              </button>
            )}
            <button
              type="submit"
              className="wizard-button primary"
              disabled={loading || (currentStep === 0 && isPasswordGuard)}
            >
              {isLastStep ? (loading ? 'Registrando...' : 'Finalizar registro') : 'Continuar'}
            </button>
          </div>
        </form>

        <div className="wizard-footer">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>

        <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      </div>
    </div>
  );
};

export default Registro;