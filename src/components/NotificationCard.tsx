import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface Props {
  id: string;
  app: string;
  sender: string;
  message: string;
  summary?: string;
  time: number;
  onClear: (id: string) => void;
}

const getAppIcon = (app: string): string => {
  const a = app.toLowerCase();
  if (a.includes('whatsapp')) return '💬';
  if (a.includes('sms')) return '📱';
  if (a.includes('telegram')) return '✈️';
  if (a.includes('instagram')) return '📸';
  if (a.includes('gmail')) return '📧';
  return '🔔';
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function NotificationCard({ id, app, sender, message, summary, time, onClear }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{getAppIcon(app)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.app}>{app}</Text>
          <Text style={styles.time}>{formatTime(time)}</Text>
        </View>
        <Text style={styles.sender}>{sender}</Text>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
        ) : (
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.clearBtn} onPress={() => onClear(id)}>
        <Text style={styles.clearIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.jarvis,
    borderWidth: 1,
    borderColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16 },
  content: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  app: { fontSize: typography.sizes.xs, color: colors.purple.mid, fontWeight: typography.weights.medium },
  time: { fontSize: typography.sizes.xs, color: colors.text.muted },
  sender: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text.primary, marginBottom: 2 },
  summary: { fontSize: typography.sizes.sm, color: colors.accent.cyan, lineHeight: 18, fontStyle: 'italic' },
  message: { fontSize: typography.sizes.xs, color: colors.text.muted, lineHeight: 16 },
  clearBtn: { padding: spacing.xs },
  clearIcon: { fontSize: 12, color: colors.text.muted },
});
