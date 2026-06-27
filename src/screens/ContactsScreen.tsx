import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useContactsStore } from '../store/useContactsStore';

export default function ContactsScreen({ onBack }: { onBack: () => void }) {
  const { contacts, addContact, removeContact } = useContactsStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = () => {
    if (name.trim() && phone.trim()) {
      addContact(name.trim(), phone.trim());
      setName('');
      setPhone('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jarvis Contacts</Text>
        <Text style={styles.headerSub}>So Jarvis knows who to message</Text>
      </View>

      <View style={styles.addForm}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name (e.g. Mom)"
          placeholderTextColor={colors.text.muted}
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone with country code (e.g. 919876543210)"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={item => item.name}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phoneNumber || 'No number set'}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(item.name)}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
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
  addForm: { padding: spacing.md, gap: spacing.sm },
  input: {
    height: 44,
    backgroundColor: colors.bg.card,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    borderWidth: 0.5,
    borderColor: colors.border.default,
  },
  addBtn: {
    height: 44,
    backgroundColor: colors.purple.main,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  list: { padding: spacing.md },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 0.5,
    borderColor: colors.border.default,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  contactPhone: { fontSize: typography.sizes.xs, color: colors.text.muted, marginTop: 2 },
  deleteIcon: { fontSize: 16 },
});
