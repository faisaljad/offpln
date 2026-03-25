import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, SectionList,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import PaymentProofModal from '../components/PaymentProofModal';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING:      { bg: '#fef3c7', text: '#d97706', icon: 'time-outline' },
  UNDER_REVIEW: { bg: '#dbeafe', text: '#2563eb', icon: 'hourglass-outline' },
  PAID:         { bg: '#d1fae5', text: '#059669', icon: 'checkmark-circle-outline' },
  OVERDUE:      { bg: '#fee2e2', text: '#dc2626', icon: 'alert-circle-outline' },
  WAIVED:       { bg: '#ede9fe', text: '#7c3aed', icon: 'remove-circle-outline' },
};

function formatCurrency(n: number) {
  return 'AED ' + new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_ORDER = ['OVERDUE', 'PENDING', 'UNDER_REVIEW', 'PAID', 'WAIVED'];

export default function PaymentsScreen() {
  const [payments, setPayments]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    api.getMyPayments()
      .then((res: any) => setPayments(Array.isArray(res) ? res : []))
      .catch((err: any) => setError(err?.message || 'Failed to load payments'))
      .finally(() => setLoading(false));
  }

  function openProofModal(payment: any) {
    setSelectedPayment(payment);
    setProofModal(true);
  }

  function handleProofSuccess(updated: any) {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    setProofModal(false);
  }

  const filtered = activeFilter ? payments.filter((p) => p.status === activeFilter) : payments;

  const grouped: Record<string, { title: string; investmentId: string; data: any[] }> = {};
  for (const p of filtered) {
    const propId = p.investment?.property?.id ?? 'unknown';
    if (!grouped[propId]) {
      grouped[propId] = {
        title: p.investment?.property?.title ?? 'Unknown Property',
        investmentId: p.investment?.id,
        data: [],
      };
    }
    grouped[propId].data.push(p);
  }

  const sections = Object.values(grouped).map((g) => ({
    ...g,
    data: [...g.data].sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    ),
  }));

  const counts = {
    OVERDUE:      payments.filter((p) => p.status === 'OVERDUE').length,
    PENDING:      payments.filter((p) => p.status === 'PENDING').length,
    UNDER_REVIEW: payments.filter((p) => p.status === 'UNDER_REVIEW').length,
    PAID:         payments.filter((p) => p.status === 'PAID').length,
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (error)   return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Schedule</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        {counts.OVERDUE > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={13} color="#dc2626" />
            <Text style={[styles.summaryPillText, { color: '#dc2626' }]}>{counts.OVERDUE} overdue</Text>
          </View>
        )}
        {counts.UNDER_REVIEW > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="hourglass" size={13} color="#2563eb" />
            <Text style={[styles.summaryPillText, { color: '#2563eb' }]}>{counts.UNDER_REVIEW} under review</Text>
          </View>
        )}
        <View style={[styles.summaryPill, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="time" size={13} color="#d97706" />
          <Text style={[styles.summaryPillText, { color: '#d97706' }]}>{counts.PENDING} pending</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: '#d1fae5' }]}>
          <Ionicons name="checkmark-circle" size={13} color="#059669" />
          <Text style={[styles.summaryPillText, { color: '#059669' }]}>{counts.PAID} paid</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {([null, 'OVERDUE', 'PENDING', 'UNDER_REVIEW', 'PAID', 'WAIVED'] as (string | null)[]).map((f) => (
          <TouchableOpacity
            key={f ?? 'all'}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
              {f === 'UNDER_REVIEW' ? 'Review' : (f ?? 'All')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sections.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No payments found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => router.push(`/investment/${section.investmentId}` as any)}
            >
              <Text style={styles.sectionTitle} numberOfLines={1}>{section.title}</Text>
              <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}
          renderItem={({ item: payment }) => {
            const sc = STATUS_COLORS[payment.status] ?? STATUS_COLORS.PENDING;
            const canUpload = payment.status === 'PENDING' || payment.status === 'OVERDUE';
            return (
              <View style={styles.paymentItem}>
                <View style={[styles.statusDot, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon} size={16} color={sc.text} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{payment.name}</Text>
                  <View style={styles.paymentMeta}>
                    {payment.dueDate && (
                      <Text style={styles.paymentMetaText}>Due {formatDate(payment.dueDate)}</Text>
                    )}
                    {payment.milestone && (
                      <Text style={styles.paymentMetaText}>On {payment.milestone}</Text>
                    )}
                    {payment.paidAt && (
                      <Text style={[styles.paymentMetaText, { color: '#059669' }]}>
                        Paid {formatDate(payment.paidAt)}
                      </Text>
                    )}
                  </View>
                  {payment.status === 'UNDER_REVIEW' && (
                    <Text style={styles.reviewNote}>⏳ Proof submitted — awaiting admin review</Text>
                  )}
                  {payment.investorProofUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(payment.investorProofUrl)}>
                      <Text style={styles.proofLink}>📎 Your submitted proof</Text>
                    </TouchableOpacity>
                  )}
                  {payment.proofUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(payment.proofUrl)}>
                      <Text style={[styles.proofLink, { color: '#059669' }]}>✅ Admin receipt</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>
                      {payment.status === 'UNDER_REVIEW' ? 'REVIEW' : payment.status}
                    </Text>
                  </View>
                  {canUpload && (
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => openProofModal(payment)}>
                      <Ionicons name="cloud-upload-outline" size={12} color="#2563eb" />
                      <Text style={styles.uploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <PaymentProofModal
        visible={proofModal}
        payment={selectedPayment}
        onClose={() => setProofModal(false)}
        onSuccess={handleProofSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f9fafb' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:  { color: '#dc2626', fontSize: 14 },
  emptyText:  { color: '#9ca3af', fontSize: 15, marginTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  summaryPillText: { fontSize: 11, fontWeight: '600' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 4 },
  filterTab:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#f3f4f6' },
  filterTabActive:     { backgroundColor: '#2563eb' },
  filterTabText:       { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  filterTabTextActive: { color: '#fff' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#f3f4f6', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },

  paymentItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  statusDot:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  paymentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  paymentMetaText: { fontSize: 11, color: '#9ca3af' },
  reviewNote: { fontSize: 11, color: '#2563eb', marginTop: 3 },
  proofLink:  { fontSize: 11, color: '#2563eb', marginTop: 3 },

  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
  badge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  uploadBtnText: { fontSize: 10, color: '#2563eb', fontWeight: '600' },
});
