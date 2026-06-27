import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { generateBriefing, Briefing } from '../services/briefingService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function BriefingModal({ visible, onClose }: Props) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      generateBriefing().then(b => {
        setBriefing(b);
        setLoading(false);
      });
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>☀️ Morning Briefing</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.purple.mid} style={styles.loader} />
          ) : briefing ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionIcon}>👋</Text>
                <View>
                  <Text style={styles.sectionTitle}>{briefing.greeting}!</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionIcon}>🌤️</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionLabel}>Weather</Text>
                  <Text style={styles.sectionText}>{briefing.weather}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionIcon}>🔔</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionLabel}>Reminders</Text>
                  <Text style={styles.sectionText}>{briefing.reminders}</Text>
                </View>
              </View>

              <View style={styles.newsSection}>
                <Text style={styles.newsSectionTitle}>📰 Top News</Text>
                {briefing.news.map((item, index) => (
                  <View key={index} style={styles.newsItem}>
                    <View style={styles.newsDot} />
                    <Text style={styles.newsText}>{item}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.errorText}>Failed to load briefing. Try again!</Text>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '80%',
    borderWidth: 0.5,
    borderColor: colors.border.purple,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text.primary },
  closeBtn: { fontSize: typography.sizes.lg, color: colors.text.muted, padding: spacing.xs },
  loader: { marginVertical: spacing.xxl },
  section: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  sectionIcon: { fontSize: 20 },
  sectionContent: { flex: 1 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text.primary },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionText: { fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 },
  newsSection: {
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  newsSectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text.primary, marginBottom: spacing.sm },
  newsItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  newsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.purple.mid, marginTop: 6, flexShrink: 0 },
  newsText: { flex: 1, fontSize: typography.sizes.xs, color: colors.text.secondary, lineHeight: 18 },
  errorText: { fontSize: typography.sizes.sm, color: colors.text.muted, textAlign: 'center', marginVertical: spacing.xxl },
  doneBtn: { backgroundColor: colors.purple.main, padding: spacing.md, borderRadius: 10, alignItems: 'center', marginTop: spacing.md },
  doneBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
});
