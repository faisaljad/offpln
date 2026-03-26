import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import HtmlText from '../../components/HtmlText';

interface AppSettings {
  termsAndConditions: string;
  paymentTransferDetails: string;
}

const { width } = Dimensions.get('window');

interface PaymentInstallment {
  name: string;
  percentage: number;
  amount: number;
  dueType: string;
  dueValue: string;
}

interface PaymentSchedule {
  totalAmount: number;
  sharesPurchased: number;
  pricePerShare: number;
  downPayment: { name: string; percentage: number; amount: number };
  installments: PaymentInstallment[];
}


export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [shares, setShares] = useState(1);
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState<any[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setError('');
    Promise.all([
      api.getProperty(id),
      api.getSettings(),
    ])
      .then(([data, s]: any[]) => {
        setProperty(data);
        setSettings(s);
        updateSchedule(data, 1);
        // Load payout summary if property is SOLD
        if (data.status === 'SOLD') {
          api.getPayoutSummary(id as string)
            .then((res: any) => setPayoutSummary(Array.isArray(res) ? res : []))
            .catch(() => {});
        }
      })
      .catch((err: any) => setError(err.message || 'Failed to load property'))
      .finally(() => setLoading(false));
  }, [id]);

  function updateSchedule(prop: any, count: number) {
    if (!prop) return;
    const plan = prop.paymentPlan;
    const totalAmount = prop.pricePerShare * count;

    setSchedule({
      totalAmount,
      sharesPurchased: count,
      pricePerShare: prop.pricePerShare,
      downPayment: {
        name: 'Down Payment',
        percentage: plan.downPayment,
        amount: (plan.downPayment / 100) * totalAmount,
      },
      installments: plan.installments.map((inst: any) => ({
        ...inst,
        amount: (inst.percentage / 100) * totalAmount,
      })),
    });
  }

  function adjustShares(delta: number) {
    const maxShares = property?.availableShares || 1;
    const next = Math.max(1, Math.min(shares + delta, maxShares));
    setShares(next);
    updateSchedule(property, next);
  }

  function handleContinueToTerms() {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setAgreedToTerms(false);
    setModalVisible(false);
    setTermsModalVisible(true);
  }

  async function handleInvest() {
    setSubmitting(true);
    try {
      await api.createInvestment({ propertyId: id, sharesPurchased: shares });
      setTermsModalVisible(false);
      Toast.show({ type: 'success', text1: 'Investment submitted!', text2: 'Pending admin approval' });
      setTimeout(() => router.push('/(tabs)/investments'), 1500);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(Math.round(n))}`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={styles.errorTitle}>Failed to load property</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Ionicons name="home-outline" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
        <Text style={styles.errorSub}>Property not found</Text>
      </View>
    );
  }

  const plan = property.paymentPlan;
  const images = property.images?.length ? property.images : ['https://via.placeholder.com/400x280'];

  const statItems = [
    { label: 'Total Value', value: formatCurrency(property.totalPrice), icon: 'wallet-outline' as const },
    { label: 'Price/Share', value: formatCurrency(property.pricePerShare), icon: 'pricetag-outline' as const },
    { label: 'Stake Available', value: `${property.availableShares * 10}%`, icon: 'pie-chart-outline' as const },
    ...(property.area ? [{ label: 'Area', value: `${Number(property.area).toLocaleString()} sq.ft`, icon: 'resize-outline' as const }] : []),
    ...(property.propertyType ? [{ label: 'Type', value: property.propertyType.name, icon: 'home-outline' as const }] : []),
    ...(property.handoverDate ? [{ label: 'Handover', value: property.handoverDate, icon: 'calendar-outline' as const }] : []),
    { label: 'Developer', value: property.developer || 'N/A', icon: 'business-outline' as const },
  ];

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <PagerView style={{ flex: 1 }} onPageSelected={(e) => setImageIndex(e.nativeEvent.position)}>
            {images.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </PagerView>

          {/* Top gradient overlay for status bar */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          {/* ROI Badge floating on image */}
          <View style={styles.roiBadgeWrapper}>
            <LinearGradient
              colors={['#0c4a6e', '#0369a1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roiBadge}
            >
              <Ionicons
                name={property.profitType === 'PRICE_INCREASE' ? 'trending-up' : 'cash-outline'}
                size={14}
                color="#fbbf24"
              />
              <Text style={styles.roiText}>{property.roi}%</Text>
              <Text style={styles.roiLabel}>
                {property.profitType === 'PRICE_INCREASE' ? 'Price Increase' : 'Profit'}
              </Text>
            </LinearGradient>
          </View>

          {/* Page dots */}
          <View style={styles.dots}>
            {images.map((_: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === imageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color="#6b7280" />
              <Text style={styles.location}>{property.location}</Text>
            </View>
          </View>

          {/* Key Stats */}
          <View style={styles.statsGrid}>
            {statItems.map((s) => (
              <View key={s.label} style={styles.statBox}>
                <View style={styles.statIconWrap}>
                  <Ionicons name={s.icon} size={16} color="#0284c7" />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={!descExpanded ? styles.descriptionCollapsed : undefined}>
              <HtmlText html={property.description} style={styles.description} />
            </View>
            {property.description && property.description.length > 200 && (
              <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} style={styles.readMoreBtn}>
                <Text style={styles.readMoreText}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </Text>
                <Ionicons
                  name={descExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#0284c7"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Map */}
          {property.latitude && property.longitude ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationLabelRow}>
                <Ionicons name="location" size={14} color="#0284c7" />
                <Text style={styles.locationLabel}>{property.location}</Text>
              </View>
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={styles.map}
                  initialRegion={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{ latitude: property.latitude, longitude: property.longitude }}
                    title={property.title}
                    description={property.location}
                  />
                </MapView>
              </View>
            </View>
          ) : null}

          {/* Payment Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Plan</Text>
            <View style={styles.planCard}>
              <View style={styles.planItem}>
                <View style={styles.planNameRow}>
                  <Ionicons name="card-outline" size={15} color="#6b7280" />
                  <Text style={styles.planName}>Down Payment</Text>
                </View>
                <View style={styles.planPctPill}>
                  <Text style={styles.planPctText}>{plan.downPayment}%</Text>
                </View>
              </View>
              {plan.installments?.map((inst: any, i: number) => (
                <View key={i} style={[styles.planItem, i === plan.installments.length - 1 && styles.planItemLast]}>
                  <View style={styles.planNameRow}>
                    <Ionicons name="calendar-outline" size={15} color="#6b7280" />
                    <Text style={styles.planName}>{inst.name}</Text>
                  </View>
                  <View style={styles.planPctPill}>
                    <Text style={styles.planPctText}>{inst.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Developer Logo */}
          {property.developerLogo ? (
            <View style={styles.section}>
              <View style={styles.developerCard}>
                <Image source={{ uri: property.developerLogo }} style={{ width: 40, height: 40, borderRadius: 10 }} resizeMode="contain" />
                <Text style={styles.developerName}>{property.developer}</Text>
              </View>
            </View>
          ) : null}

          {/* ROI Payouts — shown when property is SOLD */}
          {property.status === 'SOLD' && payoutSummary.length > 0 && (
            <View style={styles.section}>
              <View style={styles.soldHeader}>
                <View style={styles.soldHeaderIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                </View>
                <Text style={styles.sectionTitle}>Investor Returns</Text>
              </View>
              <Text style={styles.payoutSubtitle}>
                This property was sold{property.soldPrice ? ` for ${formatCurrency(property.soldPrice)}` : ''}. Returns are based on each investor's proportional stake.
              </Text>
              <View style={styles.payoutCard}>
                {payoutSummary.map((p: any, idx: number) => (
                  <View key={p.index} style={[styles.payoutRow, p.isMe && styles.payoutRowMe, idx === payoutSummary.length - 1 && styles.payoutRowLast]}>
                    <View style={styles.payoutLeft}>
                      <View style={[styles.payoutAvatar, p.isMe && styles.payoutAvatarMe]}>
                        <Text style={[styles.payoutAvatarText, p.isMe && { color: '#0c4a6e' }]}>
                          {p.isMe ? 'You' : `${p.index}`}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.payoutName, p.isMe && styles.payoutNameMe]}>{p.name}</Text>
                        <Text style={styles.payoutStake}>{p.stake}% stake</Text>
                      </View>
                    </View>
                    <View style={styles.payoutRight}>
                      <Text style={styles.payoutProfit}>+{formatCurrency(p.profitAmount)}</Text>
                      <View style={[styles.payoutBadge, p.status === 'PAID' ? styles.payoutBadgePaid : styles.payoutBadgePending]}>
                        <Text style={[styles.payoutBadgeText, p.status === 'PAID' ? { color: '#059669' } : { color: '#d97706' }]}>
                          {p.status === 'PAID' ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                      {p.isMe && p.receiptUrl && (
                        <Text style={styles.payoutReceipt}>Receipt available</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Spacer for bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {property.status === 'SOLD' ? (
        <View style={[styles.soldOutBar, styles.soldBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.soldOutGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.soldOutBarText}>SOLD</Text>
              <Text style={styles.soldOutBarSub}>Property has been sold — ROI distributed</Text>
            </View>
          </LinearGradient>
        </View>
      ) : property.availableShares === 0 || property.status === 'SOLD_OUT' ? (
        <View style={[styles.soldOutBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <LinearGradient
            colors={['#1f2937', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.soldOutGradient}
          >
            <Ionicons name="lock-closed" size={22} color="#9ca3af" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.soldOutBarText}>SOLD OUT</Text>
              <Text style={styles.soldOutBarSub}>All shares have been taken</Text>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <BlurView intensity={80} tint="light" style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.bottomBarInner}>
            <View>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.price}>{formatCurrency(property.pricePerShare)}</Text>
              <Text style={styles.perShare}>per share</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.85}>
              <LinearGradient
                colors={['#0284c7', '#0369a1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.investBtn}
              >
                <Text style={styles.investBtnText}>Invest Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}

      {/* Investment Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.modalTitle}>Select Shares</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.sharePicker}>
              <TouchableOpacity onPress={() => adjustShares(-1)} style={styles.pickerBtn} activeOpacity={0.7}>
                <Ionicons name="remove" size={24} color="#0284c7" />
              </TouchableOpacity>
              <View style={styles.shareDisplay}>
                <Text style={styles.sharesCount}>{shares * 10}%</Text>
                <Text style={styles.sharesCountSub}>{shares} {shares === 1 ? 'share' : 'shares'}</Text>
              </View>
              <TouchableOpacity onPress={() => adjustShares(1)} style={styles.pickerBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={24} color="#0284c7" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sharesAvail}>{property.availableShares * 10}% available · min 10%</Text>

            {schedule && (
              <View style={styles.scheduleBox}>
                <View style={styles.scheduleTotalRow}>
                  <Text style={styles.scheduleTotalLabel}>Total Investment</Text>
                  <Text style={styles.scheduleTotal}>{formatCurrency(schedule.totalAmount)}</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.scheduleSubtitle}>Payment Schedule</Text>

                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleItemName}>{schedule.downPayment.name}</Text>
                  <View style={styles.scheduleItemPctPill}>
                    <Text style={styles.scheduleItemPctText}>{schedule.downPayment.percentage}%</Text>
                  </View>
                  <Text style={styles.scheduleItemAmt}>{formatCurrency(schedule.downPayment.amount)}</Text>
                </View>
                {schedule.installments.map((inst, i) => (
                  <View key={i} style={[styles.scheduleItem, i === schedule.installments.length - 1 && styles.scheduleItemLast]}>
                    <Text style={styles.scheduleItemName}>{inst.name}</Text>
                    <View style={styles.scheduleItemPctPill}>
                      <Text style={styles.scheduleItemPctText}>{inst.percentage}%</Text>
                    </View>
                    <Text style={styles.scheduleItemAmt}>{formatCurrency(inst.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity onPress={handleContinueToTerms} activeOpacity={0.85}>
              <LinearGradient
                colors={['#0284c7', '#0369a1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>Continue — {schedule ? formatCurrency(schedule.totalAmount) : ''}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions + Payment Details Modal */}
      <Modal visible={termsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setTermsModalVisible(false); setModalVisible(true); }} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Review & Confirm</Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {/* Payment Plan Card */}
            <LinearGradient
              colors={['#0c4a6e', '#0e7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryPill}
            >
              {/* Header row */}
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryLabel}>Stake</Text>
                  <Text style={styles.summaryValue}>{shares * 10}%</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryLabel}>Total Investment</Text>
                  <Text style={styles.summaryValue}>{schedule ? formatCurrency(schedule.totalAmount) : '—'}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.summaryHRule} />

              {/* Payment schedule rows */}
              {schedule && (
                <>
                  <View style={styles.payRow}>
                    <Text style={styles.payRowName}>
                      {schedule.downPayment.name}
                    </Text>
                    <Text style={styles.payRowPct}>{schedule.downPayment.percentage}%</Text>
                    <Text style={styles.payRowAmt}>{formatCurrency(schedule.downPayment.amount)}</Text>
                  </View>
                  {schedule.installments.map((inst, i) => (
                    <View key={i} style={styles.payRow}>
                      <Text style={styles.payRowName} numberOfLines={1}>{inst.name}</Text>
                      <Text style={styles.payRowPct}>{inst.percentage}%</Text>
                      <Text style={styles.payRowAmt}>{formatCurrency(inst.amount)}</Text>
                    </View>
                  ))}
                </>
              )}
            </LinearGradient>

            {/* Payment Transfer Details */}
            {settings?.paymentTransferDetails ? (
              <View style={styles.tcSection}>
                <View style={styles.tcSectionHeader}>
                  <View style={styles.tcIconWrap}>
                    <Ionicons name="card-outline" size={16} color="#0284c7" />
                  </View>
                  <Text style={styles.tcSectionTitle}>Payment Transfer Details</Text>
                </View>
                <View style={styles.tcContent}>
                  <HtmlText html={settings.paymentTransferDetails} style={{ color: '#374151', fontSize: 14, lineHeight: 22 }} />
                </View>
              </View>
            ) : null}

            {/* Terms & Conditions */}
            {settings?.termsAndConditions ? (
              <View style={styles.tcSection}>
                <View style={styles.tcSectionHeader}>
                  <View style={styles.tcIconWrap}>
                    <Ionicons name="document-text-outline" size={16} color="#0284c7" />
                  </View>
                  <Text style={styles.tcSectionTitle}>Terms & Conditions</Text>
                </View>
                <View style={styles.tcContent}>
                  <HtmlText html={settings.termsAndConditions} style={{ color: '#374151', fontSize: 14, lineHeight: 22 }} />
                </View>
              </View>
            ) : null}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Agreement + Confirm */}
          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => setAgreedToTerms((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Ionicons name="checkmark" size={15} color="#fff" />}
              </View>
              <Text style={styles.agreeText}>
                I have read and agree to the terms & conditions and confirm the payment details above
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleInvest}
              disabled={!agreedToTerms || submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={(!agreedToTerms || submitting) ? ['#94a3b8', '#94a3b8'] : ['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.confirmBtn, (!agreedToTerms || submitting) && styles.confirmBtnDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>Confirm Investment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  errorTitle: { color: '#ef4444', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  errorSub: { color: '#6b7280', fontSize: 13 },

  // Image section
  imageContainer: { height: 340, position: 'relative' },
  heroImage: { width, height: 340 },
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
  },
  roiBadgeWrapper: {
    position: 'absolute', top: 56, right: 16,
  },
  roiBadge: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 72,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  roiText: { color: '#fbbf24', fontSize: 20, fontWeight: '800', marginTop: 2 },
  roiLabel: { color: '#93c5fd', fontSize: 10, marginTop: 2, fontWeight: '600' },
  dots: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff', width: 20, borderRadius: 4,
  },

  // Body
  body: { paddingHorizontal: 24, paddingTop: 24 },
  titleRow: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', lineHeight: 32, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  location: { color: '#6b7280', fontSize: 14, fontWeight: '500' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statBox: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#e0f2fe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: '#0c4a6e', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14, letterSpacing: -0.2 },
  description: { color: '#4b5563', lineHeight: 24, fontSize: 14 },
  descriptionCollapsed: { maxHeight: 100, overflow: 'hidden' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  readMoreText: { color: '#0284c7', fontSize: 14, fontWeight: '600' },

  // Location
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  locationLabel: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  mapContainer: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  map: { width: '100%', height: 200, borderRadius: 20 },

  // Payment Plan
  planCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 4,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  planItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  planItemLast: { borderBottomWidth: 0 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { color: '#374151', fontSize: 14, fontWeight: '500' },
  planPctPill: {
    backgroundColor: '#e0f2fe', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  planPctText: { color: '#0284c7', fontWeight: '700', fontSize: 13 },

  // Developer
  developerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 16, gap: 14,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  developerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0f2fe',
    justifyContent: 'center', alignItems: 'center',
  },
  developerName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.97)' : undefined,
  },
  bottomBarInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16,
  },
  priceLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '500' },
  price: { fontSize: 22, fontWeight: '800', color: '#0c4a6e', letterSpacing: -0.3 },
  perShare: { color: '#9ca3af', fontSize: 11, fontWeight: '500' },
  investBtn: {
    borderRadius: 16, paddingHorizontal: 28, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#0284c7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  investBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Sold out bar
  soldOutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  soldBar: {},
  soldOutGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 24,
  },
  soldOutBarText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  soldOutBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Payout section
  soldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  soldHeaderIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#d1fae5',
    justifyContent: 'center', alignItems: 'center',
  },
  payoutSubtitle: { color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  payoutCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  payoutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  payoutRowLast: { borderBottomWidth: 0 },
  payoutRowMe: { backgroundColor: '#f0fdf4' },
  payoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payoutAvatar: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  payoutAvatarMe: { backgroundColor: '#bbf7d0' },
  payoutAvatarText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  payoutName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  payoutNameMe: { color: '#065f46', fontWeight: '800' },
  payoutStake: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  payoutRight: { alignItems: 'flex-end', gap: 4 },
  payoutProfit: { fontSize: 15, fontWeight: '800', color: '#059669' },
  payoutBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  payoutBadgePaid: { backgroundColor: '#d1fae5' },
  payoutBadgePending: { backgroundColor: '#fef3c7' },
  payoutBadgeText: { fontSize: 11, fontWeight: '700' },
  payoutReceipt: { fontSize: 11, color: '#0284c7', fontWeight: '500' },

  // Modal
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBackBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },

  // Share picker
  sharePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 32, paddingVertical: 36,
  },
  pickerBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0f2fe',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0284c7', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  shareDisplay: { alignItems: 'center', minWidth: 80 },
  sharesCount: { fontSize: 44, fontWeight: '800', color: '#0c4a6e', textAlign: 'center' },
  sharesCountSub: { color: '#9ca3af', fontSize: 13, marginTop: 2, fontWeight: '500' },
  sharesAvail: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 24, fontWeight: '500' },

  // Schedule
  scheduleBox: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20,
    padding: 20,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  scheduleTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleTotalLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  scheduleTotal: { fontSize: 22, fontWeight: '800', color: '#0c4a6e' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  scheduleSubtitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  scheduleItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  scheduleItemLast: { borderBottomWidth: 0 },
  scheduleItemName: { color: '#4b5563', fontSize: 14, flex: 1, fontWeight: '500' },
  scheduleItemPctPill: {
    backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
    marginHorizontal: 10,
  },
  scheduleItemPctText: { color: '#0284c7', fontWeight: '700', fontSize: 12 },
  scheduleItemAmt: { color: '#0c4a6e', fontWeight: '700', fontSize: 14, minWidth: 90, textAlign: 'right' },

  // Modal footer
  modalFooter: {
    padding: 20, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
  },
  confirmBtn: {
    borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Summary pill (T&C modal)
  summaryPill: {
    borderRadius: 20,
    padding: 20, marginBottom: 24,
    shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  summaryValue: { color: '#fbbf24', fontSize: 18, fontWeight: '800', marginTop: 4 },
  summaryLabel: { color: '#93c5fd', fontSize: 11, fontWeight: '600' },
  summaryHRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  payRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 8,
  },
  payRowName: { flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  payRowPct: { color: '#93c5fd', fontSize: 12, fontWeight: '600', minWidth: 36, textAlign: 'right' },
  payRowAmt: { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 90, textAlign: 'right' },

  // T&C sections
  tcSection: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 1,
  },
  tcSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tcIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#e0f2fe',
    justifyContent: 'center', alignItems: 'center',
  },
  tcSectionTitle: { fontSize: 14, fontWeight: '700', color: '#0c4a6e' },
  tcContent: { padding: 18 },

  // Agreement checkbox
  agreeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#bbf7d0', marginBottom: 16,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db',
    justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0,
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  agreeText: { flex: 1, color: '#374151', fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
