import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Message } from '../types';
import { useChatStore } from '../store/useChatStore';
import { useJarvisStore } from '../store/useJarvisStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { socketService } from '../services/socketService';

const QUICK_PROMPTS = ['Hey Jarvis!', 'How are you?', 'Play some music', "What's the weather?"];

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: 'Online', color: colors.green },
  listening: { label: 'Listening...', color: colors.amber },
  thinking: { label: 'Thinking...', color: colors.purple.mid },
  speaking: { label: 'Speaking...', color: colors.blue },
};

const cardShadow = {
  shadowColor: colors.accent.cyan,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 3,
};

export default function ChatScreen() {
  const { messages, addMessage } = useChatStore();
  const status = useJarvisStore(state => state.status);
  const connected = useJarvisStore(state => state.connected);
  const agentName = useSettingsStore(state => state.agentName);
  const userName = useSettingsStore(state => state.userName);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const modeInfo = MODE_LABELS[status.mode] || MODE_LABELS.idle;
  const showStatus = connected && status.mode !== 'idle';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    addMessage(userMsg);
    socketService.send('chat', { text: trimmed });
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isJarvis = item.role === 'jarvis';
    return (
      <View style={[styles.msgRow, isJarvis ? styles.msgRowLeft : styles.msgRowRight]}>
        {isJarvis && (
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isJarvis ? styles.bubbleJarvis : styles.bubbleUser,
            cardShadow,
          ]}
        >
          <Text style={[styles.bubbleText, isJarvis ? styles.bubbleTextJarvis : styles.bubbleTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, !isJarvis && styles.timestampUser]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyHero}>
        <View style={styles.emptyGlow} />
        <Text style={styles.emptyEmoji}>🤖</Text>
        <Text style={styles.emptyTitle}>Hey {userName}!</Text>
        <Text style={styles.emptySub}>
          {agentName} is ready. Type a message or tap the mic to talk.
        </Text>
      </View>
      <Text style={styles.quickLabel}>Try asking</Text>
      <View style={styles.quickRow}>
        {QUICK_PROMPTS.map(prompt => (
          <TouchableOpacity
            key={prompt}
            style={styles.quickChip}
            onPress={() => sendText(prompt)}
          >
            <Text style={styles.quickChipText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerGlow} />
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarIcon}>🤖</Text>
            {connected && <View style={styles.headerAvatarRing} />}
          </View>
          <View>
            <Text style={styles.headerName}>{agentName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: modeInfo.color }]} />
              <Text style={[styles.statusText, { color: modeInfo.color }]}>
                {showStatus ? modeInfo.label : connected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.voiceHeaderBtn}
          onPress={() => socketService.send('voice', {})}
        >
          <Text style={styles.voiceHeaderIcon}>🎤</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={ListEmpty}
        />
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${agentName}...`}
              placeholderTextColor={colors.text.muted}
              onSubmitEditing={() => sendText(input)}
              returnKeyType="send"
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, input.length > 0 && styles.sendBtnActive]}
            onPress={() => (input.length > 0 ? sendText(input) : socketService.send('voice', {}))}
          >
            <Text style={[styles.sendIcon, input.length === 0 && styles.sendIconMic]}>
              {input.length > 0 ? '➤' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg.jarvis,
    borderBottomWidth: 1,
    borderBottomColor: colors.purple.dark,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.purple.main,
    opacity: 0.12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.primary,
    borderWidth: 2,
    borderColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarRing: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.bg.jarvis,
  },
  headerAvatarIcon: { fontSize: 24 },
  headerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  voiceHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  voiceHeaderIcon: { fontSize: 20 },
  messageList: { flex: 1 },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  messagesListEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { paddingVertical: spacing.lg, gap: spacing.md },
  emptyHero: {
    backgroundColor: colors.bg.jarvis,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.purple.dark,
    overflow: 'hidden',
    ...cardShadow,
  },
  emptyGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.purple.main,
    opacity: 0.15,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickChip: {
    backgroundColor: colors.bg.card,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.purple.dark,
  },
  quickChipText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.cyan,
    fontWeight: typography.weights.medium,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.jarvis,
    borderWidth: 1.5,
    borderColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 16 },
  bubble: {
    maxWidth: '78%',
    padding: spacing.md,
    borderRadius: 16,
  },
  bubbleJarvis: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.glow,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.purple.main,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: typography.sizes.sm, lineHeight: 22 },
  bubbleTextJarvis: { color: colors.text.secondary },
  bubbleTextUser: { color: '#fff' },
  timestamp: { fontSize: 9, color: colors.text.muted, marginTop: 6, alignSelf: 'flex-end' },
  timestampUser: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  input: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.purple.main,
    borderColor: colors.purple.mid,
    ...cardShadow,
  },
  sendIcon: { fontSize: 18, color: '#fff' },
  sendIconMic: { fontSize: 20 },
});
