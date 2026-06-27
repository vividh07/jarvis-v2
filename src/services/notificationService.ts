import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme/colors';
import { socketService } from './socketService';

export interface Notification {
  id: string;
  app: string;
  sender: string;
  message: string;
  summary?: string;
  time: number;
}

const STORAGE_KEY = '@jarvis_notifications';
const MAX_NOTIFICATIONS = 50;

let notifications: Notification[] = [];
let listeners: ((n: Notification[]) => void)[] = [];
let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const notifyListeners = () => {
  listeners.forEach(l => l([...notifications]));
};

const persistNotifications = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.warn('Failed to save notifications:', e);
  }
};

const loadNotificationsFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      notifications = parsed.slice(0, MAX_NOTIFICATIONS);
      notifyListeners();
    }
  } catch (e) {
    console.warn('Failed to load notifications:', e);
  }
};

const showLocalNotification = async (notification: Notification) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.summary
          ? `Jarvis · ${notification.app}`
          : `${notification.sender} · ${notification.app}`,
        body: notification.summary || notification.message,
        data: { id: notification.id },
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Local notification failed:', e);
  }
};

export const initNotificationService = async (): Promise<boolean> => {
  if (initialized) {
    return true;
  }
  initialized = true;

  await loadNotificationsFromStorage();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jarvis', {
      name: 'Jarvis',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: colors.purple.main,
    });
  }

  return finalStatus === 'granted';
};

export const addNotificationListener = (callback: (n: Notification[]) => void) => {
  listeners.push(callback);
  callback([...notifications]);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const getNotifications = (): Notification[] => notifications;

export const clearNotification = (id: string) => {
  notifications = notifications.filter(n => n.id !== id);
  notifyListeners();
  persistNotifications();
};

export const clearAll = () => {
  notifications = [];
  notifyListeners();
  persistNotifications();
};

export const handleIncomingNotification = async (data: any) => {
  const body = data.body || data.message || '';
  const summary = data.summary || '';
  const notification: Notification = {
    id: data.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    app: data.app || 'Unknown',
    sender: data.sender || 'Unknown',
    message: body,
    summary: summary || undefined,
    time: data.time || Date.now(),
  };

  if (notifications.some(n => n.id === notification.id)) {
    return;
  }

  notifications.unshift(notification);
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications = notifications.slice(0, MAX_NOTIFICATIONS);
  }

  notifyListeners();
  await persistNotifications();
  await showLocalNotification(notification);
};

export const relayPhoneNotification = (data: {
  app?: string;
  sender?: string;
  body?: string;
}) => {
  if (!socketService.isConnected()) return;
  socketService.send('phone_notification', {
    app: data.app || 'Unknown',
    sender: data.sender || 'Unknown',
    body: data.body || '',
  });
};

export const isCallNotification = (packageName: string): boolean => {
  const callApps = ['com.android.dialer', 'com.google.android.dialer', 'com.samsung.android.incallui'];
  return callApps.some(app => packageName.includes(app));
};

export const handleIncomingCallNotification = (data: any) => {
  if (isCallNotification(data.packageName || '')) {
    const callerName = data.sender || 'Unknown';
    socketService.send('incoming_call', { caller: callerName });
  }
};
