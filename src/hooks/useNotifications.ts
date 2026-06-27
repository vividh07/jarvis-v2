import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  initNotificationService,
  relayPhoneNotification,
} from '../services/notificationService';
import { useNotificationStore } from '../store/useNotificationStore';

export const useNotifications = () => {
  const refresh = useNotificationStore(state => state.refresh);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const setup = async () => {
      await initNotificationService();
      refresh();

      if (Platform.OS === 'android') {
        removeListener = startAndroidNotificationListener();
      }
    };

    setup();

    return () => {
      removeListener?.();
    };
  }, [refresh]);
};

function startAndroidNotificationListener(): (() => void) | undefined {
  try {
    // Optional native module — works in a dev/production build, not Expo Go
    const NotificationListener = require('react-native-android-notification-listener');
    const listener = NotificationListener.default ?? NotificationListener;

    if (!listener?.addListener) {
      return undefined;
    }

    const subscription = listener.addListener((event: Record<string, string>) => {
      const app = event.app || event.packageName || 'Unknown';
      const sender = event.title || event.sender || 'Unknown';
      const body = event.text || event.bigText || event.body || '';

      if (!body && sender === 'Unknown') return;

      relayPhoneNotification({ app, sender, body });
    });

    return () => {
      if (typeof subscription?.remove === 'function') {
        subscription.remove();
      }
    };
  } catch {
    return undefined;
  }
}