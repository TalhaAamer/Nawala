import { useCallback, useRef, useState } from 'react';
import { Share, Text, View, type ScrollView as RNScrollView, type LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import {
  RatingStars,
  Badge,
  SectionHeader,
  MenuItemRow,
  CartBar,
  Skeleton,
  EmptyState,
  PressableScale,
  Chip,
} from '@/components';
import { useRestaurant, useMenu } from '@/hooks/useApi';
import { useCart } from '@/store/cart';
import { useFavorites } from '@/store/favorites';
import { etaLabel } from '@/lib/restaurant';
import { deliveryFeeLabel, priceLevelLabel, formatMinorCompact } from '@/lib/money';

const HERO_H = 300;
const STRIP_H = 52;

export default function RestaurantDetailScreen() {
  const { theme } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const restaurant = useRestaurant(id);
  const menu = useMenu(id);
  const cartCount = useCart((s) => s.count());
  const cartSubtotal = useCart((s) => s.subtotalMinor());
  const isFav = useFavorites((s) => s.ids.includes(id));
  const toggleFav = useFavorites((s) => s.toggle);

  const scrollRef = useRef<RNScrollView>(null);
  const scrollY = useSharedValue(0);
  const offsets = useRef<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const sections = menu.data ?? [];

  const updateActive = useCallback((y: number) => {
    const list = offsets.current;
    let idx = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i] - STRIP_H - 8 <= y) idx = i;
    }
    setActiveSection((prev) => (prev === idx ? prev : idx));
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(updateActive)(e.contentOffset.y);
    },
  });

  const heroStyle = useAnimatedStyle(() => {
    const s = scrollY.value;
    return {
      transform: [
        { translateY: s < 0 ? s * 0.5 : s * 0.3 },
        { scale: s < 0 ? 1 - s / 320 : 1 },
      ],
    };
  });

  // Solid top bar fades in as the hero collapses.
  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_H - 120, HERO_H - 60], [0, 1], Extrapolation.CLAMP),
  }));

  const onSectionLayout = (i: number) => (e: LayoutChangeEvent) => {
    offsets.current[i] = e.nativeEvent.layout.y;
  };

  const scrollToSection = (i: number) => {
    const y = offsets.current[i];
    if (y != null) scrollRef.current?.scrollTo({ y: y - STRIP_H + 1, animated: true });
  };

  const onShare = () => {
    if (restaurant.data) void Share.share({ message: `Check out ${restaurant.data.name} on Crave!` });
  };

  // ── Loading / error ────────────────────────────────────────────────────────
  if (restaurant.loading && !restaurant.data) {
    return (
      <View style={styles.safe}>
        <Skeleton width="100%" height={HERO_H} radius={0} />
        <View style={styles.infoBlock}>
          <Skeleton width="70%" height={28} />
          <Skeleton width="50%" height={16} />
          <Skeleton width="40%" height={16} />
        </View>
        <View style={[styles.menuPad, { gap: theme.spacing.lg }]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={96} radius={theme.radii.md} />
          ))}
        </View>
        <TopControls insets={insets} onBack={() => router.back()} />
      </View>
    );
  }

  if ((restaurant.error && !restaurant.data) || !restaurant.data) {
    return (
      <View style={[styles.safe, { justifyContent: 'center' }]}>
        <EmptyState
          variant="error"
          title="Couldn’t load this restaurant"
          message="Please try again."
          actionLabel="Retry"
          onAction={restaurant.refetch}
        />
        <TopControls insets={insets} onBack={() => router.back()} />
      </View>
    );
  }

  const r = restaurant.data;

  return (
    <View style={styles.safe}>
      <Animated.ScrollView
        ref={scrollRef as never}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 110 : 32 }}
      >
        {/* [0] Hero + info */}
        <View>
          <Animated.View style={[styles.heroWrap, heroStyle]}>
            <Image
              source={r.heroImage}
              placeholder={{ blurhash: r.blurhash }}
              contentFit="cover"
              transition={200}
              style={styles.hero}
            />
          </Animated.View>
          <View style={styles.infoBlock}>
            <Text style={styles.name}>{r.name}</Text>
            <View style={styles.metaRow}>
              <RatingStars rating={r.rating} count={r.ratingCount} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{etaLabel(r)}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{deliveryFeeLabel(r.deliveryFeeMinor, r.currency)} delivery</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{priceLevelLabel(r.priceLevel)}</Text>
            </View>
            {r.freeDeliveryThresholdMinor != null && r.freeDeliveryThresholdMinor > 0 ? (
              <Badge
                label={`Free delivery over ${formatMinorCompact(r.freeDeliveryThresholdMinor, r.currency)}`}
                tone="success"
                variant="soft"
                icon="bicycle"
              />
            ) : null}
            <Text style={styles.desc}>{r.description}</Text>
          </View>
        </View>

        {/* [1] Sticky category strip */}
        <View style={styles.strip}>
          <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
            {sections.map((s, i) => (
              <Chip key={s.id} label={s.title} selected={activeSection === i} onPress={() => scrollToSection(i)} />
            ))}
          </Animated.ScrollView>
        </View>

        {/* [2..] Menu sections (direct children → onLayout y == content offset) */}
        {menu.loading && !menu.data ? (
          <View style={[styles.menuPad, { gap: theme.spacing.lg }]}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={96} radius={theme.radii.md} />
            ))}
          </View>
        ) : (
          sections.map((section, i) => (
            <View key={section.id} style={styles.menuPad} onLayout={onSectionLayout(i)}>
              <SectionHeader title={section.title} />
              {section.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id, restaurantId: r.id } })}
                  onAdd={() => router.push({ pathname: '/item/[id]', params: { id: item.id, restaurantId: r.id } })}
                />
              ))}
            </View>
          ))
        )}
      </Animated.ScrollView>

      {/* Collapsing solid top bar */}
      <Animated.View style={[styles.topBar, { height: insets.top + STRIP_H, paddingTop: insets.top }, topBarStyle]}>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {r.name}
        </Text>
      </Animated.View>

      <TopControls
        insets={insets}
        onBack={() => router.back()}
        favorite={isFav}
        onToggleFavorite={() => toggleFav(r.id)}
        onShare={onShare}
        restaurantName={r.name}
      />

      <CartBar itemCount={cartCount} subtotalMinor={cartSubtotal} onPress={() => router.push('/cart')} />
    </View>
  );
}

