import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useThemedStyles } from '@/theme';
import {
  LocationHeader,
  SearchPillButton,
  CategoryIcon,
  Chip,
  SectionHeader,
  RestaurantCard,
  RestaurantCardWide,
  RestaurantCardSkeleton,
  Skeleton,
  EmptyState,
  CartBar,
} from '@/components';
import { useCategories, useRestaurants } from '@/hooks/useApi';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { useFavorites } from '@/store/favorites';
import { loadAddresses } from '@/services/storage/addresses';
import type { Address, RestaurantDetail, FeedSort } from '@/types';

type FilterKey = 'deals' | 'dashpass' | 'toprated' | 'under30' | 'free' | 'p1' | 'p2' | 'p3' | 'p4';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'deals', label: 'Deals' },
  { key: 'dashpass', label: 'DashPass' },
  { key: 'toprated', label: 'Top rated' },
  { key: 'under30', label: 'Under 30 min' },
  { key: 'free', label: 'Free delivery' },
  { key: 'p1', label: '$' },
  { key: 'p2', label: '$$' },
  { key: 'p3', label: '$$$' },
  { key: 'p4', label: '$$$$' },
];
const PRICE_KEYS: FilterKey[] = ['p1', 'p2', 'p3', 'p4'];

function passesFilter(r: RestaurantDetail, key: FilterKey): boolean {
  switch (key) {
    case 'deals':
      return r.badges.includes('Promo');
    case 'dashpass':
      return r.badges.includes('DashPass');
    case 'toprated':
      return r.rating >= 4.6;
    case 'under30':
      return r.etaMax <= 30;
    case 'free':
      return r.deliveryFeeMinor === 0;
    case 'p1':
      return r.priceLevel === 1;
    case 'p2':
      return r.priceLevel === 2;
    case 'p3':
      return r.priceLevel === 3;
    case 'p4':
      return r.priceLevel === 4;
  }
}

