import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useState, useRef } from 'react';
import { router, Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export default function RegisterScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendOtp() {
    if (!form.name || !form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill required fields' });
      return;
    }
    if (form.password.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters' });
      return;
    }
    setLoading(true);
    try {
      await api.sendRegisterOtp(form.email);
      setOtp(['', '', '', '', '', '']);
      setOtpStep(true);
      Toast.show({ type: 'success', text1: 'Verification code sent', text2: `Check ${form.email}` });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to send code' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister() {
    const code = otp.join('');
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Please enter the 6-digit code' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.register({ ...form, otpCode: code });
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    try {
      await api.sendRegisterOtp(form.email);
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

  const INPUT_FIELDS = [
    { key: 'name', label: 'Full Name', placeholder: 'Ahmed Al Mansouri', type: 'default', icon: 'person-outline' },
    { key: 'email', label: 'Email', placeholder: 'investor@example.com', type: 'email-address', icon: 'mail-outline' },
    { key: 'phone', label: 'Phone (optional)', placeholder: '+971501234567', type: 'phone-pad', icon: 'call-outline' },
    { key: 'password', label: 'Password', placeholder: '••••••••', type: 'default', secure: true, icon: 'lock-closed-outline' },
  ];

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

            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="business" size={30} color="#fbbf24" />
              </View>
              <Text style={styles.logo}>OffPlan</Text>
              <Text style={styles.subtitle}>Create Your Investor Account</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.form}>
          {!otpStep ? (
            <>
              <View style={styles.formHeader}>
                <Text style={styles.title}>Get Started</Text>
                <Text style={styles.desc}>Fill in your details to create an account</Text>
              </View>

              {INPUT_FIELDS.map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {field.label} {field.key !== 'phone' && <Text style={styles.required}>*</Text>}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name={field.icon as any} size={18} color="#94a3b8" style={styles.inputIconStyle} />
                    <TextInput
                      style={styles.input}
                      value={form[field.key as keyof typeof form]}
                      onChangeText={(v) => update(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor="#cbd5e1"
                      keyboardType={field.type as any}
                      autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                      secureTextEntry={field.secure}
                    />
                  </View>
                </View>
              ))}

              <Text style={styles.hint}>
                Password must be at least 8 characters with one uppercase letter and number.
              </Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
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
                      <Text style={styles.buttonText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Sign In</Text>
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
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.desc}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.otpEmailText}>{form.email}</Text>
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
                onPress={handleVerifyAndRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#94a3b8'] : ['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Verify & Create Account</Text>
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
    paddingBottom: 44,
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
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: '#93c5fd',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  form: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    marginTop: -16,
  },
  formHeader: {
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  desc: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  otpEmailText: {
    color: '#0284c7',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  required: {
    color: '#ef4444',
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
  inputIconStyle: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
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
