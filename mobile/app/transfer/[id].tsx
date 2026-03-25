import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; gradient: [string, string] }> = {
  LISTED:      { bg: '#dbeafe', text: '#1d4ed8', label: 'Listed', gradient: ['#3b82f6', '#1d4ed8'] },
  REQUESTED:   { bg: '#fef3c7', text: '#d97706', label: 'Buyer Requested', gradient: ['#fbbf24', '#d97706'] },
  OTP_PENDING: { bg: '#ede9fe', text: '#7c3aed', label: 'Awaiting Your Confirmation', gradient: ['#8b5cf6', '#7c3aed'] },
  COMPLETED:   { bg: '#d1fae5', text: '#059669', label: 'Completed', gradient: ['#34d399', '#059669'] },
  REJECTED:    { bg: '#fee2e2', text: '#dc2626', label: 'Rejected', gradient: ['#f87171', '#dc2626'] },
  CANCELLED:   { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled', gradient: ['#9ca3af', '#6b7280'] },
};

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getTransfer(id as string)
      .then((res: any) => setTransfer(res))
      .catch((err: any) => setError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

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

  async function handleConfirm() {
    const code = digits.join('');
    if (code.length < 6) {
      Toast.show({ type: 'error', text1: 'Enter the full 6-digit code from your email' });
      return;
    }
    setConfirming(true);
    try {
      await api.confirmTransfer(id as string, code);
      Toast.show({ type: 'success', text1: 'Transfer complete!', text2: 'Ownership has been transferred' });
      router.replace('/(tabs)/investments');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Confirmation failed' });
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setConfirming(false);
    }
  }

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  async function handleResendOtp() {
    setResending(true);
    try {
      await api.resendTransferOtp(id as string);
      Toast.show({ type: 'success', text1: 'OTP resent', text2: 'Check your email for a new code' });
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      startCooldown();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to resend OTP' });
    } finally {
      setResending(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.cancelTransfer(id as string);
      Toast.show({ type: 'success', text1: 'Listing cancelled' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Cancel failed' });
    } finally {
      setCancelling(false);
    }
  }

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(Math.round(n))}`;
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0284c7" /></View>;

  if (error || !transfer) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        </View>
        <Text style={styles.errorText}>{error || 'Transfer not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const st = STATUS_STYLES[transfer.status] ?? { bg: '#f3f4f6', text: '#6b7280', label: transfer.status, gradient: ['#9ca3af', '#6b7280'] };
  const prop = transfer.investment?.property;
  const isOtpPending = transfer.status === 'OTP_PENDING';
  const canCancel = transfer.status === 'LISTED';
  const isRejected = transfer.status === 'REJECTED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Share Transfer</Text>
        <LinearGradient colors={st.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBadge}>
          <Text style={styles.statusText}>{st.label}</Text>
        </LinearGradient>
      </View>

      {/* Property info */}
      <View style={styles.propertyCardWrap}>
        <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.propertyCard}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <Text style={styles.propTitle} numberOfLines={2}>{prop?.title ?? '--'}</Text>
          <View style={styles.propLocationRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.6)" />
            <Text style={styles.propLocation}>{prop?.location ?? '--'}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{transfer.investment?.sharesPurchased * 10}%</Text>
              <Text style={styles.statLbl}>Stake</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{prop?.roi}%</Text>
              <Text style={styles.statLbl}>ROI</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{formatCurrency(transfer.askPrice)}</Text>
              <Text style={styles.statLbl}>Ask Price</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Parties */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Transfer Parties</Text>
        <View style={styles.partiesContainer}>
          {/* Seller */}
          <View style={styles.partyBlock}>
            <LinearGradient colors={['#fef2f2', '#fee2e2']} style={styles.partyAvatar}>
              <Text style={styles.partyAvatarText}>
                {transfer.seller?.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </LinearGradient>
            <Text style={styles.partyRole}>Seller (You)</Text>
            <Text style={styles.partyName} numberOfLines={1}>{transfer.seller?.name}</Text>
          </View>

          {/* Arrow connector */}
          <View style={styles.arrowConnector}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={14} color="#0284c7" />
            </View>
            <View style={styles.arrowLine} />
          </View>

          {/* Buyer */}
          {transfer.buyer ? (
            <View style={styles.partyBlock}>
              <LinearGradient colors={['#f0fdf4', '#d1fae5']} style={styles.partyAvatar}>
                <Text style={[styles.partyAvatarText, { color: '#059669' }]}>
                  {transfer.buyer.name?.charAt(0)?.toUpperCase() || 'B'}
                </Text>
              </LinearGradient>
              <Text style={styles.partyRole}>Buyer</Text>
              <Text style={styles.partyName} numberOfLines={1}>{transfer.buyer.name}</Text>
            </View>
          ) : (
            <View style={styles.partyBlock}>
              <View style={styles.partyAvatarEmpty}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" />
              </View>
              <Text style={styles.partyRole}>Buyer</Text>
              <Text style={styles.noBuyerText}>Waiting...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rejection note */}
      {isRejected && transfer.rejectionNote && (
        <View style={styles.rejectionCard}>
          <View style={styles.rejectionAccent} />
          <View style={styles.rejectionContent}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#dc2626" />
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            </View>
            <Text style={styles.rejectionNote}>{transfer.rejectionNote}</Text>
          </View>
        </View>
      )}

      {/* OTP Confirmation */}
      {isOtpPending && (
        <View style={styles.otpCard}>
          <View style={styles.otpHeader}>
            <View style={styles.otpIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.otpTitle}>Confirm Transfer</Text>
              <Text style={styles.otpSubtitle}>Enter the 6-digit code from your email</Text>
            </View>
          </View>
          <Text style={styles.otpDesc}>
            Your transfer has been approved. Enter the 6-digit code sent to your email to complete the ownership transfer.
          </Text>
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                style={[styles.otpBox, d ? styles.otpBoxFilled : {}]}
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
            style={[styles.confirmBtnWrap, (confirming || digits.join('').length < 6) && { opacity: 0.4 }]}
            onPress={handleConfirm}
            disabled={confirming || digits.join('').length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
              {confirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Complete Transfer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendBtn, (resending || resendCooldown > 0) && { opacity: 0.5 }]}
            onPress={handleResendOtp}
            disabled={resending || resendCooldown > 0}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <Text style={styles.resendBtnText}>
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel button */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}
        >
          {cancelling ? <ActivityIndicator size="small" color="#ef4444" /> : (
            <>
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.cancelBtnText}>Cancel Listing</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* View investment link */}
      <TouchableOpacity
        style={styles.investLink}
        onPress={() => router.push(`/investment/${transfer.investmentId}`)}
        activeOpacity={0.8}
      >
        <View style={styles.investLinkIcon}>
          <Ionicons name="wallet-outline" size={16} color="#0284c7" />
        </View>
        <Text style={styles.investLinkText}>View Investment Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f8fafc' },
  errorIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  errorText: { color: '#6b7280', fontSize: 15, marginTop: 12, textAlign: 'center', letterSpacing: 0.1 },
  backBtn: { marginTop: 20, backgroundColor: '#0284c7', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 58, paddingBottom: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerBack: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  propertyCardWrap: { paddingHorizontal: 20, paddingTop: 20 },
  propertyCard: {
    borderRadius: 20, padding: 20, overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', top: -30, right: -30, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  propTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: 0.2 },
  propLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  propLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 0.1 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#fbbf24' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, letterSpacing: 0.3 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginTop: 16, padding: 20,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 16, letterSpacing: 0.2 },

  partiesContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  partyBlock: { alignItems: 'center', flex: 1 },
  partyAvatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  partyAvatarText: { fontSize: 18, fontWeight: '800', color: '#ef4444' },
  partyAvatarEmpty: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  partyRole: { fontSize: 10, color: '#94a3b8', letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: '600' },
  partyName: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2, maxWidth: 100, textAlign: 'center' },
  noBuyerText: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' },

  arrowConnector: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20 },
  arrowLine: { width: 12, height: 1.5, backgroundColor: '#e2e8f0' },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#bfdbfe',
  },

  otpCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 20, padding: 24,
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#ede9fe',
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  otpIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f3ff',
    justifyContent: 'center', alignItems: 'center',
  },
  otpTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', letterSpacing: 0.1 },
  otpSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  otpDesc: { color: '#64748b', fontSize: 13, lineHeight: 20, marginBottom: 24 },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderWidth: 2, borderColor: '#e2e8f0',
    borderRadius: 14, textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#0f172a',
    backgroundColor: '#f8fafc',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  otpBoxFilled: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  confirmBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  resendBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
  resendBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 13, letterSpacing: 0.1 },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, marginTop: 16,
    borderWidth: 1.5, borderColor: '#fecaca',
    borderRadius: 16, paddingVertical: 14, backgroundColor: '#fff',
  },
  cancelBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14, letterSpacing: 0.1 },

  rejectionCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 20, overflow: 'hidden', flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  rejectionAccent: { width: 4, backgroundColor: '#ef4444' },
  rejectionContent: { flex: 1, padding: 18 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#dc2626', letterSpacing: 0.1 },
  rejectionNote: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  investLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  investLinkIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center',
  },
  investLinkText: { flex: 1, color: '#0284c7', fontWeight: '600', fontSize: 14, letterSpacing: 0.1 },
});
