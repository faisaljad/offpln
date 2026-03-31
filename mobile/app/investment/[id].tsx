import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import HtmlText from '../../components/HtmlText';
import PaymentProofModal from '../../components/PaymentProofModal';

const STATUS_COLORS: Record<string, { bg: string; text: string; gradient: [string, string] }> = {
  PENDING:   { bg: '#fef3c7', text: '#d97706', gradient: ['#fbbf24', '#d97706'] },
  APPROVED:  { bg: '#d1fae5', text: '#059669', gradient: ['#34d399', '#059669'] },
  REJECTED:  { bg: '#fee2e2', text: '#dc2626', gradient: ['#f87171', '#dc2626'] },
  COMPLETED: { bg: '#ede9fe', text: '#7c3aed', gradient: ['#8b5cf6', '#7c3aed'] },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:      { bg: '#fef3c7', text: '#d97706' },
  UNDER_REVIEW: { bg: '#dbeafe', text: '#2563eb' },
  PAID:         { bg: '#d1fae5', text: '#059669' },
  OVERDUE:      { bg: '#fee2e2', text: '#dc2626' },
  WAIVED:       { bg: '#f1f5f9', text: '#94a3b8' },
};

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [investment, setInvestment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listModal, setListModal] = useState(false);
  const [tcModal, setTcModal] = useState(false);
  const [askPrice, setAskPrice] = useState('');
  const [listNotes, setListNotes] = useState('');
  const [listing, setListing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [proofModal, setProofModal] = useState(false);
  const [proofPayment, setProofPayment] = useState<any>(null);
  const [tcAgreed, setTcAgreed] = useState(false);
  const [listingTerms, setListingTerms] = useState('');

  useEffect(() => {
    api.getInvestment(id as string)
      .then((res: any) => {
        setInvestment(res);
        const paid = (res.payments ?? []).filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
        setAskPrice(String(Math.round(paid || res.totalAmount)));
      })
      .catch((err: any) => setError(err?.message || 'Failed to load investment'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCancel(transferId: string) {
    setCancelling(true);
    try {
      await api.cancelTransfer(transferId);
      Toast.show({ type: 'success', text1: 'Listing removed' });
      // Reload investment to refresh transfer state
      const res: any = await api.getInvestment(id as string);
      setInvestment(res);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to remove listing' });
    } finally {
      setCancelling(false);
    }
  }

  async function handlePriceNext() {
    if (!askPrice || isNaN(Number(askPrice))) {
      Toast.show({ type: 'error', text1: 'Enter a valid ask price' });
      return;
    }
    // Fetch T&C before showing modal
    try {
      const settings: any = await api.getSettings();
      setListingTerms(settings?.transferListingTerms ?? '');
    } catch {
      setListingTerms('');
    }
    setTcAgreed(false);
    setListModal(false);
    setTcModal(true);
  }

  async function handleListForSale() {
    setListing(true);
    try {
      await api.createTransfer({ investmentId: id as string, askPrice: Number(askPrice), notes: listNotes });
      setTcModal(false);
      Toast.show({ type: 'success', text1: 'Listing submitted!', text2: 'Pending admin approval' });
      const res: any = await api.getInvestment(id as string);
      setInvestment(res);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to list' });
    } finally {
      setListing(false);
    }
  }

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(n)}`;
  }

  function formatDate(d?: string) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (error || !investment) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        </View>
        <Text style={styles.errorText}>{error || 'Investment not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSold = investment.property?.status === 'SOLD';
  const paidAmount = (investment.payments ?? []).filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0);
  const investorReturn = isSold && investment.property?.soldPrice && investment.property?.totalShares
    ? investment.property.soldPrice * (investment.sharesPurchased / investment.property.totalShares)
    : 0;
  const actualRoi = isSold && paidAmount > 0
    ? (((investorReturn - paidAmount) / paidAmount) * 100).toFixed(1)
    : null;
  const displayStatus = isSold ? 'SOLD' : investment.status;
  const statusColor = isSold
    ? { bg: '#d1fae5', text: '#059669', gradient: ['#059669', '#047857'] as [string, string] }
    : STATUS_COLORS[investment.status] ?? { bg: '#f3f4f6', text: '#6b7280', gradient: ['#9ca3af', '#6b7280'] as [string, string] };
  const activePayments = (investment.payments ?? []).filter((p: any) => p.status !== 'WAIVED');
  const paidCount = activePayments.filter((p: any) => p.status === 'PAID').length;
  const totalPayments = activePayments.length || 1;
  const progressPct = Math.round((paidCount / totalPayments) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{investment.property?.title}</Text>
        <LinearGradient colors={statusColor.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBadge}>
          <Text style={styles.statusText}>{displayStatus}</Text>
        </LinearGradient>
      </View>

      {/* Summary card */}
      <View style={styles.summaryCardWrap}>
        <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.summaryLocationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.location}>{investment.property?.location}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{investment.sharesPurchased}</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{actualRoi ?? investment.property?.roi}%</Text>
              <Text style={styles.statLabel}>{isSold ? 'Actual ROI' : 'Exp. ROI'}</Text>
            </View>
            {!isSold && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatCurrency(investment.totalAmount)}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </>
            )}
          </View>

          {isSold ? (
            <View style={{ gap: 8, marginTop: 14, marginBottom: 4 }}>
              <View style={styles.paidUnpaidRow}>
                <View style={styles.paidUnpaidItem}>
                  <Text style={styles.paidUnpaidLabel}>You Paid</Text>
                  <Text style={styles.paidUnpaidValue}>{formatCurrency(paidAmount)}</Text>
                </View>
                <View style={styles.paidUnpaidDivider} />
                <View style={styles.paidUnpaidItem}>
                  <Text style={styles.paidUnpaidLabel}>Profit</Text>
                  <Text style={[styles.paidUnpaidValue, { color: '#4ade80' }]}>+{formatCurrency(investorReturn - paidAmount)}</Text>
                </View>
              </View>
              <View style={[styles.paidUnpaidRow, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
                <View style={styles.paidUnpaidItem}>
                  <Text style={[styles.paidUnpaidLabel, { color: 'rgba(251,191,36,0.7)' }]}>Total Return</Text>
                  <Text style={[styles.paidUnpaidValue, { color: '#fbbf24', fontSize: 18 }]}>{formatCurrency(investorReturn)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.paidUnpaidRow}>
              <View style={styles.paidUnpaidItem}>
                <Text style={styles.paidUnpaidLabel}>Paid</Text>
                <Text style={styles.paidUnpaidValue}>{formatCurrency(paidAmount)}</Text>
              </View>
              <View style={styles.paidUnpaidDivider} />
              <View style={styles.paidUnpaidItem}>
                <Text style={styles.paidUnpaidLabel}>Unpaid</Text>
                <Text style={[styles.paidUnpaidValue, { color: '#fbbf24' }]}>{formatCurrency(
                  (investment.payments ?? []).filter((p: any) => p.status !== 'PAID' && p.status !== 'WAIVED').reduce((s: number, p: any) => s + p.amount, 0)
                )}</Text>
              </View>
            </View>
          )}

          <Text style={styles.dateText}>Invested on {formatDate(investment.createdAt)}</Text>
        </LinearGradient>
      </View>

      {/* Payment Progress */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Progress</Text>
          <View style={styles.progressLabelPill}>
            <Text style={styles.progressLabel}>{paidCount}/{totalPayments} paid</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#34d399', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPct}%` }]}
          />
        </View>
        <Text style={styles.progressPct}>{progressPct}% complete</Text>
      </View>

      {/* Payments list */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        {investment.payments?.map((payment: any, i: number) => {
          const pc = PAYMENT_STATUS_COLORS[payment.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
          // Determine if payment is enabled
          const plan = investment.property?.paymentPlan;
          const inst = plan?.installments?.find((x: any) => x.name === payment.name);
          const isDateType = !inst || inst.dueType === 'date';
          const isMilestoneType = inst?.dueType === 'milestone';
          const currentMs = investment.property?.currentMilestone;
          const milestones = (plan?.installments ?? []).filter((x: any) => x.dueType === 'milestone');
          const currentMsIdx = milestones.findIndex((x: any) => x.dueValue === currentMs);
          const thisMsIdx = milestones.findIndex((x: any) => x.name === payment.name);
          const isEnabled = payment.status === 'PAID' || payment.status === 'UNDER_REVIEW' || (
            isDateType ? (!payment.dueDate || new Date(payment.dueDate) <= new Date()) :
            isMilestoneType ? (currentMsIdx >= 0 && currentMsIdx >= thisMsIdx) :
            true
          );
          const isDownPayment = payment.name === 'Down Payment';
          const isWaived = payment.status === 'WAIVED';
          const enabled = isDownPayment || isEnabled;
          return (
            <View key={payment.id ?? i} style={[styles.paymentItem, i > 0 && styles.paymentItemBorder, (isWaived || !enabled) && { opacity: 0.4 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.paymentName, isWaived && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>{payment.name}</Text>
                  {isWaived && <Text style={{ fontSize: 10, color: '#94a3b8' }}>✓ Waived — property sold</Text>}
                  {!isWaived && !enabled && <Text style={{ fontSize: 10, color: '#94a3b8' }}>🔒 Not due yet</Text>}
                </View>
                {payment.dueDate && (
                  <Text style={styles.paymentDue}>Due: {formatDate(payment.dueDate)}</Text>
                )}
                {payment.milestone && (
                  <Text style={styles.paymentDue}>On: {payment.milestone}</Text>
                )}
                {payment.paidAt && (
                  <Text style={[styles.paymentDue, { color: '#059669' }]}>Paid: {formatDate(payment.paidAt)}</Text>
                )}
                {payment.status === 'UNDER_REVIEW' && (
                  <Text style={[styles.paymentDue, { color: '#2563eb' }]}>Awaiting admin review</Text>
                )}
                {payment.investorProofUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(payment.investorProofUrl)}>
                    <Text style={styles.proofLink}>Your submitted proof</Text>
                  </TouchableOpacity>
                )}
                {payment.proofUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(payment.proofUrl)}>
                    <Text style={[styles.proofLink, { color: '#059669' }]}>Admin receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <View style={[styles.paymentBadge, { backgroundColor: pc.bg }]}>
                  <Text style={[styles.paymentBadgeText, { color: pc.text }]}>
                    {payment.status === 'UNDER_REVIEW' ? 'REVIEW' : payment.status}
                  </Text>
                </View>
                {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && enabled && !isWaived && (
                  <TouchableOpacity
                    style={styles.uploadProofBtn}
                    onPress={() => { setProofPayment(payment); setProofModal(true); }}
                  >
                    <Ionicons name="cloud-upload-outline" size={12} color="#0284c7" />
                    <Text style={styles.uploadProofBtnText}>Upload Proof</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Payout */}
      {investment.payout && (
        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <View style={styles.payoutIconWrap}>
              <Ionicons name="cash-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.payoutTitle}>Your ROI Payout</Text>
            <View style={[styles.payoutStatusPill, { backgroundColor: investment.payout.status === 'PAID' ? '#d1fae5' : '#fef3c7' }]}>
              <Text style={[styles.payoutStatusText, { color: investment.payout.status === 'PAID' ? '#059669' : '#d97706' }]}>
                {investment.payout.status === 'PAID' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.payoutStatsRow}>
            <View style={styles.payoutStatCard}>
              <Text style={styles.payoutStatLabel}>You Paid</Text>
              <Text style={[styles.payoutProfitVal, { color: '#64748b' }]}>{formatCurrency(
                investment.payments
                  ?.filter((p: any) => p.status === 'PAID')
                  .reduce((s: number, p: any) => s + p.amount, 0) || 0
              )}</Text>
            </View>
            <View style={styles.payoutStatCard}>
              <Text style={styles.payoutStatLabel}>Profit</Text>
              <Text style={styles.payoutProfitVal}>+{formatCurrency(
                investment.payout.totalReturn - (
                  investment.payments
                    ?.filter((p: any) => p.status === 'PAID')
                    .reduce((s: number, p: any) => s + p.amount, 0) || 0
                )
              )}</Text>
            </View>
            <View style={[styles.payoutStatCard, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.payoutStatLabel}>Total Return</Text>
              <Text style={styles.payoutTotalVal}>{formatCurrency(investment.payout.totalReturn)}</Text>
            </View>
          </View>
          {investment.payout.receiptUrl && (
            <TouchableOpacity style={styles.payoutReceipt} onPress={() => Linking.openURL(investment.payout.receiptUrl)}>
              <Ionicons name="document-attach-outline" size={16} color="#0284c7" />
              <Text style={styles.payoutReceiptText}>View Payment Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Transfer History */}
      {investment.transfer?.status === 'COMPLETED' && (
        <View style={styles.card}>
          <View style={styles.transferHeader}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.transferHeaderIcon}>
              <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
            </LinearGradient>
            <Text style={styles.transferHeaderTitle}>Transfer History</Text>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#7c3aed" />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>

          <View style={styles.transferHistoryRow}>
            <View style={styles.transferParty}>
              <View style={[styles.transferPartyIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="arrow-up-circle-outline" size={18} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.transferPartyRole}>Previous Owner</Text>
                <Text style={styles.transferPartyName}>{investment.transfer.seller?.name ?? '--'}</Text>
                <Text style={styles.transferPartyEmail}>{investment.transfer.seller?.email ?? ''}</Text>
              </View>
            </View>

            <View style={styles.transferArrow}>
              <View style={styles.transferArrowLine} />
              <View style={styles.transferArrowCircle}>
                <Ionicons name="arrow-forward" size={12} color="#0284c7" />
              </View>
              <View style={styles.transferArrowLine} />
            </View>

            <View style={styles.transferParty}>
              <View style={[styles.transferPartyIcon, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="arrow-down-circle-outline" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.transferPartyRole}>New Owner (You)</Text>
                <Text style={styles.transferPartyName}>{investment.transfer.buyer?.name ?? '--'}</Text>
                <Text style={styles.transferPartyEmail}>{investment.transfer.buyer?.email ?? ''}</Text>
              </View>
            </View>
          </View>

          <View style={styles.transferMeta}>
            <View style={styles.transferMetaItem}>
              <Text style={styles.transferMetaLabel}>Transfer Price</Text>
              <Text style={styles.transferMetaValue}>{formatCurrency(investment.transfer.askPrice)}</Text>
            </View>
            <View style={styles.transferMetaItem}>
              <Text style={styles.transferMetaLabel}>Completed On</Text>
              <Text style={styles.transferMetaValue}>{formatDate(investment.transfer.updatedAt)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* List for Sale / Listing status */}
      {investment.status === 'APPROVED' && investment.property?.status !== 'SOLD' && (() => {
        const t = investment.transfer;
        const activeStatuses = ['PENDING_APPROVAL', 'LISTED', 'REQUESTED', 'OTP_PENDING'];
        const isActive = t && activeStatuses.includes(t.status);

        if (!isActive) {
          return (
            <TouchableOpacity style={styles.sellBtnWrap} onPress={() => setListModal(true)} activeOpacity={0.85}>
              <LinearGradient colors={['#0f172a', '#1e293b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sellBtn}>
                <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                <Text style={styles.sellBtnText}>List for Sale</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        const LISTING_STATE: Record<string, { icon: any; label: string; sub: string; color: string; bg: string; gradient: [string, string] }> = {
          PENDING_APPROVAL: { icon: 'time-outline',            label: 'Pending Admin Approval', sub: 'Your listing is under review',          color: '#d97706', bg: '#fffbeb', gradient: ['#fbbf24', '#f59e0b'] },
          LISTED:           { icon: 'storefront-outline',      label: 'Listed in Marketplace',  sub: 'Waiting for a buyer to request',       color: '#0284c7', bg: '#eff6ff', gradient: ['#38bdf8', '#0284c7'] },
          REQUESTED:        { icon: 'person-outline',          label: 'Buyer Requested',         sub: 'Cannot remove -- awaiting admin decision', color: '#7c3aed', bg: '#faf5ff', gradient: ['#a78bfa', '#7c3aed'] },
          OTP_PENDING:      { icon: 'shield-checkmark-outline',label: 'Confirm Transfer',        sub: 'Check your email for the OTP code',   color: '#059669', bg: '#f0fdf4', gradient: ['#34d399', '#059669'] },
        };

        const state = LISTING_STATE[t.status];
        return (
          <View style={styles.listingBanner}>
            <LinearGradient colors={[state.bg, '#fff']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.listingBannerGradient}>
              <View style={styles.listingBannerContent}>
                <View style={styles.listingBannerLeft}>
                  <View style={[styles.listingBannerIconWrap, { backgroundColor: state.color + '15' }]}>
                    <Ionicons name={state.icon} size={20} color={state.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listingBannerLabel, { color: state.color }]}>{state.label}</Text>
                    <Text style={styles.listingBannerSub}>{state.sub}</Text>
                    <Text style={[styles.listingBannerPrice, { color: state.color }]}>
                      {formatCurrency(t.askPrice)}
                    </Text>
                  </View>
                </View>
                <View style={styles.listingBannerRight}>
                  {t.status === 'OTP_PENDING' && (
                    <TouchableOpacity
                      style={styles.listingActionBtnWrap}
                      onPress={() => router.push(`/transfer/${t.id}`)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={state.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.listingActionBtn}>
                        <Text style={styles.listingActionBtnText}>Enter OTP</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {['PENDING_APPROVAL', 'LISTED'].includes(t.status) && (
                    <TouchableOpacity
                      style={[styles.listingCancelBtn, cancelling && { opacity: 0.5 }]}
                      onPress={handleCancel.bind(null, t.id)}
                      disabled={cancelling}
                    >
                      {cancelling
                        ? <ActivityIndicator size="small" color="#ef4444" />
                        : <Text style={styles.listingCancelBtnText}>Remove</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        );
      })()}

      {/* Property link */}
      <TouchableOpacity
        style={styles.propertyLink}
        onPress={() => router.push(`/property/${investment.property?.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.propertyLinkIcon}>
          <Ionicons name="home-outline" size={16} color="#0284c7" />
        </View>
        <Text style={styles.propertyLinkText}>View Property Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
      </TouchableOpacity>

      {/* Marketplace link */}
      <TouchableOpacity
        style={[styles.propertyLink, { marginTop: 0 }]}
        onPress={() => router.push('/(tabs)/marketplace')}
        activeOpacity={0.8}
      >
        <View style={[styles.propertyLinkIcon, { backgroundColor: '#f0fdf4' }]}>
          <Ionicons name="swap-horizontal-outline" size={16} color="#16a34a" />
        </View>
        <Text style={[styles.propertyLinkText, { color: '#16a34a' }]}>View Marketplace</Text>
        <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
      </TouchableOpacity>

      {/* T&C Modal */}
      <Modal visible={tcModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setTcModal(false); setListModal(true); }} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Listing Terms</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Summary */}
            <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tcSummaryCard}>
              <View style={styles.tcDecorCircle} />
              <Text style={styles.tcSummaryLabel}>You are listing</Text>
              <Text style={styles.tcSummaryProp} numberOfLines={1}>{investment.property?.title}</Text>
              <View style={styles.tcSummaryRow}>
                <Text style={styles.tcSummaryDetail}>{investment.sharesPurchased * 10}% stake</Text>
                <Text style={styles.tcSummaryDot}>.</Text>
                <Text style={styles.tcSummaryDetail}>Ask Price: AED {Number(askPrice).toLocaleString('en')}</Text>
              </View>
            </LinearGradient>

            {/* T&C content */}
            <View style={styles.tcContent}>
              {listingTerms ? (
                <HtmlText html={listingTerms} style={{ fontSize: 13, lineHeight: 21, color: '#374151' }} />
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>
                  By listing your investment for sale, you agree to our share transfer policy. The listing will be reviewed by our team before appearing on the marketplace.
                </Text>
              )}
            </View>

            {/* Agree checkbox */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setTcAgreed(!tcAgreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, tcAgreed && styles.checkboxChecked]}>
                {tcAgreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkLabel}>I have read and agree to the listing terms</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.listConfirmBtnWrap, (!tcAgreed || listing) && { opacity: 0.4 }]}
              onPress={handleListForSale}
              disabled={!tcAgreed || listing}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.listConfirmBtn}>
                {listing ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                    <Text style={styles.listConfirmBtnText}>List for Sale</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List for Sale Modal */}
      <Modal visible={listModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalHeader}>
            <View style={{ width: 38 }} />
            <Text style={styles.modalTitle}>List for Sale</Text>
            <TouchableOpacity onPress={() => setListModal(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalInfoLabel}>Investment</Text>
              <Text style={styles.modalInfoValue}>{investment.property?.title}</Text>
              <Text style={styles.modalInfoSub}>
                {investment.sharesPurchased * 10}% stake  {investment.sharesPurchased} shares
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Ask Price (AED) *</Text>
            <TextInput
              style={styles.fieldInput}
              value={askPrice}
              onChangeText={setAskPrice}
              keyboardType="number-pad"
              placeholder="Enter your asking price"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.fieldHint}>Total paid: {formatCurrency(
              (investment.payments ?? []).filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.amount, 0)
            )}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { height: 88, textAlignVertical: 'top', paddingTop: 14 }]}
              value={listNotes}
              onChangeText={setListNotes}
              multiline
              placeholder="Any details for potential buyers..."
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.warningBox}>
              <View style={styles.warningIconWrap}>
                <Ionicons name="information-circle-outline" size={18} color="#d97706" />
              </View>
              <Text style={styles.warningText}>
                Once a buyer requests your listing, admin must approve the transfer. You will receive an email with a confirmation code to complete the transfer.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.listConfirmBtnWrap}
              onPress={handlePriceNext}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#0c4a6e', '#0369a1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.listConfirmBtn}>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.listConfirmBtnText}>Next -- Review Terms</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PaymentProofModal
        visible={proofModal}
        payment={proofPayment}
        onClose={() => setProofModal(false)}
        onSuccess={(updated) => {
          setInvestment((prev: any) => ({
            ...prev,
            payments: prev.payments?.map((p: any) => p.id === updated.id ? { ...p, ...updated } : p),
          }));
          setProofModal(false);
        }}
      />
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
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerBack: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  summaryCardWrap: { paddingHorizontal: 20, paddingTop: 20 },
  summaryCard: { borderRadius: 20, padding: 20, overflow: 'hidden' },
  decorCircle1: {
    position: 'absolute', top: -30, right: -30, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  location: { color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 0.1 },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#fbbf24' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  dateText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', letterSpacing: 0.2 },
  paidUnpaidRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 4,
    padding: 12,
    alignItems: 'center',
  },
  paidUnpaidItem: { flex: 1, alignItems: 'center' },
  paidUnpaidDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },
  paidUnpaidLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500', marginBottom: 2 },
  paidUnpaidValue: { color: '#fff', fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginTop: 16,
    padding: 20,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12, letterSpacing: 0.2 },
  progressLabelPill: { backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  progressLabel: { fontSize: 12, color: '#059669', fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { color: '#94a3b8', fontSize: 12, marginTop: 8, letterSpacing: 0.1 },

  paymentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  paymentItemBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  paymentName: { fontSize: 14, fontWeight: '600', color: '#1e293b', letterSpacing: 0.1 },
  paymentDue: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  proofLink: { fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: '500' },
  uploadProofBtn: {
    marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  uploadProofBtnText: { fontSize: 10, color: '#0284c7', fontWeight: '600', letterSpacing: 0.2 },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  paymentBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  paymentBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  payoutCard: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginTop: 16, padding: 20,
    borderWidth: 1.5, borderColor: '#bbf7d0',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  payoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  payoutIconWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  payoutTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#059669', letterSpacing: 0.1 },
  payoutStatusPill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  payoutStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  payoutStatsRow: { gap: 10 },
  payoutStatCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  payoutProfitVal: { fontSize: 16, fontWeight: '800', color: '#059669' },
  payoutTotalVal: { fontSize: 16, fontWeight: '800', color: '#0c4a6e' },
  payoutStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, letterSpacing: 0.2 },
  payoutReceipt: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#d1fae5',
  },
  payoutReceiptText: { color: '#0284c7', fontSize: 13, fontWeight: '600' },

  transferHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  transferHeaderIcon: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  transferHeaderTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b', letterSpacing: 0.1 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f3ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  completedBadgeText: { color: '#7c3aed', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  transferHistoryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 14 },
  transferParty: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  transferPartyIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transferPartyRole: { fontSize: 10, color: '#94a3b8', letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: '600' },
  transferPartyName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  transferPartyEmail: { fontSize: 11, color: '#94a3b8' },
  transferArrow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  transferArrowLine: { width: 6, height: 1.5, backgroundColor: '#e2e8f0' },
  transferArrowCircle: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#bfdbfe',
  },
  transferMeta: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14, gap: 12,
  },
  transferMetaItem: { flex: 1, alignItems: 'center' },
  transferMetaLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 3, letterSpacing: 0.2 },
  transferMetaValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

  listingBanner: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  listingBannerGradient: { borderRadius: 20 },
  listingBannerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18,
  },
  listingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  listingBannerIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listingBannerLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  listingBannerSub: { fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 16 },
  listingBannerPrice: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  listingBannerRight: { gap: 8, alignItems: 'flex-end' },
  listingActionBtnWrap: { borderRadius: 10, overflow: 'hidden' },
  listingActionBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  listingActionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.2 },
  listingCancelBtn: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fff',
  },
  listingCancelBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 12 },
  sellBtnWrap: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  sellBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
  },
  sellBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },

  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18,
    overflow: 'hidden',
  },
  modalBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  modalCloseBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  modalInfoCard: {
    backgroundColor: '#f1f5f9', borderRadius: 16, padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  modalInfoLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: '600' },
  modalInfoValue: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: 0.1 },
  modalInfoSub: { color: '#64748b', fontSize: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 8, letterSpacing: 0.1 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  fieldHint: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  warningBox: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#fde68a', marginTop: 24,
  },
  warningIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef3c7',
    justifyContent: 'center', alignItems: 'center',
  },
  warningText: { flex: 1, color: '#92400e', fontSize: 12, lineHeight: 18 },
  modalFooter: {
    padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  listConfirmBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  listConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
  },
  listConfirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  propertyLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  propertyLinkIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center',
  },
  propertyLinkText: { flex: 1, color: '#0284c7', fontWeight: '600', fontSize: 14, letterSpacing: 0.1 },

  tcSummaryCard: {
    borderRadius: 18, padding: 20, marginBottom: 24, overflow: 'hidden',
  },
  tcDecorCircle: {
    position: 'absolute', top: -20, right: -20, width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tcSummaryLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 6, letterSpacing: 0.3 },
  tcSummaryProp: { color: '#fbbf24', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  tcSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tcSummaryDetail: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  tcSummaryDot: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  tcContent: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#0c4a6e', borderColor: '#0c4a6e' },
  checkLabel: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
});