function TopControls({
  insets,
  onBack,
  favorite,
  onToggleFavorite,
  onShare,
  restaurantName,
}: {
  insets: { top: number };
  onBack: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  restaurantName?: string;
}) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.controls, { top: insets.top + 4 }]} pointerEvents="box-none">
      <PressableScale onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={styles.circle} hitSlop={6}>
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </PressableScale>
      <View style={styles.controlsRight}>
        {onShare ? (
          <PressableScale onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" style={styles.circle} hitSlop={6}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </PressableScale>
        ) : null}
        {onToggleFavorite ? (
          <PressableScale
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={favorite ? `Remove ${restaurantName} from favorites` : `Add ${restaurantName} to favorites`}
            accessibilityState={{ selected: favorite }}
            style={styles.circle}
            hitSlop={6}
          >
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? theme.colors.accent : '#FFFFFF'} />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    heroWrap: { width: '100%' as const, height: HERO_H },
    hero: { width: '100%' as const, height: HERO_H, backgroundColor: t.colors.bgMuted },
    infoBlock: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.lg, paddingBottom: t.spacing.md, gap: t.spacing.sm, backgroundColor: t.colors.bg },
    name: { ...t.typography.display, color: t.colors.textPrimary },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, flexWrap: 'wrap' as const },
    meta: { ...t.typography.meta, color: t.colors.textSecondary },
    dot: { ...t.typography.meta, color: t.colors.textTertiary },
    desc: { ...t.typography.body, color: t.colors.textSecondary, marginTop: t.spacing.xs },
    strip: { backgroundColor: t.colors.bg, borderBottomWidth: 1, borderBottomColor: t.colors.border, height: STRIP_H, justifyContent: 'center' as const },
    stripContent: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.sm, alignItems: 'center' as const },
    menuPad: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.md },
    topBar: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: t.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 60,
    },
    topBarTitle: { ...t.typography.title, color: t.colors.textPrimary },
    controls: {
      position: 'absolute' as const,
      left: t.screenPaddingX,
      right: t.screenPaddingX,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    controlsRight: { flexDirection: 'row' as const, gap: t.spacing.sm },
    circle: { width: 38, height: 38, borderRadius: t.radii.pill, backgroundColor: t.colors.scrim, alignItems: 'center' as const, justifyContent: 'center' as const },
  }));
}
