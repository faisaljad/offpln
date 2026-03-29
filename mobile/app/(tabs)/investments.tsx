import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';

interface Transfer {
  id: string;
  status: string;
}

interface Payout {
  id: string;
  profitAmount: number;
  totalReturn: number;
  status: string;
  paidAt?: string;
}

interface Investment {
  id: string;
  sharesPurchased: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  property: { title: string; location: string; roi: number; status: string; totalPrice: number; soldPrice: number | null };
  payments: { status: string; amount: number; dueDate?: string }[];
  transfer?: Transfer | null;
  payout?: Payout | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  COMPLETED: '#6366f1',
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: 'time-outline',
  APPROVED: 'checkmark-circle-outline',
  REJECTED: 'close-circle-outline',
  COMPLETED: 'ribbon-outline',
};

const TRANSFER_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  PENDING_APPROVAL: { bg: '#fff7ed', text: '#c2410c', label: 'Pending Approval', icon: 'time-outline' },
  LISTED:           { bg: '#eff6ff', text: '#1d4ed8', label: 'Listed for Sale',  icon: 'storefront-outline' },
  REQUESTED:        { bg: '#faf5ff', text: '#7c3aed', label: 'Buyer Requested',  icon: 'person-outline' },
  OTP_PENDING:      { bg: '#f0fdf4', text: '#15803d', label: 'Confirm Transfer', icon: 'shield-checkmark-outline' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InvestmentsScreen() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res: any = await api.getMyInvestments();
      setInvestments(res.investments || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load investments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(n)}`;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPayoutValue = investments.reduce((sum, inv) => sum + (inv.payout?.totalReturn || 0), 0);

  function renderHeader() {
    return (
      <LinearGradient
        colors={['#0c4a6e', '#0369a1', '#0284c7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioHeader}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.portfolioValuesRow}>
          <View style={styles.portfolioValueBlock}>
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>{formatCurrency(totalInvested)}</Text>
          </View>
          {totalPayoutValue > 0 && (
            <View style={styles.portfolioValueBlock}>
              <Text style={styles.portfolioLabel}>Total Payouts</Text>
              <Text style={styles.portfolioValue}>{formatCurrency(totalPayoutValue)}</Text>
            </View>
          )}
        </View>
        <View style={styles.portfolioStats}>
          <View style={styles.portfolioStat}>
            <View style={styles.portfolioStatIcon}>
              <Ionicons name="briefcase-outline" size={14} color="#7dd3fc" />
            </View>
            <View>
              <Text style={styles.portfolioStatValue}>{investments.length}</Text>
              <Text style={styles.portfolioStatLabel}>Investments</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  function renderItem({ item }: { item: Investment }) {
    const paidCount = item.payments?.filter((p) => p.status === 'PAID').length || 0;
    const totalPayments = item.payments?.length || 1;
    const nextPayment = item.payments?.find((p) => p.status === 'PENDING' && p.dueDate);
    const transferStyle = item.transfer ? TRANSFER_STYLES[item.transfer.status] : null;
    const progressPercent = (paidCount / totalPayments) * 100;
    const isSold = item.property.status === 'SOLD';
    const hasPayout = !!item.payout;
    const payoutPaid = item.payout?.status === 'PAID';

    return (
      <TouchableOpacity
        style={[styles.card, isSold && styles.soldCard]}
        onPress={() => router.push(`/investment/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Sold banner */}
        {isSold && (
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.soldBanner}
          >
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.soldBannerText}>Property Sold</Text>
            {hasPayout && (
              <View style={[styles.payoutLabel, payoutPaid ? styles.payoutLabelPaid : styles.payoutLabelPending]}>
                <Ionicons name={payoutPaid ? 'wallet' : 'time-outline'} size={11} color={payoutPaid ? '#059669' : '#d97706'} />
                <Text style={[styles.payoutLabelText, { color: payoutPaid ? '#059669' : '#d97706' }]}>
                  {payoutPaid ? 'Payout Received' : 'Payout Pending'}
                </Text>
              </View>
            )}
          </LinearGradient>
        )}

        <View style={styles.cardHeader}>
          <View style={[styles.cardHeaderIcon, isSold && { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="business" size={20} color={isSold ? '#059669' : '#0284c7'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.propertyTitle} numberOfLines={1}>{item.property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#94a3b8" />
              <Text style={styles.location}>{item.property.location}</Text>
            </View>
          </View>
          {!isSold && (
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
                <Ionicons name={(STATUS_ICONS[item.status] || 'ellipse-outline') as any} size={11} color={STATUS_COLORS[item.status]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
              </View>
              {item.property.status === 'SOLD_OUT' && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                  <Ionicons name="lock-closed" size={10} color="#64748b" />
                  <Text style={[styles.statusText, { color: '#64748b' }]}>SOLD OUT</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {transferStyle && (
          <TouchableOpacity
            style={[styles.transferPill, { backgroundColor: transferStyle.bg }]}
            onPress={() => router.push(`/transfer/${item.transfer!.id}`)}
          >
            <View style={[styles.transferIconCircle, { backgroundColor: transferStyle.text + '15' }]}>
              <Ionicons name={transferStyle.icon as any} size={13} color={transferStyle.text} />
            </View>
            <Text style={[styles.transferPillText, { color: transferStyle.text }]}>{transferStyle.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={transferStyle.text} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </TouchableOpacity>
        )}

        {isSold && item.payout ? (() => {
          const youPaid = item.payments?.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0) || 0;
          const profit = item.payout.totalReturn - youPaid;
          const roiPct = youPaid > 0 ? ((profit / youPaid) * 100).toFixed(1) : '0';
          return (
            <View style={styles.soldStatsGrid}>
              <View style={styles.soldStatItem}>
                <Text style={styles.soldStatLabel}>Shares</Text>
                <Text style={styles.soldStatValue}>{item.sharesPurchased} ({item.sharesPurchased * 10}%)</Text>
              </View>
              <View style={styles.soldStatItem}>
                <Text style={styles.soldStatLabel}>You Paid</Text>
                <Text style={styles.soldStatValue}>{formatCurrency(youPaid)}</Text>
              </View>
              <View style={styles.soldStatItem}>
                <Text style={styles.soldStatLabel}>Profit ({roiPct}%)</Text>
                <Text style={[styles.soldStatValue, { color: '#059669' }]}>+{formatCurrency(profit)}</Text>
              </View>
              <View style={[styles.soldStatItem, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.soldStatLabel}>Total Return</Text>
                <Text style={[styles.soldStatValue, { color: '#0c4a6e', fontWeight: '800' }]}>{formatCurrency(item.payout.totalReturn)}</Text>
              </View>
            </View>
          );
        })() : (
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.sharesPurchased}</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCurrency(item.totalAmount)}</Text>
              <Text style={styles.statLabel}>Invested</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{item.property.roi}%</Text>
              <Text style={styles.statLabel}>Exp. ROI</Text>
            </View>
          </View>
        )}

        <View style={styles.paymentSection}>
          <View style={styles.paymentLabelRow}>
            <Text style={styles.paymentLabel}>Payment Progress</Text>
            <Text style={styles.paymentCount}>{paidCount}/{totalPayments}</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        {nextPayment && (
          <View style={styles.nextPayment}>
            <View style={styles.nextPaymentIcon}>
              <Ionicons name="calendar-outline" size={12} color="#f59e0b" />
            </View>
            <Text style={styles.nextPaymentText}>
              Next: {formatCurrency(nextPayment.amount)} due {formatDate(nextPayment.dueDate!)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <FlatList
      data={investments}
      keyExtractor={(i) => i.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0284c7"
          colors={['#0284c7']}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={investments.length > 0 ? renderHeader : null}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="wallet-outline" size={48} color="#0284c7" />
            </LinearGradient>
          </View>
          {error ? (
            <>
              <Text style={styles.emptyTitle}>Something went wrong</Text>
              <Text style={styles.emptyDesc}>{error}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No investments yet</Text>
              <Text style={styles.emptyDesc}>Start building your property portfolio by exploring available investment opportunities</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0284c7', '#0369a1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.browseBtnGradient}
                >
                  <Ionicons name="search-outline" size={18} color="#fff" />
                  <Text style={styles.browseBtnText}>Browse Properties</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  listContent: { padding: 20, paddingBottom: 100, backgroundColor: '#f8fafc', flexGrow: 1 },

  // Portfolio Header
  portfolioHeader: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  portfolioValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  portfolioValueBlock: {
  },
  portfolioLabel: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  portfolioValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  portfolioStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  portfolioStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portfolioStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioStatValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  portfolioStatLabel: {
    color: '#93c5fd',
    fontSize: 11,
    marginTop: 1,
  },
  portfolioStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },

  // Investment Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden' as const,
  },
  soldCard: {
    borderWidth: 1.5,
    borderColor: '#d1fae5',
  },
  soldBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  soldBannerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
    flex: 1,
  },
  payoutLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  payoutLabelPaid: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  payoutLabelPending: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  payoutLabelText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  location: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Transfer Pill
  transferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  transferIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferPillText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Stats Grid
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginHorizontal: 20,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  soldStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
  },
  soldStatItem: {
    width: '47%' as any,
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  soldStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  soldStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },

  // Payment Progress
  paymentSection: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  paymentCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Next Payment
  nextPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nextPaymentIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPaymentText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  browseBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  browseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  browseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
