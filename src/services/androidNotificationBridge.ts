import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export const openAndroidNotificationAccess = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'Notifications',
      'On iPhone, Jarvis shows notifications sent from your Jarvis server. Use Test notification in Settings to try it.'
    );
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS'
    );
  } catch {
    Linking.openSettings();
  }
};
