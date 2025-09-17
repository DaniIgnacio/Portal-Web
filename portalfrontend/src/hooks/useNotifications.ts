import { useState, useCallback } from 'react';
import { NotificationProps } from '../components/common/Notification'; 

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((message: string, type: NotificationProps['type']) => {
    const id = Date.now().toString(); 
    const newNotification: NotificationProps = { id, message, type };
    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  return { notifications, addNotification, dismissNotification };
};