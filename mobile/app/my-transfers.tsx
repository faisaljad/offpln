import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: string; gradient: [string, string] }> = {
  PENDING_APPROVAL: { bg: '#fff7ed', text: '#c2410c', label: 'Pending Approval',    icon: 'time-outline', gradient: ['#fb923c', '#c2410c'] },
  LISTED:           { bg: '#eff6ff', text: '#1d4ed8', label: 'Listed',              icon: 'storefront-outline', gradient: ['#3b82f6', '#1d4ed8'] },
  REQUESTED:        { bg: '#faf5ff', text: '#7c3aed', label: 'Buyer Requested',     icon: 'person-outline', gradient: ['#8b5cf6', '#7c3aed'] },
  OTP_PENDING:      { bg: '#f0fdf4', text: '#15803d', label: 'Awaiting OTP',        icon: 'shield-checkmark-outline', gradient: ['#34d399', '#15803d'] },
  COMPLETED:        { bg: '#d1fae5', text: '#059669', label: 'Completed',           icon: 'checkmark-circle-outline', gradient: ['#34d399', '#059669'] },
  REJECTED:         { bg: '#fee2e2', text: '#dc2626', label: 'Rejected',            icon: 'close-circle-outline', gradient: ['#f87171', '#dc2626'] },
  CANCELLED:        { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled',           icon: 'ban-outline', gradient: ['#9ca3af', '#6b7280'] },
};

export default function MyTransfersScreen() {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'selling' | 'buying'>('selling');

  async function load() {
    try {
      const res: any = await api.getMyTransfers();
      setTransfers(Array.isArray(res) ? res : []);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(Math.round(n))}`;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const selling = transfers.filter((t) => t.sellerId === user?.id);
  const buying  = transfers.filter((t) => t.buyerId  === user?.id);
  const list    = tab === 'selling' ? selling : buying;

  function renderTransfer(t: any) {
    const st = STATUS_STYLES[t.status] ?? { bg: '#f3f4f6', text: '#6b7280', label: t.status, icon: 'help-outline', gradient: ['#9ca3af', '#6b7280'] };
    const prop = t.investment?.property;
    const isSeller = t.sellerId === user?.id;
    const canNavigate = isSeller && ['OTP_PENDING', 'LISTED', 'REQUESTED', 'PENDING_APPROVAL'].includes(t.status);

    return (
      <TouchableOpacity
        key={t.id}
        style={styles.card}
        onPress={() => canNavigate ? router.push(`/transfer/${t.id}`) : router.push(`/investment/${t.investmentId}`)}
        activeOpacity={0.88}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.propTitle} numberOfLines={1}>{prop?.title ?? '--'}</Text>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={12} color="#94a3b8" />
              <Text style={styles.propLocation}>{prop?.location ?? '--'}</Text>
            </View>
          </View>
          <LinearGradient colors={st.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBadge}>
            <Ionicons name={st.icon as any} size={11} color="#fff" />
            <Text style={styles.statusText}>{st.label}</Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{t.investment?.sharesPurchased * 10}%</Text>
            <Text style={styles.statLbl}>Stake</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCurrency(t.askPrice)}</Text>
            <Text style={styles.statLbl}>Ask Price</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{prop?.roi}%</Text>
            <Text style={styles.statLbl}>ROI</Text>
          </View>
        </View>

        {/* Counterparty */}
        {isSeller && t.buyer ? (
          <View style={styles.partyRow}>
            <View style={styles.partyAvatarSmall}>
              <Text style={styles.partyAvatarSmallText}>{t.buyer.name?.charAt(0)?.toUpperCase() || 'B'}</Text>
            </View>
            <Text style={styles.partyText}>Buyer: {t.buyer.name}</Text>
          </View>
        ) : !isSeller && t.seller ? (
          <View style={styles.partyRow}>
            <View style={[styles.partyAvatarSmall, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.partyAvatarSmallText, { color: '#ef4444' }]}>{t.seller.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
            </View>
            <Text style={styles.partyText}>Seller: {t.seller.name}</Text>
          </View>
        ) : null}

        {/* Rejection note */}
        {t.rejectionNote && (
          <View style={styles.rejectionBox}>
            <View style={styles.rejectionBoxAccent} />
            <Ionicons name="information-circle-outline" size={14} color="#dc2626" style={{ marginTop: 1 }} />
            <Text style={styles.rejectionText}>{t.rejectionNote}</Text>
          </View>
        )}

        <Text style={styles.dateText}>{formatDate(t.updatedAt)}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerDecorCircle1} />
        <View style={styles.headerDecorCircle2} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Transfers</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <View style={styles.tabsInner}>
          <TouchableOpacity
            style={[styles.tab, tab === 'selling' && styles.tabActive]}
            onPress={() => setTab('selling')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up-circle-outline" size={16} color={tab === 'selling' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, tab === 'selling' && styles.tabTextActive]}>
              Selling ({selling.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'buying' && styles.tabActive]}
            onPress={() => setTab('buying')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down-circle-outline" size={16} color={tab === 'buying' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, tab === 'buying' && styles.tabTextActive]}>
              Buying ({buying.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {list.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.emptyIconWrap}>
                <Ionicons name="swap-horizontal-outline" size={32} color="#0284c7" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {tab === 'selling' ? 'No listings yet' : 'No purchase requests yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {tab === 'selling'
                  ? 'List an approved investment for sale from the investment detail screen'
                  : 'Browse the marketplace to request a share purchase'}
              </Text>
              {tab === 'buying' && (
                <TouchableOpacity style={styles.marketBtnWrap} onPress={() => router.push('/(tabs)/marketplace')} activeOpacity={0.85}>
                  <LinearGradient colors={['#0284c7', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.marketBtn}>
                    <Ionicons name="storefront-outline" size={16} color="#fff" />
                    <Text style={styles.marketBtnText}>Go to Marketplace</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            list.map(renderTransfer)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 58, paddingBottom: 20,
    overflow: 'hidden',
  },
  headerDecorCircle1: {
    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDecorCircle2: {
    position: 'absolute', bottom: -30, left: 40, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  tabs: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabsInner: {
    flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 11,
  },
  tabActive: { backgroundColor: '#0284c7', shadowColor: '#0284c7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b', letterSpacing: 0.1 },
  tabTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  propTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', letterSpacing: 0.1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  propLocation: { color: '#94a3b8', fontSize: 12, letterSpacing: 0.1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#f8fafc',
    borderRadius: 14, padding: 12, marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '800', color: '#0c4a6e', letterSpacing: 0.1 },
  statLbl: { fontSize: 10, color: '#94a3b8', marginTop: 3, letterSpacing: 0.3 },
  statDiv: { width: 1, backgroundColor: '#e2e8f0' },

  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  partyAvatarSmall: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  partyAvatarSmallText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  partyText: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  rejectionBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginTop: 6, marginBottom: 4, overflow: 'hidden',
  },
  rejectionBoxAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#ef4444', borderRadius: 2,
  },
  rejectionText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },

  dateText: { fontSize: 11, color: '#cbd5e1', marginTop: 6, textAlign: 'right', letterSpacing: 0.2 },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', letterSpacing: 0.1 },
  emptyDesc: { color: '#94a3b8', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  marketBtnWrap: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  marketBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
  },
  marketBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },
});
