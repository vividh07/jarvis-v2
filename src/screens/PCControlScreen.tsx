import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { socketService } from '../services/socketService';

const APP_ICONS: Record<string, string> = {
  spotify: '🎵',
  chrome: '🌐',
  vscode: '💻',
  steam: '🎮',
  discord: '💬',
  notepad: '📝',
  calculator: '🔢',
};

export default function PCControlScreen({ onBack }: { onBack: () => void }) {
  const [apps, setApps] = useState<string[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);

  useEffect(() => {
    socketService.send('get_apps', {});

    const handleAppsList = (data: any) => {
      setApps(data.apps || []);
    };

    socketService.on('apps_list', handleAppsList);
    return () => socketService.off('apps_list', handleAppsList);
  }, []);

  const launchApp = (appName: string) => {
    setLaunching(appName);
    socketService.send('launch_app', { app: appName });
    setTimeout(() => setLaunching(null), 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PC Remote Control</Text>
        <Text style={styles.headerSub}>Tap to open on your PC</Text>
      </View>

      <FlatList
        data={apps}
        keyExtractor={item => item}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.appCard}
            onPress={() => launchApp(item)}
            disabled={launching === item}
          >
            {launching === item ? (
              <ActivityIndicator color={colors.purple.mid} />
            ) : (
              <>
                <Text style={styles.appIcon}>{APP_ICONS[item] || '📦'}</Text>
                <Text style={styles.appName}>{item}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    padding: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  backBtn: { fontSize: typography.sizes.sm, color: colors.purple.mid, marginBottom: spacing.sm },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text.primary },
  headerSub: { fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 },
  grid: { padding: spacing.md },
  appCard: {
    flex: 1,
    aspectRatio: 1,
    margin: spacing.xs,
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  appIcon: { fontSize: 28 },
  appName: { fontSize: typography.sizes.xs, color: colors.text.secondary, textTransform: 'capitalize' },
});
