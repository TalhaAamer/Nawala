/**
 * /_kitchen-sink — internal component + token showcase (DEV ONLY).
 * Hidden route (leading underscore); never linked from user-facing nav.
 * Removed/guarded in Phase 6 (crave-qa-polish).
 *
 * Phase 1: tokens, every component, animation lab.
 * Phase 2 adds the mock-API exerciser section.
 */
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View, type View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

import { useTheme, useThemedStyles, lightColors, darkColors, type ColorTokens } from '@/theme';
import { api } from '@/services/api';
import { clearAll } from '@/services/storage/kv';
import { useCart } from '@/store/cart';
import {
  Badge,
  Button,
  CartBar,
  CategoryIcon,
  Chip,
  ChipRow,
  EmptyState,
  LocationHeader,
  MapView,
  MenuItemRow,
  QuantityStepper,
  RatingStars,
  RestaurantCard,
  RestaurantCardSkeleton,
  RestaurantCardSmall,
  RestaurantCardWide,
  SearchPillButton,
  SearchPillInput,
  SectionHeader,
  Sheet,
  SheetRow,
  Skeleton,
  Stepper,
  useFlyToCart,
} from '@/components';
import { ORDER_STATUS_SEQUENCE, type MenuItem, type Restaurant } from '@/types';

// ── Preview fixtures (replaced by src/mocks in Phase 2) ──────────────────────
const BLUR = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const FOOD_IMG = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800';

const sampleRestaurant: Restaurant = {
  id: 'r1',
  name: 'Tony’s Wood-Fired Pizza & Pasta House',
  cuisines: ['Pizza', 'Italian'],
  rating: 4.7,
  ratingCount: 1243,
  etaMin: 20,
  etaMax: 30,
  deliveryFeeMinor: 0,
  currency: 'USD',
  priceLevel: 2,
  badges: ['Free delivery', 'Top rated'],
  heroImage: FOOD_IMG,
  blurhash: BLUR,
  address: '123 Main St',
  promo: '20% off, up to $5',
  location: { lat: 37.78, lng: -122.41 },
};

const sampleItem: MenuItem = {
  id: 'i1',
  name: 'Margherita Pizza',
  description: 'San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil',
  priceMinor: 1499,
  currency: 'USD',
  image: FOOD_IMG,
  blurhash: BLUR,
  popular: true,
};

const sampleItemNoDesc: MenuItem = {
  id: 'i2',
  name: 'Garlic Knots',
  description: '',
  priceMinor: 599,
  currency: 'USD',
  image: FOOD_IMG,
  blurhash: BLUR,
};

const sampleRoute = [
  { lat: 37.7749, lng: -122.4194 },
  { lat: 37.7765, lng: -122.4169 },
  { lat: 37.778, lng: -122.413 },
  { lat: 37.7795, lng: -122.409 },
];

export default function KitchenSink() {
  // Production safety net: unreachable in release builds even via direct URL.
  if (!__DEV__) return <Redirect href="/(tabs)" />;
  return <KitchenSinkInner />;
}

