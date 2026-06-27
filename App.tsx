import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredTokens } from './src/services/spotifyService';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useSpotifyStore } from './src/store/useSpotifyStore';

export default function App() {
  useEffect(() => {
    loadStoredTokens().then(linked => {
      if (linked) {
        useSettingsStore.getState().setSpotifyLinked(true);
        useSpotifyStore.getState().setLinked(true);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
