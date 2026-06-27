import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useJarvisStore } from '../store/useJarvisStore';
import { socketService } from '../services/socketService';

export default function ConnectScreen() {
  const [ip, setIp] = useState('192.168.1.100');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const setConnected = useJarvisStore(state => state.setConnected);

  const handleConnect = () => {
    if (!ip.trim()) {
      setError('Please enter an IP address');
      return;
    }
    setError('');
    setConnecting(true);

    socketService.connect(ip.trim());

    const handleConnection = (data: any) => {
      if (data.status === 'connected') {
        setConnecting(false);
        setConnected(true);
        socketService.off('connection', handleConnection);
      } else if (data.status === 'disconnected') {
        setConnecting(false);
        setError('Could not connect. Check IP and try again.');
        socketService.off('connection', handleConnection);
      }
    };

    socketService.on('connection', handleConnection);

    setTimeout(() => {
      setConnecting(false);
    }, 5000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.orbOuter}>
        <View style={styles.orbInner}>
          <Text style={styles.orbIcon}>🤖</Text>
        </View>
      </View>

      <Text style={styles.title}>Connect to Jarvis</Text>
      <Text style={styles.subtitle}>Enter the IP address of your Jarvis box</Text>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>IP Address</Text>
        <TextInput
          style={styles.input}
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.1.100"
          placeholderTextColor={colors.text.muted}
          keyboardType="decimal-pad"
          autoCapitalize="none"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.connectBtn, connecting && styles.connectBtnDisabled]}
        onPress={handleConnect}
        disabled={connecting}
      >
        {connecting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.connectBtnText}>Connect</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        💡 Make sure your phone and Jarvis are on the same WiFi network (or use your Tailscale IP for remote access)
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  orbOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.purple.mid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  orbInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.jarvis,
    borderWidth: 1.5,
    borderColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbIcon: { fontSize: 32 },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  inputWrap: { width: '100%', marginBottom: spacing.md },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.bg.card,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    borderWidth: 0.5,
    borderColor: colors.border.purple,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.red,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  connectBtn: {
    width: '100%',
    height: 48,
    backgroundColor: colors.purple.main,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  connectBtnDisabled: { opacity: 0.6 },
  connectBtnText: {
    color: '#fff',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