function KitchenSinkInner() {
  const { theme, mode, setMode } = useTheme();
  const styles = useScreenStyles();

  const [simulateErrors, setSimulateErrors] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedChip, setSelectedChip] = useState('Deals');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const flyAnchor = useRef<RNView>(null);
  const { fly } = useFlyToCart();

  const triggerFly = () => {
    flyAnchor.current?.measureInWindow((x, y, width, height) => {
      void fly({ from: { x, y, width, height }, image: FOOD_IMG, blurhash: BLUR });
      setCartCount((c) => c + 1);
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[0]}>
        {/* 0 · Header */}
        <View style={styles.header}>
          <Text style={styles.h1}>Kitchen Sink</Text>
          <ChipRow>
            {(['system', 'light', 'dark'] as const).map((m) => (
              <Chip key={m} label={m} selected={mode === m} onPress={() => setMode(m)} />
            ))}
          </ChipRow>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Simulate API errors</Text>
            <Switch
              value={simulateErrors}
              onValueChange={(v) => {
                setSimulateErrors(v);
                (globalThis as { __simulateErrors?: boolean }).__simulateErrors = v;
              }}
            />
          </View>
          <Button
            label="Reset storage (cart, orders, session…)"
            variant="ghost"
            onPress={() => {
              void clearAll();
              useCart.getState().clear();
            }}
          />
        </View>

        {/* 1 · Tokens */}
        <Section title="Color tokens">
          <Text style={styles.note}>Active scheme: {theme.scheme}</Text>
          <SwatchGrid title="Light" colors={lightColors} />
          <SwatchGrid title="Dark" colors={darkColors} />
        </Section>

        <Section title="Spacing">
          {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const).map((k) => (
            <View key={k} style={styles.spacingRow}>
              <Text style={styles.mono}>{k}</Text>
              <View style={[styles.spacingBar, { width: theme.spacing[k] * 3 }]} />
              <Text style={styles.mono}>{theme.spacing[k]}</Text>
            </View>
          ))}
        </Section>

        <Section title="Radii">
          <View style={styles.rowWrap}>
            {(['sm', 'md', 'lg', 'xl'] as const).map((k) => (
              <View key={k} style={styles.radiiItem}>
                <View style={[styles.radiiBox, { borderRadius: theme.radii[k] }]} />
                <Text style={styles.mono}>
                  {k} · {theme.radii[k]}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typography">
          {(['display', 'titleLg', 'title', 'body', 'meta', 'price', 'chip'] as const).map((k) => (
            <Text key={k} style={[theme.typography[k], { color: theme.colors.textPrimary }]}>
              {k} — The quick brown fox
            </Text>
          ))}
        </Section>

        {/* 2 · Components */}
        <Section title="LocationHeader">
          <LocationHeader
            addressLabel="123 Market St"
            cartCount={cartCount}
            onPressCart={() => {}}
            onPressLocation={() => {}}
          />
        </Section>

        <Section title="Search">
          <SearchPillButton onPress={() => {}} />
          <SearchPillInput value={search} onChangeText={setSearch} placeholder="Type to search…" />
        </Section>

        <Section title="Buttons">
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="With icon" icon="cart" onPress={() => {}} />
          <Button label="Add to cart" trailing="$14.99" onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </Section>

        <Section title="Chips">
          <ChipRow>
            {['Deals', 'Pickup', 'Top rated', 'Under 30 min', '$', '$$'].map((c) => (
              <Chip key={c} label={c} selected={selectedChip === c} onPress={() => setSelectedChip(c)} />
            ))}
            <Chip label="Sort" hasDropdown onPress={() => {}} />
          </ChipRow>
        </Section>

        <Section title="Badges">
          <View style={styles.rowWrap}>
            <Badge label="Free delivery" tone="success" variant="solid" />
            <Badge label="Promo" tone="accent" variant="solid" />
            <Badge label="Top rated" tone="accent" variant="soft" icon="star" />
            <Badge label="New" tone="neutral" variant="soft" />
          </View>
        </Section>

        <Section title="Rating / Stepper">
          <RatingStars rating={4.7} count={1243} />
          <QuantityStepper value={qty} onChange={setQty} />
          <QuantityStepper value={qty} onChange={setQty} min={0} allowRemove size="sm" />
        </Section>

        <Section title="Category icons">
          <View style={styles.rowWrap}>
            {[
              { id: 'pizza', name: 'Pizza', emoji: '🍕' },
              { id: 'sushi', name: 'Sushi', emoji: '🍣' },
              { id: 'burgers', name: 'Burgers', emoji: '🍔' },
              { id: 'coffee', name: 'Coffee', emoji: '☕' },
            ].map((c) => (
              <CategoryIcon key={c.id} category={c} selected={c.id === 'pizza'} onPress={() => {}} />
            ))}
          </View>
        </Section>

        <Section title="RestaurantCard (long name + favorite)">
          <RestaurantCard restaurant={sampleRestaurant} favorite onToggleFavorite={() => {}} onPress={() => {}} />
        </Section>

        <Section title="RestaurantCard wide / small">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
            <RestaurantCardWide restaurant={sampleRestaurant} onPress={() => {}} />
            <RestaurantCardSmall restaurant={sampleRestaurant} onPress={() => {}} />
          </ScrollView>
        </Section>

        <Section title="MenuItemRow (popular + no description)">
          <MenuItemRow item={sampleItem} onPress={() => {}} onAdd={triggerFly} cartQty={2} />
          <MenuItemRow item={sampleItemNoDesc} onPress={() => {}} onAdd={triggerFly} />
        </Section>

        <Section title="SectionHeader">
          <SectionHeader title="Fastest near you" subtitle="Ready in under 30 min" onSeeAll={() => {}} />
        </Section>

        <Section title="Skeletons">
          <Skeleton width="80%" height={20} />
          <Skeleton width="55%" height={14} />
          <RestaurantCardSkeleton />
        </Section>

        <Section title="EmptyState (empty + error)">
          <EmptyState title="No results" message="Try a different filter." actionLabel="Browse all" onAction={() => {}} />
          <EmptyState
            variant="error"
            title="Something went wrong"
            message="We couldn’t reach the kitchen."
            actionLabel="Retry"
            onAction={() => {}}
          />
        </Section>

        <Section title="Stepper (all 5 statuses)">
          {ORDER_STATUS_SEQUENCE.map((s) => (
            <View key={s} style={styles.stepperCase}>
              <Text style={styles.note}>current: {s}</Text>
              <Stepper current={s} />
            </View>
          ))}
        </Section>

        <Section title="MapView (courier @ 40%)">
          <MapView route={sampleRoute} courier={{ progress: 0.4 }} />
        </Section>

        <Section title="Sheet">
          <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
        </Section>

        {/* 3 · Mock API exerciser */}
        <Section title="Mock API exerciser">
          <ApiExerciser />
        </Section>

        {/* 4 · Animation lab */}
        <Section title="Animation lab">
          <View ref={flyAnchor} collapsable={false} style={styles.flyAnchor}>
            <Text style={styles.note}>fly source</Text>
          </View>
          <Button label="Fly to cart" onPress={triggerFly} />
          <View style={styles.switchRow}>
            <Text style={styles.label}>Cart bar visible (count {cartCount})</Text>
            <Button
              label={cartCount > 0 ? 'Empty cart' : 'Add item'}
              variant="ghost"
              fullWidth={false}
              onPress={() => setCartCount((c) => (c > 0 ? 0 : 1))}
            />
          </View>
          <Text style={styles.note}>
            Reduce-motion is honored automatically via the OS setting (Settings → Accessibility).
          </Text>
        </Section>

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartBar itemCount={cartCount} subtotalMinor={cartCount * 1499} onPress={() => {}} />

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Choose an address">
        {['Home · 123 Market St', 'Work · 500 Howard St', 'Gym · 88 King St'].map((a) => (
          <SheetRow key={a}>
            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>{a}</Text>
          </SheetRow>
        ))}
        <Button label="Done" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

type CallState = { status: 'idle' | 'loading' | 'ok' | 'error'; ms?: number; result?: string };

function ApiExerciser() {
  const styles = useScreenStyles();
  const { theme } = useTheme();
  const [states, setStates] = useState<Record<string, CallState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const lastOrderId = useRef<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setStates((s) => ({ ...s, [key]: { status: 'loading' } }));
    const t0 = Date.now();
    try {
      const res = await fn();
      const ms = Date.now() - t0;
      if (key === 'placeOrder' && res && typeof res === 'object' && 'id' in res) {
        lastOrderId.current = (res as { id: string }).id;
      }
      const json = JSON.stringify(res, null, 2).split('\n').slice(0, 80).join('\n');
      setStates((s) => ({ ...s, [key]: { status: 'ok', ms, result: json } }));
    } catch (err) {
      setStates((s) => ({
        ...s,
        [key]: { status: 'error', ms: Date.now() - t0, result: String(err) },
      }));
    }
  };

  const samplePlaceOrder = () =>
    api.placeOrder({
      restaurantId: 'r_pizza',
      restaurantName: 'Tony’s Wood-Fired Pizza',
      items: [
        {
          id: 'demo-line',
          itemId: 'r_pizza_s0_i0',
          restaurantId: 'r_pizza',
          name: 'Margherita',
          priceMinor: 1499,
          qty: 1,
        },
      ],
      addressId: 'addr_home',
      paymentLabel: '•••• 4242',
      tipMinor: 300,
      subtotalMinor: 1499,
      feeMinor: 0,
      serviceFeeMinor: 199,
      taxMinor: 120,
      discountMinor: 0,
      totalMinor: 2118,
      currency: 'USD',
    });

  const calls: { key: string; label: string; fn: () => Promise<unknown> }[] = [
    { key: 'getCategories', label: 'getCategories()', fn: () => api.getCategories() },
    { key: 'getRestaurants', label: 'getRestaurants()', fn: () => api.getRestaurants() },
    { key: 'getRestaurant', label: 'getRestaurant("r_pizza")', fn: () => api.getRestaurant('r_pizza') },
    { key: 'getMenu', label: 'getMenu("r_pizza")', fn: () => api.getMenu('r_pizza') },
    { key: 'searchRestaurants', label: 'searchRestaurants("pizza")', fn: () => api.searchRestaurants('pizza') },
    { key: 'placeOrder', label: 'placeOrder(sample)', fn: samplePlaceOrder },
    { key: 'getOrders', label: 'getOrders()', fn: () => api.getOrders() },
    {
      key: 'getOrder',
      label: 'getOrder(latest)',
      fn: () => api.getOrder(lastOrderId.current ?? 'none'),
    },
  ];

  const pill = (st?: CallState) => {
    const map = {
      idle: theme.colors.textTertiary,
      loading: theme.colors.warning,
      ok: theme.colors.success,
      error: theme.colors.accent,
    };
    const status = st?.status ?? 'idle';
    return (
      <View style={[styles.apiPill, { backgroundColor: map[status] }]}>
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={theme.colors.onAccent} />
        ) : (
          <Text style={styles.apiPillText}>{status}{st?.ms != null ? ` · ${st.ms}ms` : ''}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {calls.map((c) => {
        const st = states[c.key];
        const isOpen = expanded === c.key;
        return (
          <View key={c.key} style={styles.apiRow}>
            <View style={styles.apiHead}>
              <Button label={c.label} variant="secondary" fullWidth={false} onPress={() => run(c.key, c.fn)} />
              {pill(st)}
              {st?.result ? (
                <Button
                  label={isOpen ? 'Hide' : 'JSON'}
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => setExpanded(isOpen ? null : c.key)}
                />
              ) : null}
            </View>
            {isOpen && st?.result ? (
              <ScrollView style={styles.apiJson} horizontal>
                <Text style={styles.mono2}>{st.result}</Text>
              </ScrollView>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useScreenStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SwatchGrid({ title, colors }: { title: string; colors: ColorTokens }) {
  const styles = useScreenStyles();
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.note}>{title}</Text>
      <View style={styles.rowWrap}>
        {(Object.keys(colors) as (keyof ColorTokens)[]).map((k) => (
          <View key={k} style={styles.swatch}>
            <View style={[styles.swatchColor, { backgroundColor: colors[k] }]} />
            <Text style={styles.swatchLabel} numberOfLines={1}>
              {k}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function useScreenStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { paddingBottom: t.spacing.xxxl },
    header: {
      backgroundColor: t.colors.bg,
      paddingHorizontal: t.screenPaddingX,
      paddingVertical: t.spacing.md,
      gap: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    h1: { ...t.typography.display, color: t.colors.textPrimary },
    h2: { ...t.typography.titleLg, color: t.colors.textPrimary },
    section: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.xl, gap: t.spacing.md },
    sectionBody: { gap: t.spacing.md },
    switchRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    label: { ...t.typography.body, color: t.colors.textPrimary },
    note: { ...t.typography.meta, color: t.colors.textSecondary },
    mono: { ...t.typography.meta, color: t.colors.textSecondary, width: 44 },
    rowWrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: t.spacing.sm, alignItems: 'center' as const },
    hscroll: { gap: t.spacing.md, paddingRight: t.spacing.lg },
    spacingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm },
    spacingBar: { height: 12, backgroundColor: t.colors.accent, borderRadius: t.radii.sm },
    radiiItem: { alignItems: 'center' as const, gap: t.spacing.xs },
    radiiBox: { width: 56, height: 56, backgroundColor: t.colors.accentSoft, borderWidth: 1, borderColor: t.colors.accent },
    swatch: { width: 72, gap: 4 },
    swatchColor: { width: 72, height: 40, borderRadius: t.radii.sm, borderWidth: 1, borderColor: t.colors.border },
    swatchLabel: { ...t.typography.chip, color: t.colors.textSecondary, fontSize: 10 },
    stepperCase: { gap: t.spacing.xs, paddingVertical: t.spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border },
    flyAnchor: {
      width: 80,
      height: 80,
      borderRadius: t.radii.md,
      backgroundColor: t.colors.bgMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    apiRow: { gap: t.spacing.xs, borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: t.spacing.sm },
    apiHead: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm, flexWrap: 'wrap' as const },
    apiPill: { paddingHorizontal: t.spacing.sm, paddingVertical: 4, borderRadius: t.radii.pill, minWidth: 56, alignItems: 'center' as const },
    apiPillText: { ...t.typography.chip, color: t.colors.onAccent, fontSize: 11 },
    apiJson: { maxHeight: 220, backgroundColor: t.colors.bgMuted, borderRadius: t.radii.sm, padding: t.spacing.sm },
    mono2: { ...t.typography.meta, color: t.colors.textPrimary, fontFamily: undefined },
  }));
}
