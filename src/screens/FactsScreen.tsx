import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { socketService } from '../services/socketService';

export default function FactsScreen({ onBack }: { onBack: () => void }) {
  const [facts, setFacts] = useState<string[]>([]);

  useEffect(() => {
    socketService.send('get_facts', {});

    const handleFactsList = (data: any) => {
      setFacts(data.facts || []);
    };

    socketService.on('facts_list', handleFactsList);
    return () => socketService.off('facts_list', handleFactsList);
  }, []);

  const deleteFact = (index: number) => {
    Alert.alert('Delete memory', 'Remove this fact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          socketService.send('delete_fact', { index });
          setFacts(prev => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What Jarvis remembers</Text>
      </View>

      {facts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧠</Text>
          <Text style={styles.emptyText}>
            Nothing remembered yet. Say "remember that..." to teach Jarvis.
          </Text>
        </View>
      ) : (
        <FlatList
          data={facts}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.factItem}>
              <Text style={styles.factText}>{item}</Text>
              <TouchableOpacity onPress={() => deleteFact(index)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  list: { padding: spacing.md },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  factText: { flex: 1, fontSize: typography.sizes.sm, color: colors.text.secondary },
  deleteIcon: { fontSize: 16, marginLeft: spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: typography.sizes.sm, color: colors.text.muted, textAlign: 'center' },
});
