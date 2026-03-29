import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Modal, ScrollView,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import HtmlText from '../../components/HtmlText';

export default function MarketplaceScreen() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [tcModal, setTcModal] = useState(false);
  const [tcTerms, setTcTerms] = useState('');
  const [tcAgreed, setTcAgreed] = useState(false);

  async function load() {
    try {
      const res: any = await api.getMarketplace();
      setListings(Array.isArray(res) ? res : res.transfers ?? []);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to load marketplace' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function handleBuyPress(item: any) {
    if (!user) { router.push('/(auth)/login'); return; }
    if (user.id === item.sellerId) {
      Toast.show({ type: 'info', text1: 'This is your own listing' });
      return;
    }
    try {
      const settings: any = await api.getSettings();
      setTcTerms(settings?.transferBuyingTerms ?? '');
    } catch {
      setTcTerms('');
    }
    setSelectedListing(item);
    setTcAgreed(false);
    setTcModal(true);
  }

  async function handleConfirmBuy() {
    if (!selectedListing) return;
    setBuying(true);
    try {
      await api.buyTransfer(selectedListing.id);
      setTcModal(false);
      Toast.show({ type: 'success', text1: 'Request submitted!', text2: 'Pending admin approval' });
      load();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.message || 'Request failed' });
    } finally {
      setBuying(false);
    }
  }

  function formatCurrency(n: number) {
    return `AED ${new Intl.NumberFormat('en').format(Math.round(n))}`;
  }

  function renderItem({ item }: { item: any }) {
    const prop = item.investment?.property;
    const isMine = user?.id === item.sellerId;
    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => prop?.id && router.push(`/property/${prop.id}`)}>
        {prop?.images?.[0] ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: prop.images[0] }} style={styles.cardImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.imageOverlay}
            />
            <View style={styles.imageBadge}>
              <Ionicons name="pricetag" size={10} color="#fbbf24" />
              <Text style={styles.imageBadgeText}>{formatCurrency(item.askPrice)}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <View style={styles.placeholderIcon}>
              <Ionicons name="business-outline" size={32} color="#94a3b8" />
            </View>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{prop?.title ?? 'Unknown Property'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#94a3b8" />
            <Text style={styles.cardLocation}>{prop?.location ?? '—'}</Text>
          </View>
        </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="pie-chart-outline" size={12} color="#0284c7" />
              <Text style={styles.statPillValue}>{item.investment?.sharesPurchased * 10}%</Text>
              <Text style={styles.statPillLabel}>Stake</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="trending-up-outline" size={12} color="#059669" />
              <Text style={[styles.statPillValue, { color: '#059669' }]}>{prop?.roi}%</Text>
              <Text style={styles.statPillLabel}>ROI</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="cash-outline" size={12} color="#f59e0b" />
              <Text style={[styles.statPillValue, { color: '#b45309' }]}>{formatCurrency(item.askPrice)}</Text>
              <Text style={styles.statPillLabel}>Price</Text>
            </View>
          </View>

          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={12} color="#94a3b8" />
            </View>
            <Text style={styles.sellerText}>Listed by {isMine ? 'you' : item.seller?.name}</Text>
          </View>

          {isMine ? (
            <View style={styles.myListingBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#0284c7" />
              <Text style={styles.myListingText}>Your listing — visible to all investors</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => handleBuyPress(item)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0284c7', '#0369a1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyBtnGradient}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                <Text style={styles.buyBtnText}>Request to Buy</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const selProp = selectedListing?.investment?.property;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <>
    <Modal visible={tcModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setTcModal(false)} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Purchase Terms</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Listing summary */}
          {selectedListing && (
            <LinearGradient
              colors={['#0c4a6e', '#0369a1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View style={styles.summaryDecorCircle} />
              <Text style={styles.summaryLabel}>You are requesting to buy</Text>
              <Text style={styles.summaryProp} numberOfLines={1}>{selProp?.title ?? '—'}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryDetail}>{selectedListing.investment?.sharesPurchased * 10}% stake</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryDetail}>
                    AED {Number(selectedListing.askPrice).toLocaleString('en')}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Ionicons name="person-outline" size={12} color="#7dd3fc" />
                <Text style={styles.summarySellerText}>Seller: {selectedListing.seller?.name}</Text>
              </View>
            </LinearGradient>
          )}

          {/* T&C content */}
          <View style={styles.tcContent}>
            {tcTerms ? (
              <HtmlText html={tcTerms} style={{ fontSize: 13, lineHeight: 21, color: '#374151' }} />
            ) : (
              <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 20 }}>
                By requesting to buy this listing, you acknowledge that the transfer is subject to admin approval. Once approved, the seller will confirm via OTP to complete the ownership transfer.
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
            <Text style={styles.checkLabel}>I have read and agree to the purchase terms</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.confirmBtn, (!tcAgreed || buying) && { opacity: 0.4 }]}
            onPress={handleConfirmBuy}
            disabled={!tcAgreed || buying}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0284c7', '#0369a1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtnGradient}
            >
              {buying ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>Request to Buy</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <FlatList
      data={listings}
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
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="storefront-outline" size={18} color="#0284c7" />
          </View>
          <View>
            <Text style={styles.headerText}>Secondary Marketplace</Text>
            <Text style={styles.headerSubtext}>{listings.length} listings available</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#eff6ff', '#dbeafe']}
            style={styles.emptyIconGradient}
          >
            <Ionicons name="storefront-outline" size={48} color="#0284c7" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyDesc}>Investors can list their approved shares for sale here. Check back soon for new opportunities.</Text>
        </View>
      }
    />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  listContent: { padding: 20, paddingBottom: 100, backgroundColor: '#f8fafc', flexGrow: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtext: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: { width: '100%', height: 170 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageBadgeText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  cardImagePlaceholder: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  cardLocation: { color: '#94a3b8', fontSize: 12, fontWeight: '400' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 3,
  },
  statPillValue: { fontSize: 13, fontWeight: '700', color: '#0c4a6e' },
  statPillLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  // Seller
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // My Listing
  myListingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
  },
  myListingText: { color: '#0284c7', fontSize: 13, fontWeight: '600' },

  // Buy Button
  buyBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
  },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  },

  // Modal
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', letterSpacing: -0.2 },

  // Summary Card
  summaryCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  summaryDecorCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { color: '#93c5fd', fontSize: 11, marginBottom: 6, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryProp: { color: '#fbbf24', fontSize: 17, fontWeight: '800', marginBottom: 10, letterSpacing: -0.2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryDetail: { color: '#bae6fd', fontSize: 12, fontWeight: '600' },
  summarySellerText: { color: '#7dd3fc', fontSize: 12, fontWeight: '500' },

  // T&C Content
  tcContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  checkLabel: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 21, fontWeight: '500' },

  // Modal Footer
  modalFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  confirmBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
});
