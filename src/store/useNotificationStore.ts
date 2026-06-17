import { create } from 'zustand';
import { Notification as NotificationType } from '../types';
import { storage } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  notifications: NotificationType[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (userId: string) => void;
  markAsRead: (id: string, userId: string) => void;
  markAllAsRead: (userId: string) => void;
  addNotification: (notification: Omit<NotificationType, 'id' | 'read' | 'createdAt'>) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: (userId) => {
    set({ loading: true });
    const all = storage.getNotifications();
    const userNotifications = all.filter(n => n.userId === userId);
    const unread = userNotifications.filter(n => !n.read).length;
    set({ notifications: userNotifications, unreadCount: unread, loading: false });
  },

  markAsRead: (id, userId) => {
    const notifications = storage.getNotifications();
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    storage.saveNotifications(updated);
    get().fetchNotifications(userId);
  },

  markAllAsRead: (userId) => {
    const notifications = storage.getNotifications();
    const updated = notifications.map(n =>
      n.userId === userId ? { ...n, read: true } : n
    );
    storage.saveNotifications(updated);
    get().fetchNotifications(userId);
  },

  addNotification: (notificationData) => {
    const notification: NotificationType = {
      id: uuidv4(),
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
    };
    storage.addNotification(notification);
    
    if (typeof window !== 'undefined' && 'Notification' in window && 
        window.Notification.permission === 'granted' && notificationData.type === 'urgent') {
      new window.Notification(notificationData.title, {
        body: notificationData.content,
      });
    }
    
    get().fetchNotifications(notificationData.userId);
  },
}));
