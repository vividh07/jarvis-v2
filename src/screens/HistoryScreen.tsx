import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { socketService } from '../services/socketService';

type FilterTab = 'all' | 'user' | 'jarvis';

interface HistoryRow {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  role: 'user' | 'jarvis';
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};

const getTimeLabel = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = diff / 3600000;
  const days = diff / 86400000;
  if (hours < 1) return 'Just now';
  if (hours < 24) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${Math.floor(days)}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getIcon = (role: 'user' | 'jarvis', preview: string): string => {
  if (role === 'user') return '👤';
  const t = preview.toLowerCase();
  if (t.includes('spotify') || t.includes('music') || t.includes('play')) return '🎵';
  if (t.includes('call')) return '📞';
  if (t.includes('reminder')) return '🔔';
  if (t.includes('weather')) return '🌤️';
  if (t.includes('git')) return '🌿';
  if (t.includes('briefing')) return '📋';
  return '🤖';
};

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'user', label: 'You' },
  { key: 'jarvis', label: 'Jarvis' },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mapMessages = useCallback((messages: { role: string; content: string }[]) => {
    return [...messages].reverse().map((msg, i) => ({
      id: String(messages.length - 1 - i),
      title: msg.role === 'user' ? 'You' : 'Jarvis',
      preview: msg.content,
      timestamp: Date.now() - i * 60000,
      role: (msg.role === 'user' ? 'user' : 'jarvis') as 'user' | 'jarvis',
    }));
  }, []);

  const fetchHistory = useCallback(() => {
    if (socketService.isConnected()) {
      socketService.send('get_history');
    } else {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleHistory = (data: { messages?: { role: string; content: string }[] }) => {
      setHistory(mapMessages(data.messages || []));
      setLoading(false);
      setRefreshing(false);
    };

    socketService.on('history_list', handleHistory);
    fetchHistory();

    return () => {
      socketService.off('history_list', handleHistory);
    };
  }, [mapMessages, fetchHistory]);

  const stats = useMemo(() => {
    const userCount = history.filter(h => h.role === 'user').length;
    const jarvisCount = history.filter(h => h.role === 'jarvis').length;
    return { total: history.length, userCount, jarvisCount };
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter(item => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'user' && item.role === 'user') ||
        (filter === 'jarvis' && item.role === 'jarvis');
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [history, filter, search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: HistoryRow }) => {
    const isUser = item.role === 'user';
    return (
      <TouchableOpacity
        style={[styles.historyCard, isUser ? styles.historyCardUser : styles.historyCardJarvis]}
        activeOpacity={0.75}
      >
        <View style={[styles.accentBar, isUser ? styles.accentUser : styles.accentJarvis]} />
        <View style={[styles.iconWrap, isUser ? styles.iconWrapUser : styles.iconWrapJarvis]}>
          <Text style={styles.icon}>{getIcon(item.role, item.preview)}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemTopRow}>
            <Text style={[styles.itemTitle, isUser && styles.itemTitleUser]}>{item.title}</Text>
            <Text style={styles.itemTime}>{getTimeLabel(item.timestamp)}</Text>
          </View>
          <Text style={styles.itemPreview} numberOfLines={3}>
            {item.preview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>Conversation log</Text>
        <Text style={styles.heroTitle}>Your history</Text>
        <Text style={styles.heroSub}>Every chat with Jarvis, saved on your PC</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statVal}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statVal, { color: colors.purple.light }]}>{stats.userCount}</Text>
            <Text style={styles.statLabel}>You</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statVal, { color: colors.greenSoft }]}>{stats.jarvisCount}</Text>
            <Text style={styles.statLabel}>Jarvis</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search messages..."
          placeholderTextColor={colors.text.muted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(tab => {
          const active = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length > 0 && (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>
            {filtered.length} message{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.purple.mid} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
            filtered.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.purple.mid}
              colors={[colors.purple.main]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>{history.length === 0 ? '🕓' : '🔎'}</Text>
              <Text style={styles.emptyTitle}>
                {history.length === 0 ? 'No history yet' : 'No matches'}
              </Text>
              <Text style={styles.emptyText}>
                {history.length === 0
                  ? 'Start chatting with Jarvis — your conversations will show up here.'
                  : 'Try a different search or filter.'}
              </Text>
              {history.length === 0 && (
                <TouchableOpacity style={styles.emptyBtn} onPress={onRefresh}>
                  <Text style={styles.emptyBtnText}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  listContent: { padding: spacing.md, gap: spacing.sm },
  listContentEmpty: { flexGrow: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.sizes.sm, color: colors.text.muted },
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
    top: -50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.purple.main,
    opacity: 0.15,
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.purple.light,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface.dark,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border.glow,
  },
  statVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  clearIcon: { fontSize: 14, color: colors.text.muted, padding: 4 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.purple.main,
    borderColor: colors.purple.mid,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  historyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: spacing.md,
    paddingLeft: spacing.sm,
    gap: spacing.sm,
    overflow: 'hidden',
    ...cardShadow,
  },
  historyCardUser: {
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.glow,
  },
  historyCardJarvis: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 0.5,
    borderColor: colors.border.glow,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 2,
  },
  accentUser: { backgroundColor: colors.purple.main },
  accentJarvis: { backgroundColor: colors.green },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUser: { backgroundColor: colors.surface.purple },
  iconWrapJarvis: {
    backgroundColor: colors.bg.jarvis,
    borderWidth: 1,
    borderColor: colors.purple.main,
  },
  icon: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.sm,
  },
  itemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.greenSoft,
  },
  itemTitleUser: { color: colors.purple.light },
  itemPreview: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  itemTime: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    flexShrink: 0,
  },
  separator: { height: spacing.sm },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.xs },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.purple.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontSize: typography.sizes.sm,
    color: '#fff',
    fontWeight: typography.weights.bold,
  },
});
