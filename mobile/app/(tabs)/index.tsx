import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { api } from '../../services/api';

const CARD_MARGIN = 20;

interface Property {
  id: string;
  title: string;
  location: string;
  pricePerShare: number;
  availableShares: number;
  totalShares: number;
  totalPrice: number;
  soldPrice: number | null;
  roi: number;
  images: string[];
  status: string;
}

export default function PropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [emirate, setEmirate] = useState('All Emirates');
  const [emiratesList, setEmiratesList] = useState<string[]>(['All Emirates']);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function loadProperties(reset = false) {
    if (!hasMore && !reset) return;
    const currentPage = reset ? 1 : page;

    try {
      const params: any = { page: currentPage, limit: 10 };
      if (search) params.search = search;
      if (emirate !== 'All Emirates') params.location = emirate;
      if (inStockOnly) params.status = 'ACTIVE';

      const res: any = await api.getProperties(params);
      const newItems = res.properties || [];

      setProperties(reset ? newItems : [...properties, ...newItems]);
      setHasMore(currentPage < (res.pages || 1));
      setPage(reset ? 2 : currentPage + 1);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    api.getUnreadCount().then((res: any) => setUnreadCount(res?.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getEmirates().then((res: any) => {
      const names = (Array.isArray(res) ? res : []).map((e: any) => e.name);
      setEmiratesList(['All Emirates', ...names]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadProperties(true);
  }, [search, emirate, inStockOnly]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProperties(true);
  }, []);

  function formatPrice(n: number) {
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `AED ${(n / 1000).toFixed(0)}K`;
    return `AED ${n}`;
  }

  function renderProperty({ item }: { item: Property }) {
    const isSoldOut = item.status === 'SOLD_OUT' || item.availableShares === 0;
    const isSold = item.status === 'SOLD';
    const isUnavailable = isSoldOut || isSold;
    const soldPct = Math.round(((item.totalShares - item.availableShares) / item.totalShares) * 100);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/property/${item.id}`)}
        activeOpacity={isUnavailable ? 0.7 : 0.92}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.images?.[0] || 'https://via.placeholder.com/400x240' }}
            style={[styles.image, isUnavailable && styles.imageDimmed]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageGradient}
          />
          {isUnavailable && <View style={styles.soldOutOverlay} />}

          {isSold ? (
            <>
              <View style={styles.soldRibbon}>
                <Text style={styles.soldRibbonText}>SOLD</Text>
              </View>
              {item.soldPrice && item.totalPrice ? (
                <LinearGradient colors={['#059669', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.badge, { top: 50 }]}>
                  <Ionicons name="trending-up" size={12} color="#fff" style={{ marginRight: 3 }} />
                  <Text style={styles.badgeText}>{Math.round(((item.soldPrice - item.totalPrice) / item.totalPrice) * 100)}% ROI</Text>
                </LinearGradient>
              ) : null}
            </>
          ) : isSoldOut ? (
            <View style={styles.soldOutRibbon}>
              <Text style={styles.soldOutRibbonText}>SOLD OUT</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#0284c7', '#0369a1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Ionicons name="trending-up" size={12} color="#fff" style={{ marginRight: 3 }} />
              <Text style={styles.badgeText}>{item.roi}% ROI</Text>
            </LinearGradient>
          )}

          {/* Title + location overlaid on image bottom */}
          <View style={styles.imageTextOverlay}>
            <Text style={styles.overlayTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.overlayLocationRow}>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.overlayLocation}>{item.location}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.cardBody, isUnavailable && styles.cardBodyDimmed]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Price per share</Text>
              <View style={styles.priceValueRow}>
                <Text style={[styles.price, isUnavailable && styles.priceDimmed]}>
                  {formatPrice(item.pricePerShare)}
                </Text>
                <Text style={styles.priceUnit}> / share</Text>
              </View>
            </View>
            {isSold ? (
              <View style={styles.soldBtnStatic}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.soldBtnText}>Sold</Text>
              </View>
            ) : isSoldOut ? (
              <View style={styles.soldOutBtnStatic}>
                <Ionicons name="lock-closed" size={13} color="#64748b" />
                <Text style={styles.soldOutBtnText}>Sold Out</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.investBtn}
                onPress={() => router.push(`/property/${item.id}`)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0284c7', '#0c4a6e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.investBtnGradient}
                >
                  <Text style={styles.investBtnText}>Invest</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.shares}>
                {isSoldOut ? 'No shares remaining' : `${item.availableShares.toLocaleString()} shares left`}
              </Text>
              <Text style={styles.soldPct}>{soldPct}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={isSoldOut ? ['#9ca3af', '#6b7280'] : ['#0284c7', '#0ea5e9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${soldPct}%` }]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={['#ffffff', '#f0f9ff']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Discover</Text>
            <Text style={styles.headerBrand}>OffPlan</Text>
          </View>
          <TouchableOpacity style={styles.headerAction} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#0c4a6e" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="light" style={styles.searchBlur}>
              <View style={styles.searchInner}>
                <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search premium properties..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          ) : (
            <View style={styles.searchAndroid}>
              <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search premium properties..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Filter pills */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            emirate !== 'All Emirates' && styles.filterPillActive,
          ]}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons
            name="location"
            size={14}
            color={emirate !== 'All Emirates' ? '#0284c7' : '#64748b'}
          />
          <Text
            style={[
              styles.filterPillText,
              emirate !== 'All Emirates' && styles.filterPillTextActive,
            ]}
            numberOfLines={1}
          >
            {emirate === 'All Emirates' ? 'All Emirates' : emirate}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={emirate !== 'All Emirates' ? '#0284c7' : '#94a3b8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, inStockOnly && styles.filterPillActive]}
          onPress={() => setInStockOnly((v) => !v)}
        >
          <View style={[styles.stockDot, inStockOnly && styles.stockDotActive]} />
          <Text
            style={[
              styles.filterPillText,
              inStockOnly && styles.filterPillTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(i) => i.id}
        renderItem={renderProperty}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Finding properties...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#cbd5e1" />
              <Text style={styles.empty}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          )
        }
        onEndReached={() => loadProperties()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0284c7"
            colors={['#0284c7']}
          />
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Emirates dropdown modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownHandle} />
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Emirate</Text>
              <TouchableOpacity
                style={styles.dropdownClose}
                onPress={() => setShowDropdown(false)}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {emiratesList.map((em) => (
              <TouchableOpacity
                key={em}
                style={[
                  styles.dropdownItem,
                  emirate === em && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setEmirate(em);
                  setShowDropdown(false);
                }}
              >
                <View style={styles.dropdownItemLeft}>
                  {emirate === em && (
                    <View style={styles.dropdownCheckCircle}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.dropdownItemText,
                      emirate === em && styles.dropdownItemTextActive,
                    ]}
                  >
                    {em}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerBrand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c4a6e',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2,132,199,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  notifBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
  },

  // Search
  searchRow: {
    marginBottom: 4,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  searchAndroid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '400',
    padding: 0,
  },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#0284c7',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  stockDotActive: {
    backgroundColor: '#22c55e',
  },

  // Dropdown modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  dropdownHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  dropdownClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dropdownItemActive: {
    backgroundColor: '#f0f9ff',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: CARD_MARGIN,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220,
  },
  imageDimmed: {
    opacity: 0.5,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  soldOutRibbon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#0f172a',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  soldOutRibbonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  soldRibbon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#059669',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  soldRibbonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  soldBtnStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  soldBtnText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  soldOutBtnStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  soldOutBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
  },
  imageTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlayLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  overlayLocation: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  cardBody: {
    padding: 18,
  },
  cardBodyDimmed: {
    opacity: 0.65,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c4a6e',
    letterSpacing: -0.5,
  },
  priceDimmed: {
    color: '#94a3b8',
  },
  priceUnit: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  investBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  investBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  investBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressSection: {
    marginTop: 0,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shares: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  soldPct: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty / loading states
  loadingContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
});
