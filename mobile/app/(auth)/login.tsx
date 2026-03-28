import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, Link } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris' | null>(null);

  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    checkBiometrics();
  }, []);

  async function checkBiometrics() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) return;

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('face');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('fingerprint');
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      setBiometricType('iris');
    }

    setBiometricAvailable(true);
  }

  async function handleLogin() {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.login({ email, password });
      if (res.otpRequired) {
        setOtpEmail(res.email);
        setOtp(['', '', '', '', '', '']);
        setOtpStep(true);
        Toast.show({ type: 'success', text1: 'Verification code sent', text2: `Check ${res.email}` });
      } else {
        // Fallback: direct login if OTP not required
        await setAuth(res.user, res.accessToken, res.refreshToken);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join('');
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Please enter the 6-digit code' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.verifyLoginOtp(otpEmail, code);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    try {
      await api.login({ email, password });
      setOtp(['', '', '', '', '', '']);
      Toast.show({ type: 'success', text1: 'New code sent' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to resend' });
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(text: string, index: number) {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleBiometricLogin() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to OffPlan',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
          Toast.show({ type: 'error', text1: 'Biometric authentication failed' });
        }
        return;
      }

      setLoading(true);
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        Toast.show({ type: 'error', text1: 'Please sign in with your password first to enable biometric login.' });
        return;
      }

      const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        Toast.show({ type: 'error', text1: 'Session expired. Please log in with your password.' });
        return;
      }

      const json = await res.json();
      const data = json?.data ?? json;

      const userStr = await SecureStore.getItemAsync('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        Toast.show({ type: 'error', text1: 'Please log in with your password first' });
        return;
      }

      await setAuth(user, data.accessToken, data.refreshToken ?? refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message || 'Biometric login failed' });
    } finally {
      setLoading(false);
    }
  }

  function biometricIcon() {
    if (biometricType === 'face') return 'scan-outline';
    return 'finger-print-outline';
  }

  function biometricLabel() {
    if (biometricType === 'face') return 'Sign in with Face ID';
    return 'Sign in with Fingerprint';
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={['#0c4a6e', '#0369a1', '#075985']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerSafe}>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="business" size={34} color="#fbbf24" />
              </View>
              <Text style={styles.logo}>OffPlan</Text>
              <Text style={styles.subtitle}>Fractional Property Investment</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.form}>
          {!otpStep ? (
            <>
              <View style={styles.formHeader}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.desc}>Sign in to your investor account</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="investor@example.com"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#cbd5e1"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#94a3b8'] : ['#0284c7', '#0369a1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {biometricAvailable && !loading && (
                <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin} activeOpacity={0.7}>
                  <View style={styles.biometricIconCircle}>
                    <Ionicons name={biometricIcon() as any} size={24} color="#0284c7" />
                  </View>
                  <Text style={styles.biometricText}>{biometricLabel()}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Register</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          ) : (
            <>
              <View style={styles.formHeader}>
                <TouchableOpacity onPress={() => setOtpStep(false)} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.desc}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.otpEmailText}>{otpEmail}</Text>
                </Text>
              </View>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { otpRefs.current[i] = ref; }}
                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#94a3b8'] : ['#0284c7', '#0369a1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Verify & Sign In</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={styles.resendBtn}>
                <Ionicons name="refresh-outline" size={16} color="#0284c7" />
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c4a6e',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerSafe: {
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    paddingBottom: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  decorCircle3: {
    position: 'absolute',
    top: 60,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: '#93c5fd',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  form: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    marginTop: -16,
  },
  formHeader: {
    marginBottom: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  desc: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  otpEmailText: {
    color: '#0284c7',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 15,
    color: '#0f172a',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    backgroundColor: '#eff6ff',
  },
  biometricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricText: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  link: {
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 14,
  },

  // OTP step
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  otpInputFilled: {
    borderColor: '#0284c7',
    backgroundColor: '#eff6ff',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 12,
  },
  resendText: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: 14,
  },
});
