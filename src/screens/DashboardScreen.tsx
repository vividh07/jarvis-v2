import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useJarvisStore } from '../store/useJarvisStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWeatherStore } from '../store/useWeatherStore';
import { useSpotifyStore } from '../store/useSpotifyStore';
import { useCalendarStore } from '../store/useCalendarStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { socketService } from '../services/socketService';
import { getBatteryLevel, startBatteryMonitoring } from '../services/phoneService';
import PCControlScreen from './PCControlScreen';
import BriefingModal from '../components/BriefingModal';
import NotificationCard from '../components/NotificationCard';

const QUOTES = [
  'The best way to get started is to quit talking and begin doing.',
  'Small steps every day lead to big changes.',
  'Focus on progress, not perfection.',
  'Your desk Jarvis is always ready when you are.',
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  // ── All hooks declared unconditionally, at the top ──
  const status = useJarvisStore(state => state.status);
  const pcStats = useJarvisStore(state => state.pcStats);
  const userName = useSettingsStore(state => state.userName);
  const spotifyLinked = useSettingsStore(state => state.spotifyLinked);

  const { weather, loading: weatherLoading, fetchWeather } = useWeatherStore();
  const spotify = useSpotifyStore();
  const { events, linked: calendarLinked, fetchEvents } = useCalendarStore();
  const { notifications, unreadCount, clear } = useNotificationStore();

  const [showPCControl, setShowPCControl] = useState(false);
  const [briefingVisible, setBriefingVisible] = useState(false);
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0, presence: false });
  const [batteryLevel, setBatteryLevel] = useState(100);

  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ──
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (spotifyLinked) {
      useSpotifyStore.getState().setLinked(true);
      spotify.fetchTrack();
      const interval = setInterval(spotify.fetchTrack, 5000);
      return () => clearInterval(interval);
    }
  }, [spotifyLinked]);

  useEffect(() => {
    if (!spotify.playing) return;
    const tick = setInterval(() => useSpotifyStore.getState().tickProgress(), 1000);
    return () => clearInterval(tick);
  }, [spotify.playing]);

  useEffect(() => {
    if (!spotifyLinked) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = spotifyQuery.trim();
    if (!trimmed) {
      useSpotifyStore.getState().clearSearch();
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      useSpotifyStore.getState().searchTracks(trimmed);
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [spotifyQuery, spotifyLinked]);

  const formatTrackTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSpotifySearch = () => {
    if (!spotifyLinked) {
      Alert.alert('Spotify', 'Link your Spotify account in Settings first.');
      return;
    }
    if (!spotifyQuery.trim()) return;
    spotify.searchTracks(spotifyQuery.trim());
  };

  const handlePlaySearchResult = async (uri: string) => {
    const result = await spotify.playTrack(uri);
    if (!result.ok) {
      if (result.error === 'no_device') {
        Alert.alert('Spotify', 'Open Spotify on your PC or phone first.');
      } else {
        Alert.alert('Spotify', 'Could not play that track.');
      }
    }
  };

  const handleSpotifyToggle = async () => {
    if (!spotifyLinked) {
      Alert.alert('Spotify', 'Link your Spotify account in Settings first.');
      return;
    }
    const result = spotify.playing ? await spotify.pause() : await spotify.play();
    if (!result.ok) {
      if (result.error === 'no_device') {
        Alert.alert(
          'Spotify',
          'No active Spotify device found. Open Spotify on your PC or phone, then try again.'
        );
      } else if (result.error === 'not_linked') {
        Alert.alert('Spotify', 'Link your Spotify account in Settings first.');
      } else {
        Alert.alert('Spotify', 'Could not control playback. Try again.');
      }
    }
  };

  useEffect(() => {
    if (calendarLinked) {
      fetchEvents();
      const interval = setInterval(fetchEvents, 300000);
      return () => clearInterval(interval);
    }
  }, [calendarLinked]);

  useEffect(() => {
    const handleSensorData = (data: any) => {
      setSensorData({
        temperature: data.temperature,
        humidity: data.humidity,
        presence: data.presence,
      });
    };
    socketService.on('sensor_data', handleSensorData);
    return () => socketService.off('sensor_data', handleSensorData);
  }, []);

  useEffect(() => {
    getBatteryLevel().then(setBatteryLevel);
    const subscription = startBatteryMonitoring((level) => {
      setBatteryLevel(level);
      Alert.alert('Low Battery', `Your phone is at ${level}%. Consider charging soon!`);
    }, 20);
    return () => subscription?.remove();
  }, []);

  // ── Helpers ──
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dailyQuote = useMemo(
    () => QUOTES[new Date().getDate() % QUOTES.length],
    []
  );

  const formatEventTime = (dateStr: string, isAllDay: boolean): string => {
    if (isAllDay) return 'All day';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePomodoro = () => {
    if (pomodoroActive) {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current);
      setPomodoroActive(false);
    } else {
      setPomodoroActive(true);
      pomodoroRef.current = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            if (pomodoroRef.current) clearInterval(pomodoroRef.current);
            setPomodoroActive(false);
            if (pomodoroMode === 'focus') {
              setPomodoroMode('break');
              return 5 * 60;
            } else {
              setPomodoroMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetPomodoro = () => {
    if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    setPomodoroActive(false);
    setPomodoroMode('focus');
    setPomodoroSeconds(25 * 60);
  };

  // ── Conditional screen swap (after all hooks) ──
  if (showPCControl) {
    return <PCControlScreen onBack={() => setShowPCControl(false)} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroDate}>{today}</Text>
          <Text style={styles.heroGreeting}>{getGreeting()},</Text>
          <Text style={styles.heroName}>{userName}</Text>
          <Text style={styles.heroQuote}>"{dailyQuote}"</Text>
          <View style={styles.heroFooter}>
            <View style={styles.jarvisPill}>
              <View style={styles.statusDot} />
              <Text style={styles.jarvisPillText}>Jarvis · {status.model}</Text>
            </View>
            <TouchableOpacity style={styles.briefingBtn} onPress={() => setBriefingVisible(true)}>
              <Text style={styles.briefingBtnText}>☀️ Briefing</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather */}
        <View style={styles.weatherCard}>
          {weatherLoading && !weather ? (
            <View style={styles.weatherLoading}>
              <ActivityIndicator color={colors.blue} />
              <Text style={styles.weatherLoadingText}>Fetching weather...</Text>
            </View>
          ) : weather ? (
            <>
              <View style={styles.weatherTop}>
                <View style={styles.weatherMain}>
                  <Text style={styles.weatherTemp}>{weather.temp}°</Text>
                  <View>
                    <Text style={styles.weatherCity}>{weather.city}</Text>
                    <Text style={styles.weatherCondition}>{weather.condition}</Text>
                  </View>
                </View>
                <View style={styles.weatherIconWrap}>
                  <Text style={styles.weatherIcon}>{weather.icon}</Text>
                </View>
              </View>
              <View style={styles.weatherDivider} />
              <View style={styles.weatherGrid}>
                <View style={styles.weatherDetail}>
                  <Text style={styles.weatherDetailVal}>{weather.feelsLike}°</Text>
                  <Text style={styles.weatherDetailLabel}>Feels like</Text>
                </View>
                <View style={styles.weatherDetail}>
                  <Text style={styles.weatherDetailVal}>{weather.humidity}%</Text>
                  <Text style={styles.weatherDetailLabel}>Humidity</Text>
                </View>
                <View style={styles.weatherDetail}>
                  <Text style={styles.weatherDetailVal}>{weather.wind}</Text>
                  <Text style={styles.weatherDetailLabel}>Wind km/h</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.weatherLoading}>
              <Text style={styles.weatherLoadingText}>Weather unavailable</Text>
            </View>
          )}
        </View>

        {/* At a glance */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>At a glance</Text>
        </View>
        <View style={styles.glanceRow}>
          <View style={styles.glanceCard}>
            <View style={[styles.glanceIcon, { backgroundColor: colors.surface.purple }]}>
              <Text style={styles.glanceEmoji}>🌡️</Text>
            </View>
            <Text style={styles.glanceVal}>{sensorData.temperature}°C</Text>
            <Text style={styles.glanceLabel}>Room</Text>
          </View>
          <View style={styles.glanceCard}>
            <View style={[styles.glanceIcon, { backgroundColor: sensorData.presence ? colors.surface.green : colors.bg.card }]}>
              <Text style={styles.glanceEmoji}>{sensorData.presence ? '🟢' : '⚪'}</Text>
            </View>
            <Text style={styles.glanceVal}>{sensorData.presence ? 'Here' : 'Away'}</Text>
            <Text style={styles.glanceLabel}>Presence</Text>
          </View>
          <View style={styles.glanceCard}>
            <View style={[styles.glanceIcon, { backgroundColor: batteryLevel <= 20 ? colors.surface.red : colors.surface.blue }]}>
              <Text style={styles.glanceEmoji}>{batteryLevel <= 20 ? '🪫' : '🔋'}</Text>
            </View>
            <Text style={styles.glanceVal}>{batteryLevel}%</Text>
            <Text style={styles.glanceLabel}>Battery</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Quick actions</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, spotify.playing && styles.actionBtnActive]}
            onPress={handleSpotifyToggle}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.surface.green }]}>
              <Text style={styles.actionIcon}>{spotify.playing ? '⏸️' : '▶️'}</Text>
            </View>
            <Text style={styles.actionLabel}>{spotify.playing ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => socketService.send('command', { action: 'mute' })}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.surface.purple }]}>
              <Text style={styles.actionIcon}>🎙️</Text>
            </View>
            <Text style={styles.actionLabel}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              Alert.alert('Sleep', 'Put Jarvis to sleep?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sleep',
                  style: 'destructive',
                  onPress: () => socketService.send('command', { action: 'sleep' }),
                },
              ])
            }
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.surface.blue }]}>
              <Text style={styles.actionIcon}>🌙</Text>
            </View>
            <Text style={styles.actionLabel}>Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPCControl(true)}>
            <View style={[styles.actionIconWrap, { backgroundColor: colors.surface.cyan }]}>
              <Text style={styles.actionIcon}>💻</Text>
            </View>
            <Text style={styles.actionLabel}>PC</Text>
          </TouchableOpacity>
        </View>

        {/* Spotify */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.spotify }]} />
          <Text style={styles.sectionLabel}>Now playing</Text>
        </View>
        <View style={styles.spotifyCard}>
          <View style={styles.spotifySearchRow}>
            <TextInput
              style={styles.spotifySearchInput}
              value={spotifyQuery}
              onChangeText={setSpotifyQuery}
              placeholder="Search songs..."
              placeholderTextColor={colors.text.muted}
              onSubmitEditing={handleSpotifySearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.spotifySearchBtn} onPress={handleSpotifySearch}>
              <Text style={styles.spotifySearchBtnText}>🔍</Text>
            </TouchableOpacity>
          </View>

          {spotify.searching && (
            <ActivityIndicator color={colors.purple.mid} style={styles.spotifyLoader} />
          )}

          {spotify.searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {spotify.searchResults.map(track => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.searchResultItem}
                  onPress={() => handlePlaySearchResult(track.uri)}
                >
                  {track.image ? (
                    <Image source={{ uri: track.image }} style={styles.searchResultImage} />
                  ) : (
                    <View style={[styles.searchResultImage, styles.searchResultImagePlaceholder]}>
                      <Text>🎵</Text>
                    </View>
                  )}
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultTitle} numberOfLines={1}>{track.name}</Text>
                    <Text style={styles.searchResultArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.searchResultDuration}>{formatTrackTime(track.durationMs)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.nowPlayingRow}>
            {spotify.imageUrl ? (
              <Image source={{ uri: spotify.imageUrl }} style={styles.albumArt} />
            ) : (
              <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                <Text style={styles.albumArtIcon}>🎵</Text>
              </View>
            )}
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{spotify.trackName}</Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                {spotify.artistName || 'Spotify'}
              </Text>
              <View style={styles.spotifyControls}>
                <TouchableOpacity onPress={spotify.previous}>
                  <Text style={styles.spotifyBtn}>⏮</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSpotifyToggle}>
                  <Text style={styles.spotifyBtnLarge}>{spotify.playing ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={spotify.next}>
                  <Text style={styles.spotifyBtn}>⏭</Text>
                </TouchableOpacity>
              </View>
              {spotify.durationMs > 0 && (
                <>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((spotify.progressMs / spotify.durationMs) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTrackTime(spotify.progressMs)}</Text>
                    <Text style={styles.timeText}>{formatTrackTime(spotify.durationMs)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Pomodoro */}
        <View style={styles.pomodoroCard}>
          <View style={styles.pomodoroRing}>
            <Text style={styles.pomodoroTimer}>{formatTime(pomodoroSeconds)}</Text>
            <Text style={styles.pomodoroMode}>
              {pomodoroMode === 'focus' ? 'Focus' : 'Break'}
            </Text>
          </View>
          <View style={styles.pomodoroInfo}>
            <Text style={styles.pomodoroTitle}>
              {pomodoroMode === 'focus' ? 'Focus session' : 'Break time'}
            </Text>
            <Text style={styles.pomodoroSub}>
              {pomodoroActive ? 'Stay in the zone...' : 'Tap play when you are ready'}
            </Text>
            <View style={styles.pomodoroButtons}>
              <TouchableOpacity style={styles.pomodoroBtnPrimary} onPress={togglePomodoro}>
                <Text style={styles.pomodoroBtnPrimaryText}>{pomodoroActive ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pomodoroBtn} onPress={resetPomodoro}>
                <Text style={styles.pomodoroBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* System Stats */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>System · {status.uptime}</Text>
        </View>
        <View style={styles.miniGrid}>
          <View style={styles.miniCard}>
            <View style={styles.miniCardTop}>
              <Text style={styles.miniCardIcon}>🖥️</Text>
              <Text style={styles.miniCardVal}>{status.cpu}%</Text>
            </View>
            <Text style={styles.miniCardLabel}>CPU Usage</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: `${status.cpu}%`, backgroundColor: colors.purple.main }]} />
            </View>
          </View>
          <View style={styles.miniCard}>
            <View style={styles.miniCardTop}>
              <Text style={styles.miniCardIcon}>💾</Text>
              <Text style={styles.miniCardVal}>{status.ram}%</Text>
            </View>
            <Text style={styles.miniCardLabel}>RAM Usage</Text>
            <View style={styles.miniBar}>
              <View style={[styles.miniBarFill, { width: `${status.ram}%`, backgroundColor: colors.red }]} />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadgeSmall}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {notifications.length === 0 ? (
          <View style={styles.emptyNotif}>
            <Text style={styles.emptyNotifText}>No new notifications</Text>
          </View>
        ) : (
          notifications.slice(0, 3).map(n => (
            <NotificationCard
              key={n.id}
              id={n.id}
              app={n.app}
              sender={n.sender}
              message={n.message}
              summary={n.summary}
              time={n.time}
              onClear={clear}
            />
          ))
        )}

        {/* Calendar / Reminders */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Today's schedule</Text>
        </View>
        {!calendarLinked ? (
          <View style={styles.emptyNotif}>
            <Text style={styles.emptyNotifText}>Link Google Calendar in Settings</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyNotif}>
            <Text style={styles.emptyNotifText}>No events today 🎉</Text>
          </View>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.reminderItem}>
              <View style={[styles.reminderDot, { backgroundColor: colors.purple.mid }]} />
              <Text style={styles.reminderTitle}>{event.title}</Text>
              <Text style={styles.reminderTime}>{formatEventTime(event.startTime, event.isAllDay)}</Text>
            </View>
          ))
        )}

        {/* Git Status */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.git }]} />
          <Text style={styles.sectionLabel}>Developer</Text>
        </View>
        <View style={styles.gitCard}>
          <View style={styles.gitTop}>
            <Text style={styles.gitIcon}>🌿</Text>
            <Text style={styles.gitTitle}>Git status</Text>
            <View style={styles.gitBranch}>
              <Text style={styles.gitBranchText}>{pcStats?.git?.branch || 'main'}</Text>
            </View>
          </View>
          <Text style={styles.gitCommit}>{pcStats?.git?.commit || 'No commits yet'}</Text>
          {pcStats?.git?.changed !== undefined && (
            <Text style={styles.gitChanged}>
              {pcStats.git.changed > 0 ? `${pcStats.git.changed} uncommitted changes` : 'Working tree clean'}
            </Text>
          )}
          <Text style={styles.gitWindow}>🖥️  {pcStats?.window || 'No active window'}</Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <BriefingModal visible={briefingVisible} onClose={() => setBriefingVisible(false)} />
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  heroCard: {
    backgroundColor: colors.bg.jarvis,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.purple.dark,
    overflow: 'hidden',
    ...cardShadow,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.purple.main,
    opacity: 0.12,
  },
  heroDate: {
    fontSize: typography.sizes.xs,
    color: colors.purple.light,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroGreeting: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  heroName: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroQuote: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  jarvisPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  jarvisPillText: {
    fontSize: typography.sizes.xs,
    color: colors.greenSoft,
    fontWeight: typography.weights.medium,
  },
  briefingBtn: {
    backgroundColor: colors.purple.main,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  briefingBtnText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  weatherCard: {
    backgroundColor: colors.bg.weather,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    ...cardShadow,
  },
  weatherLoading: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  weatherLoadingText: { fontSize: typography.sizes.sm, color: colors.text.muted },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weatherTemp: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 52,
  },
  weatherCity: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  weatherCondition: {
    fontSize: typography.sizes.sm,
    color: colors.blue,
    marginTop: 2,
  },
  weatherIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: { fontSize: 32 },
  weatherDivider: {
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    marginVertical: spacing.md,
  },
  weatherGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherDetail: { alignItems: 'center', flex: 1 },
  weatherDetailVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  weatherDetailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
    flex: 1,
  },
  unreadBadgeSmall: {
    backgroundColor: colors.purple.main,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  glanceRow: { flexDirection: 'row', gap: spacing.sm },
  glanceCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border.default,
    gap: 6,
  },
  glanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glanceEmoji: { fontSize: 18 },
  glanceVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  glanceLabel: { fontSize: typography.sizes.xs, color: colors.text.muted },
  quickActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 14,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtnActive: {
    borderColor: colors.purple.main,
    backgroundColor: colors.bg.jarvis,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  spotifyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  spotifyBtn: { fontSize: typography.sizes.lg, color: colors.spotify },
  spotifyBtnLarge: { fontSize: 26, color: colors.spotify },
  spotifyCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: 'rgba(30, 215, 96, 0.3)',
    borderLeftWidth: 3,
    borderLeftColor: colors.spotify,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    ...cardShadow,
  },
  spotifySearchRow: { flexDirection: 'row', gap: spacing.xs },
  spotifySearchInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  spotifySearchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.spotify,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifySearchBtnText: { fontSize: 16 },
  spotifyLoader: { marginVertical: spacing.xs },
  searchResults: { gap: spacing.xs },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.default,
  },
  searchResultImage: { width: 44, height: 44, borderRadius: 8 },
  searchResultImagePlaceholder: {
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: { flex: 1 },
  searchResultTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  searchResultArtist: { fontSize: typography.sizes.xs, color: colors.text.muted },
  searchResultDuration: { fontSize: typography.sizes.xs, color: colors.text.muted },
  nowPlayingRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  albumArt: { width: 96, height: 96, borderRadius: 12 },
  albumArtPlaceholder: {
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  albumArtIcon: { fontSize: 32 },
  nowPlayingInfo: { flex: 1, justifyContent: 'center' },
  nowPlayingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  nowPlayingArtist: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 5,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.spotify, borderRadius: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: typography.sizes.xs, color: colors.text.muted },
  pomodoroCard: {
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...cardShadow,
  },
  pomodoroRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.red,
  },
  pomodoroTimer: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pomodoroMode: {
    fontSize: 9,
    color: colors.red,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pomodoroInfo: { flex: 1, gap: spacing.xs },
  pomodoroTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pomodoroSub: { fontSize: typography.sizes.xs, color: colors.text.muted },
  pomodoroButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  pomodoroBtnPrimary: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pomodoroBtnPrimaryText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  pomodoroBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  pomodoroBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  miniGrid: { flexDirection: 'row', gap: spacing.sm },
  miniCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 14,
    padding: spacing.md,
  },
  miniCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniCardIcon: { fontSize: 16 },
  miniCardVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  miniCardLabel: { fontSize: typography.sizes.xs, color: colors.text.muted },
  miniBar: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  miniBarFill: { height: '100%', borderRadius: 2 },
  emptyNotif: {
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyNotifText: { fontSize: typography.sizes.sm, color: colors.text.muted },
  reminderItem: {
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  reminderDot: { width: 8, height: 8, borderRadius: 4 },
  reminderTitle: { flex: 1, fontSize: typography.sizes.sm, color: colors.text.secondary },
  reminderTime: { fontSize: typography.sizes.xs, color: colors.text.muted },
  gitCard: {
    backgroundColor: colors.bg.git,
    borderWidth: 0.5,
    borderColor: 'rgba(132, 204, 22, 0.4)',
    borderRadius: 16,
    padding: spacing.md,
    ...cardShadow,
  },
  gitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gitIcon: { fontSize: 16 },
  gitTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  gitBranch: {
    backgroundColor: 'rgba(132, 204, 22, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gitBranchText: {
    fontSize: typography.sizes.xs,
    color: colors.git,
    fontWeight: typography.weights.bold,
  },
  gitCommit: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  gitChanged: { fontSize: typography.sizes.xs, color: colors.amber, marginBottom: 4 },
  gitWindow: { fontSize: typography.sizes.xs, color: colors.text.muted },
  bottomPad: { height: spacing.sm },
});
