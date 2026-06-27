import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import {
  requestPermissions,
  scanForJarvis,
  connectToDevice,
  sendWifiCredentials,
  disconnectBLE,
} from '../services/bleService';

type Step = 'scan' | 'connect' | 'wifi' | 'done';

export default function ProvisioningScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('scan');
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleScan = async () => {
    setLoading(true);
    setStatusText('Requesting permissions...');

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Error', 'Bluetooth permissions required');
      setLoading(false);
      return;
    }

    setStatusText('Scanning for Jarvis...');

    scanForJarvis(
      async (found) => {
        setDevice(found);
        setStatusText(`Found: ${found.name}`);
        setLoading(false);
        setStep('connect');
      },
      () => {
        setStatusText('Not found. Make sure Jarvis is on.');
        setLoading(false);
      }
    );
  };

  const handleConnect = async () => {
    setLoading(true);
    setStatusText('Connecting...');

    const connected = await connectToDevice(device);
    if (connected) {
      setStep('wifi');
      setStatusText('Connected! Enter WiFi details.');
    } else {
      setStatusText('Connection failed. Try again.');
    }
    setLoading(false);
  };

  const handleSendWifi = async () => {
    if (!ssid.trim()) {
      Alert.alert('Error', 'Please enter WiFi name');
      return;
    }

    setLoading(true);
    setStatusText('Sending WiFi credentials...');

    const sent = await sendWifiCredentials(ssid, password);
    if (sent) {
      await disconnectBLE();
      setStep('done');
      setStatusText('Jarvis is connecting to WiFi!');
    } else {
      setStatusText('Failed to send. Try again.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.orbOuter}>
          <View style={styles.orbInner}>
            <Text style={styles.orbIcon}>📶</Text>
          </View>
        </View>

        <Text style={styles.title}>Setup Jarvis</Text>
        <Text style={styles.subtitle}>Connect Jarvis to your home WiFi</Text>

        <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
          <Text style={styles.skipText}>Skip — already set up</Text>
        </TouchableOpacity>

        <View style={styles.steps}>
          {['scan', 'connect', 'wifi', 'done'].map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                  ['connect', 'wifi', 'done'].includes(step) && s === 'scan' && styles.stepDotDone,
                  ['wifi', 'done'].includes(step) && s === 'connect' && styles.stepDotDone,
                  step === 'done' && s === 'wifi' && styles.stepDotDone,
                ]}
              >
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              {i < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

        {step === 'scan' && (
          <TouchableOpacity style={styles.btn} onPress={handleScan} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Scan for Jarvis</Text>}
          </TouchableOpacity>
        )}

        {step === 'connect' && (
          <TouchableOpacity style={styles.btn} onPress={handleConnect} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Connect to {device?.name}</Text>
            )}
          </TouchableOpacity>
        )}

        {step === 'wifi' && (
          <View style={styles.wifiForm}>
            <Text style={styles.inputLabel}>WiFi Name (SSID)</Text>
            <TextInput
              style={styles.input}
              value={ssid}
              onChangeText={setSsid}
              placeholder="Enter WiFi name"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter WiFi password"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
            />
            <TouchableOpacity style={styles.btn} onPress={handleSendWifi} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send to Jarvis</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.doneWrap}>
            <Text style={styles.doneIcon}>✅</Text>
            <Text style={styles.doneText}>
              Jarvis is connecting to WiFi. This takes about 30 seconds.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={onDone}>
              <Text style={styles.btnText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  orbOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.purple.mid,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  orbInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.jarvis,
    borderWidth: 1.5,
    borderColor: colors.purple.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbIcon: { fontSize: 24 },
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
    marginBottom: spacing.md,
  },
  skipBtn: { marginBottom: spacing.xl },
  skipText: { fontSize: typography.sizes.sm, color: colors.text.muted, textAlign: 'center' },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.purple.main, borderColor: colors.purple.mid },
  stepDotDone: { backgroundColor: colors.green, borderColor: colors.green },
  stepNum: { fontSize: typography.sizes.xs, color: colors.text.primary },
  stepLine: { width: 20, height: 1, backgroundColor: colors.border.default },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.purple.mid,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  btn: {
    width: '100%',
    height: 48,
    backgroundColor: colors.purple.main,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  wifiForm: { width: '100%' },
  inputLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
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
  doneWrap: { alignItems: 'center', gap: spacing.md, width: '100%' },
  doneIcon: { fontSize: 48 },
  doneText: { fontSize: typography.sizes.sm, color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
});
