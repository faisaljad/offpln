import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';

type Channel = 'email' | 'sms' | 'whatsapp';

const CHANNELS: { id: Channel; label: string; icon: any; color: string; hint: string }[] = [
  { id: 'email',    label: 'Email',     icon: 'mail-outline',      color: '#0284c7', hint: 'Enter your email address' },
  { id: 'sms',      label: 'SMS',       icon: 'chatbubble-outline', color: '#7c3aed', hint: 'Enter your phone number (e.g. +971501234567)' },
  { id: 'whatsapp', label: 'WhatsApp',  icon: 'logo-whatsapp',     color: '#22c55e', hint: 'Enter your WhatsApp number (e.g. +971501234567)' },
];

export default function OtpRequestScreen() {
  const [channel, setChannel] = useState<Channel>('email');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = CHANNELS.find((c) => c.id === channel)!;

  async function handleSend() {
    if (!target.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your ' + (channel === 'email' ? 'email' : 'phone number') });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.sendOtp(target.trim(), channel);
      Toast.show({ type: 'success', text1: 'Code sent!', text2: `Check your ${channel} — ${res.maskedTarget}` });
      router.push({ pathname: '/(auth)/otp-verify', params: { target: target.trim(), channel } });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#7dd3fc" />
      </TouchableOpacity>

      <View style={styles.top}>
        <Text style={styles.logo}>OffPlan</Text>
        <Text style={styles.subtitle}>Fractional Property Investment</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Login with OTP</Text>
        <Text style={styles.desc}>Choose how to receive your one-time code</Text>

        {/* Channel selector */}
        <View style={styles.channels}>
          {CHANNELS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.channelBtn, channel === c.id && { borderColor: c.color, backgroundColor: c.color + '12' }]}
              onPress={() => { setChannel(c.id); setTarget(''); }}
            >
              <Ionicons name={c.icon} size={20} color={channel === c.id ? c.color : '#9ca3af'} />
              <Text style={[styles.channelLabel, channel === c.id && { color: c.color, fontWeight: '700' }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{channel === 'email' ? 'Email Address' : 'Phone Number'}</Text>
          <View style={[styles.inputWrap, { borderColor: selected.color + '60' }]}>
            <Ionicons name={selected.icon} size={18} color={selected.color} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={target}
              onChangeText={setTarget}
              placeholder={selected.hint}
              placeholderTextColor="#9ca3af"
              keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: selected.color }, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Send Code</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.back2} onPress={() => router.back()}>
          <Text style={styles.back2Text}>← Back to password login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c4a6e' },
  back: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 6 },
  top: { flex: 0.35, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 34, fontWeight: '800', color: '#fbbf24', letterSpacing: -1 },
  subtitle: { color: '#7dd3fc', marginTop: 6, fontSize: 13 },

  form: {
    flex: 0.65,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { color: '#6b7280', fontSize: 13, marginBottom: 22 },

  channels: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  channelBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  channelLabel: { fontSize: 12, fontWeight: '500', color: '#9ca3af' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  back2: { alignItems: 'center', paddingVertical: 4 },
  back2Text: { color: '#9ca3af', fontSize: 13 },
});
