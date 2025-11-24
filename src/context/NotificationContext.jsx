import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLastUpdate(null);
      return;
    }

    try {
      setIsLoading(true);
      const [allNotifs, count] = await Promise.all([
        notificationService.getAll({ limit: 50 }),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(allNotifs);
      setUnreadCount(count);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar notificaciones al iniciar y cada 30 segundos
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      
      // Polling cada 30 segundos para actualizaciones más frecuentes
      const interval = setInterval(loadNotifications, 30 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadNotifications]);

  // Marcar como leída
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Actualizar estado local
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.delete(id);
      
      // Actualizar estado local
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }, [notifications]);

  // Eliminar todas las notificaciones
  const deleteAll = useCallback(async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error eliminando todas las notificaciones:', error);
      throw error;
    }
  }, []);

  // Refrescar notificaciones
  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

