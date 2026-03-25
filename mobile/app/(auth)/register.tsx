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
} from 'react-native';
import { useState } from 'react';
import { router, Link } from 'expo-router';
import Toast from 'react-native-toast-message';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export default function RegisterScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill required fields' });
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.register(form);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0c4a6e' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Text style={styles.logo}>OffPlan</Text>
          <Text style={styles.subtitle}>Create Your Investor Account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Get Started</Text>

          {[
            { key: 'name', label: 'Full Name *', placeholder: 'Ahmed Al Mansouri', type: 'default' },
            { key: 'email', label: 'Email *', placeholder: 'investor@example.com', type: 'email-address' },
            { key: 'phone', label: 'Phone', placeholder: '+971501234567', type: 'phone-pad' },
            { key: 'password', label: 'Password *', placeholder: '••••••••', type: 'default', secure: true },
          ].map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={form[field.key as keyof typeof form]}
                onChangeText={(v) => update(field.key, v)}
                placeholder={field.placeholder}
                keyboardType={field.type as any}
                autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                secureTextEntry={field.secure}
              />
            </View>
          ))}

          <Text style={styles.hint}>
            Password must be at least 8 characters with one uppercase letter and number.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: '#fbbf24' },
  subtitle: { color: '#7dd3fc', marginTop: 6, fontSize: 13 },
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    flex: 1,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9fafb',
  },
  hint: { color: '#9ca3af', fontSize: 12, marginBottom: 20, lineHeight: 18 },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#6b7280', fontSize: 14 },
  link: { color: '#0284c7', fontWeight: '600', fontSize: 14 },
});
