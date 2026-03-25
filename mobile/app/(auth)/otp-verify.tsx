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
import { useRef, useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

const CHANNEL_ICONS: Record<string, any> = {
  email: 'mail-outline',
  sms: 'chatbubble-outline',
  whatsapp: 'logo-whatsapp',
};
const CHANNEL_COLORS: Record<string, string> = {
  email: '#0284c7',
  sms: '#7c3aed',
  whatsapp: '#22c55e',
};

export default function OtpVerifyScreen() {
  const { target, channel } = useLocalSearchParams<{ target: string; channel: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const color = CHANNEL_COLORS[channel] ?? '#0284c7';
  const code = digits.join('');

  useEffect(() => {
    const t = setInterval(() => setResendTimer((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  function handleDigit(text: string, idx: number) {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handleKeyPress(e: any, idx: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (code.length < 6) {
      Toast.show({ type: 'error', text1: 'Enter the full 6-digit code' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.verifyOtp(target, code);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Invalid code' });
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const res: any = await api.sendOtp(target, channel as any);
      Toast.show({ type: 'success', text1: 'New code sent!', text2: res.maskedTarget });
      setResendTimer(60);
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to resend' });
    } finally {
      setResending(false);
    }
  }

  function maskTarget(t: string) {
    if (t?.includes('@')) {
      const [local, domain] = t.split('@');
      return local.slice(0, 2) + '***@' + domain;
    }
    return t?.slice(0, 4) + '****' + t?.slice(-3);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#7dd3fc" />
      </TouchableOpacity>

      <View style={styles.top}>
        <Text style={styles.logo}>OffPlan</Text>
        <Text style={styles.subtitle}>Fractional Property Investment</Text>
      </View>

      <View style={styles.form}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
          <Ionicons name={CHANNEL_ICONS[channel] ?? 'key-outline'} size={32} color={color} />
        </View>

        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.desc}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color, fontWeight: '700' }}>{maskTarget(target)}</Text>
        </Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, d ? { borderColor: color, backgroundColor: color + '0d' } : {}]}
              value={d}
              onChangeText={(t) => handleDigit(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: color }, (loading || code.length < 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive it? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={[styles.resendLink, { color }]}>{resending ? 'Sending…' : 'Resend code'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c4a6e' },
  back: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 6 },
  top: { flex: 0.3, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 34, fontWeight: '800', color: '#fbbf24', letterSpacing: -1 },
  subtitle: { color: '#7dd3fc', marginTop: 6, fontSize: 13 },

  form: {
    flex: 0.7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  desc: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  otpBox: {
    width: 46,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    backgroundColor: '#f9fafb',
  },

  button: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendLabel: { color: '#9ca3af', fontSize: 13 },
  resendTimer: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  resendLink: { fontSize: 13, fontWeight: '700' },
});
