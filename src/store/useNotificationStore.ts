import { create } from 'zustand';
import { getNotifications, clearNotification, clearAll } from '../services/notificationService';

interface NotificationItem {
  id: string;
  app: string;
  sender: string;
  message: string;
  summary?: string;
  time: number;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  refresh: () => void;
  clear: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>(set => ({
  notifications: [],
  unreadCount: 0,

  refresh: () => {
    const n = getNotifications();
    set({ notifications: n, unreadCount: n.length });
  },

  clear: (id: string) => {
    clearNotification(id);
    const n = getNotifications();
    set({ notifications: n, unreadCount: n.length });
  },

  clearAll: () => {
    clearAll();
    set({ notifications: [], unreadCount: 0 });
  },
}));
