import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth';

const MENU_SECTIONS = [
  {
    items: [
      { icon: 'wallet-outline', label: 'My Investments', route: '/(tabs)/investments', color: '#0284c7', bg: '#eff6ff' },
      { icon: 'swap-horizontal-outline', label: 'My Transfers', route: '/my-transfers', color: '#7c3aed', bg: '#f5f3ff' },
      { icon: 'calendar-outline', label: 'Payment Schedule', route: '/payments', color: '#059669', bg: '#ecfdf5' },
    ],
  },
  {
    items: [
      { icon: 'notifications-outline', label: 'Notifications', route: '/notifications', color: '#f59e0b', bg: '#fffbeb' },
      { icon: 'help-circle-outline', label: 'Support', route: '/support', color: '#6366f1', bg: '#eef2ff' },
    ],
  },
];

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient
        colors={['#0c4a6e', '#0369a1', '#0284c7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        <View style={styles.avatarRing}>
          <LinearGradient
            colors={['#fbbf24', '#f59e0b', '#fbbf24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBorder}
          >
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone && (
          <View style={styles.phoneRow}>
            <View style={styles.phonePill}>
              <Ionicons name="call-outline" size={12} color="#7dd3fc" />
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {MENU_SECTIONS.map((section, sIndex) => (
        <View key={sIndex} style={styles.section}>
          {section.items.map((item, iIndex) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                iIndex < section.items.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconCircle}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
          <Ionicons name="chevron-forward" size={16} color="#fca5a5" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>OffPlan v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 70,
    paddingBottom: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle3: {
    position: 'absolute',
    top: 40,
    left: 50,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  avatarRing: {
    marginBottom: 16,
  },
  avatarBorder: {
    width: 102,
    height: 102,
    borderRadius: 51,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  email: {
    color: '#93c5fd',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  phoneRow: {
    marginTop: 10,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  phone: {
    color: '#bae6fd',
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fef2f2',
  },
  logoutIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 28,
    fontWeight: '500',
  },
});