export default function Home() {
  const styles = useStyles();
  const router = useRouter();
  const cartCount = useCart((s) => s.count());
  const cartSubtotal = useCart((s) => s.subtotalMinor());
  const selectedAddressId = useSession((s) => s.selectedAddressId);
  const favIds = useFavorites((s) => s.ids);
  const toggleFav = useFavorites((s) => s.toggle);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());

  useEffect(() => {
    loadAddresses().then(setAddresses);
  }, []);

  const addressLabel = addresses.find((a) => a.id === selectedAddressId)?.label ?? 'Set location';

  // Category drives a real server refetch; "Top rated" drives sort.
  const cuisineParam = category && category !== 'deals' ? category : undefined;
  const sortParam: FeedSort | undefined = filters.has('toprated') ? 'rating' : undefined;

  const cats = useCategories();
  const feed = useRestaurants(useMemo(() => ({ cuisine: cuisineParam, sort: sortParam }), [cuisineParam, sortParam]));

  // Client-side chip filtering over the fetched feed.
  const filtered = useMemo(() => {
    let list = feed.data ?? [];
    if (category === 'deals') list = list.filter((r) => r.badges.includes('Promo'));
    const active = [...filters];
    const priceSel = active.filter((k) => PRICE_KEYS.includes(k));
    const nonPrice = active.filter((k) => !PRICE_KEYS.includes(k) && k !== 'toprated');
    if (priceSel.length) list = list.filter((r) => priceSel.some((k) => passesFilter(r, k)));
    for (const k of nonPrice) list = list.filter((r) => passesFilter(r, k));
    return list;
  }, [feed.data, filters, category]);

  const fastest = useMemo(() => [...filtered].sort((a, b) => a.etaMin - b.etaMin).slice(0, 8), [filtered]);
  const offers = useMemo(() => filtered.filter((r) => r.badges.includes('Promo')), [filtered]);
  const popular = useMemo(() => [...filtered].sort((a, b) => b.ratingCount - a.ratingCount), [filtered]);

  const toggleFilter = (key: FilterKey) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const loading = feed.loading && !feed.data;
  const error = feed.error && !feed.data;

  const openRestaurant = (id: string) => router.push(`/restaurant/${id}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <LocationHeader
          addressLabel={addressLabel}
          cartCount={cartCount}
          onPressCart={() => router.push('/cart')}
          onPressLocation={() => {}}
        />
        <SearchPillButton onPress={() => router.push('/(tabs)/search')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.loading && !!feed.data}
            onRefresh={() => {
              feed.refetch();
              cats.refetch();
            }}
          />
        }
      >
        {/* Category row */}
        <FlatList
          horizontal
          data={cats.data ?? []}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          renderItem={({ item }) => (
            <CategoryIcon
              category={item}
              selected={category === item.id}
              onPress={() => setCategory((c) => (c === item.id ? null : item.id))}
            />
          )}
          ListEmptyComponent={<CategoryRowSkeleton />}
        />

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filters.has(f.key)} onPress={() => toggleFilter(f.key)} />
          ))}
        </ScrollView>

        {/* Feed */}
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <EmptyState
            variant="error"
            title="Couldn’t load restaurants"
            message="Check your connection and try again."
            actionLabel="Retry"
            onAction={feed.refetch}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No restaurants match"
            message="Try removing a filter or picking another category."
            actionLabel="Clear filters"
            onAction={() => {
              setFilters(new Set());
              setCategory(null);
            }}
          />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <SectionHeader title="Fastest near you" />
              </View>
              <FlatList
                horizontal
                data={fastest}
                keyExtractor={(r) => r.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hcards}
                renderItem={({ item }) => <RestaurantCardWide restaurant={item} onPress={() => openRestaurant(item.id)} />}
              />
            </View>

            {offers.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <SectionHeader title="Offers for you" />
                </View>
                <FlatList
                  horizontal
                  data={offers}
                  keyExtractor={(r) => r.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hcards}
                  renderItem={({ item }) => (
                    <View style={{ width: 300 }}>
                      <RestaurantCard
                        restaurant={item}
                        favorite={favIds.includes(item.id)}
                        onToggleFavorite={() => toggleFav(item.id)}
                        onPress={() => openRestaurant(item.id)}
                      />
                    </View>
                  )}
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <SectionHeader title="Popular restaurants" />
              </View>
              <View style={styles.vlist}>
                {popular.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    favorite={favIds.includes(r.id)}
                    onToggleFavorite={() => toggleFav(r.id)}
                    onPress={() => openRestaurant(r.id)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: cartCount > 0 ? 96 : 24 }} />
      </ScrollView>

      <CartBar itemCount={cartCount} subtotalMinor={cartSubtotal} onPress={() => router.push('/cart')} />
    </SafeAreaView>
  );
}

function CategoryRowSkeleton() {
  const styles = useStyles();
  return (
    <View style={[styles.catRow, { flexDirection: 'row' }]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 6, width: 68 }}>
          <Skeleton width={60} height={60} radius={999} />
          <Skeleton width={48} height={12} />
        </View>
      ))}
    </View>
  );
}

function FeedSkeleton() {
  const styles = useStyles();
  return (
    <View style={{ gap: 24 }}>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Skeleton width="55%" height={22} />
        </View>
        <View style={[styles.hcards, { flexDirection: 'row' }]}>
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} style={{ width: 260 }}>
              <RestaurantCardSkeleton />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Skeleton width="55%" height={22} />
        </View>
        <View style={styles.vlist}>
          {Array.from({ length: 3 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, paddingBottom: t.spacing.sm, gap: t.spacing.sm },
    scroll: { paddingBottom: t.spacing.xl },
    catRow: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.md, paddingVertical: t.spacing.sm },
    chipRow: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.sm, paddingBottom: t.spacing.md },
    section: { gap: t.spacing.md, paddingTop: t.spacing.sm },
    sectionHead: { paddingHorizontal: t.screenPaddingX },
    hcards: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.md },
    vlist: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.lg },
  }));
}
