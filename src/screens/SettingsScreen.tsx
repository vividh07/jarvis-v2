import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useJarvisStore } from '../store/useJarvisStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { AI_PROVIDERS } from '../services/aiService';
import { socketService } from '../services/socketService';
import { openAndroidNotificationAccess } from '../services/androidNotificationBridge';
import { linkSpotify, unlinkSpotify } from '../services/spotifyService';
import { useSpotifyStore } from '../store/useSpotifyStore';
import FactsScreen from './FactsScreen';
import ContactsScreen from './ContactsScreen';

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};

function SectionHeader({ label, accentColor }: { label: string; accentColor?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionAccent, accentColor ? { backgroundColor: accentColor } : null]} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function IconCircle({ emoji, tint }: { emoji: string; tint?: string }) {
  return (
    <View style={[styles.iconCircle, tint ? { backgroundColor: tint } : null]}>
      <Text style={styles.iconCircleText}>{emoji}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const connected = useJarvisStore(state => state.connected);
  const {
    agentName,
    userName,
    spotifyLinked,
    briefingTime,
    aiProvider,
    setAgentName,
    setUserName,
    setSpotifyLinked,
    setBriefingTime,
    setAIProvider,
  } = useSettingsStore();
  const setConnected = useJarvisStore(state => state.setConnected);

  const [linkingSpotify, setLinkingSpotify] = useState(false);
  const [editingAgent, setEditingAgent] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [tempAgent, setTempAgent] = useState(agentName);
  const [tempUser, setTempUser] = useState(userName);
  const [showFacts, setShowFacts] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const handleRestart = () => {
    Alert.alert('Restart Jarvis', 'Are you sure you want to restart Jarvis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restart',
        style: 'destructive',
        onPress: () => socketService.send('command', { action: 'restart' }),
      },
    ]);
  };

  const handleSleep = () => {
    Alert.alert('Deep Sleep', 'Jarvis will go to sleep. Wake him up from this app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sleep',
        style: 'destructive',
        onPress: () => socketService.send('command', { action: 'sleep' }),
      },
    ]);
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect from Jarvis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => setConnected(false),
      },
    ]);
  };

  const handleClearMemory = () => {
    Alert.alert('Clear Memory', 'This will erase all conversation history. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => socketService.send('clear_memory', {}),
      },
    ]);
  };

  const handleSetBriefingTime = () => {
    Alert.prompt(
      'Morning Briefing Time',
      'Enter time in 24hr format (e.g. 08:00)',
      time => {
        if (time) {
          setBriefingTime(time);
          socketService.send('set_briefing_time', { time });
        }
      },
      'plain-text',
      briefingTime
    );
  };

  const handleSpotifyLink = async () => {
    if (spotifyLinked) {
      Alert.alert('Unlink Spotify', 'Disconnect your Spotify account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            await unlinkSpotify();
            setSpotifyLinked(false);
            useSpotifyStore.getState().setLinked(false);
          },
        },
      ]);
      return;
    }

    setLinkingSpotify(true);
    try {
      const success = await linkSpotify();
      if (success) {
        setSpotifyLinked(true);
        useSpotifyStore.getState().setLinked(true);
        useSpotifyStore.getState().fetchTrack();
      } else {
        Alert.alert('Spotify', 'Could not link account. Check redirect URI in Spotify Dashboard.');
      }
    } finally {
      setLinkingSpotify(false);
    }
  };

  const handleTestNotification = () => {
    if (!socketService.isConnected()) {
      Alert.alert('Not connected', 'Connect to Jarvis on the home screen first.');
      return;
    }
    socketService.send('test_notification', {});
    Alert.alert('Sent', 'Jarvis will show and read a test notification.');
  };

  const handleNotificationAccess = () => {
    openAndroidNotificationAccess();
  };

  if (showFacts) {
    return <FactsScreen onBack={() => setShowFacts(false)} />;
  }

  if (showContacts) {
    return <ContactsScreen onBack={() => setShowContacts(false)} />;
  }

  const activeModel = AI_PROVIDERS.find(a => a.provider === aiProvider)?.name || 'Groq · Llama 3.3 70B';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>Preferences</Text>
          <Text style={styles.heroTitle}>Settings</Text>
          <Text style={styles.heroSub}>Tune {agentName} for {userName}</Text>
          <View style={styles.heroPills}>
            <View style={[styles.pill, connected ? styles.pillOnline : styles.pillOffline]}>
              <View style={[styles.pillDot, { backgroundColor: connected ? colors.green : colors.text.muted }]} />
              <Text style={styles.pillText}>{connected ? 'Connected' : 'Disconnected'}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>🧠 {activeModel}</Text>
            </View>
          </View>
        </View>

        {/* Identity */}
        <SectionHeader label="Identity" />
        <View style={styles.cardGroup}>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🤖" tint={colors.surface.purple} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Agent name</Text>
                  {!editingAgent && <Text style={styles.settingValue}>{agentName}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editPill}
                onPress={() => {
                  if (editingAgent) {
                    setAgentName(tempAgent);
                    setEditingAgent(false);
                  } else {
                    setEditingAgent(true);
                  }
                }}
              >
                <Text style={styles.editPillText}>{editingAgent ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            {editingAgent && (
              <TextInput
                style={styles.inlineInput}
                value={tempAgent}
                onChangeText={setTempAgent}
                placeholder="Enter agent name"
                placeholderTextColor={colors.text.muted}
                autoFocus
              />
            )}
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="👤" tint={colors.surface.blue} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Your name</Text>
                  {!editingUser && <Text style={styles.settingValue}>{userName}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editPill}
                onPress={() => {
                  if (editingUser) {
                    setUserName(tempUser);
                    setEditingUser(false);
                  } else {
                    setEditingUser(true);
                  }
                }}
              >
                <Text style={styles.editPillText}>{editingUser ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            {editingUser && (
              <TextInput
                style={styles.inlineInput}
                value={tempUser}
                onChangeText={setTempUser}
                placeholder="Enter your name"
                placeholderTextColor={colors.text.muted}
                autoFocus
              />
            )}
          </View>

          <TouchableOpacity style={styles.settingCard} onPress={() => setShowFacts(true)}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🧠" tint={colors.surface.purple} />
                <Text style={styles.settingTitle}>What Jarvis remembers</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} onPress={() => setShowContacts(true)}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="📇" tint={colors.surface.green} />
                <Text style={styles.settingTitle}>Jarvis contacts</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Model */}
        <SectionHeader label="AI model" />
        <View style={styles.cardGroup}>
          {AI_PROVIDERS.map(ai => {
            const active = aiProvider === ai.provider;
            return (
              <TouchableOpacity
                key={ai.provider}
                style={[styles.settingCard, active && styles.settingCardActive]}
                onPress={() => setAIProvider(ai.provider)}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <IconCircle emoji={ai.icon} tint={active ? colors.surface.purple : undefined} />
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{ai.name}</Text>
                      <Text style={styles.settingValue}>{ai.description}</Text>
                    </View>
                  </View>
                  {active && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Proactive */}
        <SectionHeader label="Proactive" accentColor={colors.amber} />
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.settingCard} onPress={handleSetBriefingTime}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🌅" tint={colors.surface.amber} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Morning briefing</Text>
                  <Text style={styles.settingValue}>Daily at {briefingTime}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <SectionHeader label="Notifications" />
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.settingCard} onPress={handleTestNotification}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🔔" tint={colors.surface.purple} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Test notification</Text>
                  <Text style={styles.settingValue}>Sample alert via Jarvis</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} onPress={handleNotificationAccess}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="📱" tint={colors.surface.blue} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Phone notification access</Text>
                  <Text style={styles.settingValue}>Android: mirror WhatsApp & SMS</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Connection */}
        <SectionHeader label="Connection" accentColor={colors.spotify} />
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={handleSpotifyLink}
            disabled={linkingSpotify}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🎵" tint={colors.surface.green} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Spotify account</Text>
                  <Text style={[styles.settingValue, spotifyLinked && styles.settingValueLinked]}>
                    {linkingSpotify ? 'Linking...' : spotifyLinked ? '✓ Linked' : 'Tap to link'}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} onPress={handleDisconnect}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="📶" tint={colors.surface.red} />
                <Text style={styles.settingTitle}>Disconnect from Jarvis</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Device */}
        <SectionHeader label="Device" />
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.settingCard} onPress={handleClearMemory}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🧹" />
                <Text style={styles.settingTitle}>Clear memory</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard} onPress={handleRestart}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🔄" />
                <Text style={styles.settingTitle}>Restart Jarvis</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingCard, styles.dangerCard]} onPress={handleSleep}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <IconCircle emoji="🌙" tint={colors.surface.red} />
                <Text style={[styles.settingTitle, styles.dangerText]}>Deep sleep</Text>
              </View>
              <Text style={[styles.chevron, styles.dangerText]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionHeader label="About" />
        <View style={[styles.settingCard, styles.aboutCard]}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Agent</Text>
            <Text style={styles.aboutValue}>{agentName}</Text>
          </View>
          <View style={styles.aboutDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Model</Text>
            <Text style={styles.aboutValue}>{activeModel}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scrollContent: { padding: spacing.md, gap: spacing.sm },
  heroCard: {
    backgroundColor: colors.bg.jarvis,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.purple.dark,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.purple.main,
    opacity: 0.12,
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.accent.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  heroPills: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.border.glow,
  },
  pillOnline: { borderColor: 'rgba(52, 211, 153, 0.45)' },
  pillOffline: {},
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.purple.mid,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: typography.weights.medium,
  },
  cardGroup: { gap: spacing.sm },
  settingCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 14,
    overflow: 'hidden',
    ...cardShadow,
  },
  settingCardActive: {
    borderColor: colors.purple.main,
    backgroundColor: colors.bg.jarvis,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  settingText: { flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleText: { fontSize: 18 },
  settingTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  settingValue: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  settingValueLinked: { color: colors.spotify },
  editPill: {
    backgroundColor: colors.purple.main,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editPillText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  inlineInput: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 44,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.purple.main,
  },
  chevron: { fontSize: 22, color: colors.text.muted, fontWeight: '300' },
  activeBadge: {
    backgroundColor: colors.purple.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerCard: { borderColor: 'rgba(248, 113, 113, 0.4)' },
  dangerText: { color: colors.red },
  aboutCard: { padding: spacing.md },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  aboutLabel: { fontSize: typography.sizes.sm, color: colors.text.muted },
  aboutValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.bold,
  },
});
