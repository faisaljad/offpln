import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ToastConfig } from 'react-native-toast-message';

const TYPES = {
  success: {
    bg: '#0f172a',
    accent: '#22c55e',
    icon: 'checkmark-circle' as const,
    iconColor: '#22c55e',
  },
  error: {
    bg: '#0f172a',
    accent: '#ef4444',
    icon: 'close-circle' as const,
    iconColor: '#ef4444',
  },
  info: {
    bg: '#0f172a',
    accent: '#38bdf8',
    icon: 'information-circle' as const,
    iconColor: '#38bdf8',
  },
};

function ToastCard({
  type,
  text1,
  text2,
}: {
  type: keyof typeof TYPES;
  text1?: string;
  text2?: string;
}) {
  const t = TYPES[type];
  return (
    <View style={[styles.card, { borderLeftColor: t.accent }]}>
      <View style={[styles.iconWrap, { backgroundColor: t.accent + '22' }]}>
        <Ionicons name={t.icon} size={22} color={t.iconColor} />
      </View>
      <View style={styles.body}>
        {!!text1 && <Text style={styles.title} numberOfLines={2}>{text1}</Text>}
        {!!text2 && <Text style={styles.subtitle} numberOfLines={2}>{text2}</Text>}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <ToastCard type="success" text1={text1} text2={text2} />
  ),
  error: ({ text1, text2 }) => (
    <ToastCard type="error" text1={text1} text2={text2} />
  ),
  info: ({ text1, text2 }) => (
    <ToastCard type="info" text1={text1} text2={text2} />
  ),
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    minWidth: '85%',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
});
