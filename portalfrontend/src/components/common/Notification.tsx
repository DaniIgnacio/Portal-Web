// src/components/Notification.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Notification.css';

// Definición de la interfaz para una notificación
export interface NotificationProps {
  id: string; // ID único para cada notificación
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationItemProps {
  notification: NotificationProps;
  onDismiss: (id: string) => void;
  duration?: number; // Duración en milisegundos (defecto: 3000ms)
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss, duration = 3000 }) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Inicia un temporizador para ocultar la notificación automáticamente
    timerRef.current = window.setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    // Limpia el temporizador si el componente se desmonta o la notificación cambia
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification.id, onDismiss, duration]);

  // Iconos simples para cada tipo (puedes usar librerías de iconos como FontAwesome)
  const getIcon = (type: NotificationProps['type']) => {
    switch (type) {
      case 'success': return '✔️'; // Unicode checkmark
      case 'error': return '❌';   // Unicode cross
      case 'info': return 'ℹ️';    // Unicode info
      default: return '';
    }
  };

  return (
    <div className={`notification-item ${notification.type}`}>
      <span className="notification-icon">{getIcon(notification.type)}</span>
      <span className="notification-message">{notification.message}</span>
      <button onClick={() => onDismiss(notification.id)} className="notification-dismiss">✖</button>
    </div>
  );
};

// Contenedor principal para todas las notificaciones
interface NotificationContainerProps {
  notifications: NotificationProps[];
  onDismiss: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="notification-container">
      {notifications.map(notif => (
        <NotificationItem key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default NotificationContainer;