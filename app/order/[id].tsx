import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';

import { useTheme, useThemedStyles } from '@/theme';
import { MapView, Stepper, Button, PressableScale, Sheet, Skeleton, EmptyState } from '@/components';
import type { LatLng } from '@/components';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useOrder, useRestaurant } from '@/hooks/useApi';
import { orderClock } from '@/services/api';
import { getJSON, setJSON, STORAGE_KEYS } from '@/services/storage/kv';
import { formatMinor } from '@/lib/money';
import type { OrderStatus } from '@/types';

const PROGRESS_BY_STATUS: Record<OrderStatus, number> = {
  confirmed: 0.06,
  preparing: 0.14,
  picked_up: 0.42,
  on_the_way: 0.78,
  delivered: 1,
};

const STATUS_HEADLINE: Record<OrderStatus, string> = {
  confirmed: 'Order confirmed',
  preparing: 'Preparing your food',
  picked_up: 'Your courier is on the move',
  on_the_way: 'On the way to you',
  delivered: 'Delivered — enjoy!',
};

export default function OrderTrackingScreen() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allowed } = useAuthGate('orders');

  const order = useOrder(id);
  const restaurant = useRestaurant(order.data?.restaurantId ?? '');

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [rated, setRated] = useState(false);

  // Track live transitions. Initial status falls back to the loaded order
  // (see `current` below), so no synchronous init-from-prop effect is needed.
  useEffect(() => {
    if (!id) return;
    const unsub = orderClock.subscribe(id, (next) => {
      setStatus(next);
      if (next === 'delivered') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    return unsub;
  }, [id]);

  // Prompt for a rating once delivered (if not already rated).
  useEffect(() => {
    if (status === 'delivered' && !rated) {
      getJSON<Record<string, unknown>>(STORAGE_KEYS.orderRatings, {}).then((all) => {
        if (all[id]) setRated(true);
        else setRateOpen(true);
      });
    }
  }, [status, rated, id]);

  // Build a demo route from the restaurant to a nearby destination.
  const route = useMemo<LatLng[]>(() => {
    const o = restaurant.data?.location ?? { lat: 37.7749, lng: -122.4194 };
    const dest = { lat: o.lat + 0.012, lng: o.lng + 0.009 };
    return [
      o,
      { lat: o.lat + 0.004, lng: o.lng + 0.001 },
      { lat: o.lat + 0.007, lng: o.lng + 0.006 },
      dest,
    ];
  }, [restaurant.data?.location]);

  const submitRating = () => {
    void getJSON<Record<string, unknown>>(STORAGE_KEYS.orderRatings, {}).then((all) => {
      void setJSON(STORAGE_KEYS.orderRatings, { ...all, [id]: { stars, text: reviewText.trim() } });
    });
    setRated(true);
    setRateOpen(false);
  };

  if (!allowed) return <View style={styles.safe} />;

  if (order.loading && !order.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Skeleton width="100%" height={200} radius={0} />
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="100%" height={120} />
        </View>
      </SafeAreaView>
    );
  }

  if ((order.error && !order.data) || !order.data) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]} edges={['top']}>
        <EmptyState variant="error" title="Order not found" message="We couldn’t find this order." actionLabel="Back to orders" onAction={() => router.replace('/(tabs)/orders')} />
      </SafeAreaView>
    );
  }

  const o = order.data;
  const current = status ?? o.status;
  const delivered = current === 'delivered';
  const itemCount = o.items.reduce((n, it) => n + it.qty, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} noAnimation>
          <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
        </PressableScale>
        <Text style={styles.title} numberOfLines={1}>{o.restaurantName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Map / delivered banner */}
        {delivered ? (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
            <Text style={styles.deliveredText}>Delivered at {format(o.placedAt, 'h:mm a')}</Text>
          </View>
        ) : (
          <View>
            <MapView route={route} courier={{ progress: PROGRESS_BY_STATUS[current] }} height={220} />
            <View style={styles.etaPill}>
              <Ionicons name="time" size={14} color={theme.colors.onAccent} />
              <Text style={styles.etaText}>Arriving in ~{o.etaMin} min</Text>
            </View>
          </View>
        )}

        <Text style={styles.headline}>{STATUS_HEADLINE[current]}</Text>

        {/* Stepper */}
        <View style={styles.card}>
          <Stepper current={current} />
        </View>

        {/* Courier card (after picked up) */}
        {(current === 'picked_up' || current === 'on_the_way') && o.courier ? (
          <View style={styles.courierCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={theme.colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courierName}>{o.courier.name}</Text>
              <Text style={styles.courierMeta}>{o.courier.vehicle} · Your courier</Text>
            </View>
            <PressableScale accessibilityRole="button" accessibilityLabel="Message courier (demo)" disabled style={styles.courierBtn} noAnimation onPress={() => {}}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.textTertiary} />
            </PressableScale>
            <PressableScale accessibilityRole="button" accessibilityLabel="Call courier (demo)" disabled style={styles.courierBtn} noAnimation onPress={() => {}}>
              <Ionicons name="call-outline" size={20} color={theme.colors.textTertiary} />
            </PressableScale>
          </View>
        ) : null}

        {/* Collapsible order summary */}
        <View style={styles.card}>
          <PressableScale onPress={() => setSummaryOpen((v) => !v)} accessibilityRole="button" accessibilityLabel="Toggle order summary" style={styles.summaryHead} noAnimation>
            <Text style={styles.cardTitle}>Order summary · {itemCount} items</Text>
            <Ionicons name={summaryOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
          </PressableScale>
          {summaryOpen ? (
            <View style={styles.summaryBody}>
              {o.items.map((it) => (
                <View key={it.id} style={styles.summaryLine}>
                  <Text style={styles.summaryQty}>{it.qty}×</Text>
                  <Text style={styles.summaryName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.summaryPrice}>{formatMinor(it.priceMinor * it.qty)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryLine}>
                <Text style={[styles.summaryName, { flex: 1 }]}>Total</Text>
                <Text style={styles.totalValue}>{formatMinor(o.totalMinor)}</Text>
              </View>
              <Text style={styles.summaryMeta}>Paid with {o.paymentLabel}</Text>
            </View>
          ) : null}
        </View>

        {delivered ? (
          <View style={{ gap: theme.spacing.sm }}>
            {!rated ? <Button label="Rate your order" onPress={() => setRateOpen(true)} /> : null}
            <Button label="Back to orders" variant="secondary" onPress={() => router.replace('/(tabs)/orders')} />
          </View>
        ) : null}

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>

      {/* Rating sheet */}
      <Sheet visible={rateOpen} onClose={() => setRateOpen(false)} title="Rate your order">
        <Text style={styles.rateSub}>How was {o.restaurantName}?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <PressableScale key={s} onPress={() => setStars(s)} accessibilityRole="button" accessibilityLabel={`${s} star${s > 1 ? 's' : ''}`} hitSlop={6} noAnimation>
              <Ionicons name={s <= stars ? 'star' : 'star-outline'} size={36} color={theme.colors.warning} />
            </PressableScale>
          ))}
        </View>
        <TextInput
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="Add a note (optional)"
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          maxLength={300}
          style={styles.reviewInput}
          accessibilityLabel="Review note"
        />
        <Button label="Submit rating" disabled={stars === 0} onPress={submitRating} />
      </Sheet>
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm, paddingHorizontal: t.screenPaddingX, paddingVertical: t.spacing.md },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary, flex: 1 },
    scroll: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.lg, paddingBottom: t.spacing.xl },
    deliveredBanner: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm, backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border },
    deliveredText: { ...t.typography.title, color: t.colors.textPrimary },
    etaPill: { position: 'absolute' as const, top: t.spacing.md, left: t.spacing.md, flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, backgroundColor: t.colors.accent, borderRadius: t.radii.pill, paddingHorizontal: t.spacing.md, paddingVertical: 6 },
    etaText: { ...t.typography.chip, color: t.colors.onAccent },
    headline: { ...t.typography.titleLg, color: t.colors.textPrimary },
    card: { backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border },
    courierCard: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border },
    avatar: { width: 46, height: 46, borderRadius: t.radii.pill, backgroundColor: t.colors.bgMuted, alignItems: 'center' as const, justifyContent: 'center' as const },
    courierName: { ...t.typography.title, color: t.colors.textPrimary },
    courierMeta: { ...t.typography.meta, color: t.colors.textSecondary },
    courierBtn: { width: 40, height: 40, borderRadius: t.radii.pill, backgroundColor: t.colors.bgMuted, alignItems: 'center' as const, justifyContent: 'center' as const, opacity: 0.6 },
    summaryHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    cardTitle: { ...t.typography.title, color: t.colors.textPrimary },
    summaryBody: { marginTop: t.spacing.md, gap: t.spacing.sm },
    summaryLine: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm },
    summaryQty: { ...t.typography.price, color: t.colors.textSecondary, width: 28 },
    summaryName: { ...t.typography.body, color: t.colors.textPrimary, flex: 1 },
    summaryPrice: { ...t.typography.price, color: t.colors.textPrimary },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
    totalValue: { ...t.typography.titleLg, color: t.colors.textPrimary },
    summaryMeta: { ...t.typography.meta, color: t.colors.textTertiary },
    rateSub: { ...t.typography.body, color: t.colors.textSecondary },
    stars: { flexDirection: 'row' as const, gap: t.spacing.sm, justifyContent: 'center' as const, paddingVertical: t.spacing.md },
    reviewInput: { ...t.typography.body, color: t.colors.textPrimary, backgroundColor: t.colors.bgMuted, borderRadius: t.radii.md, padding: t.spacing.md, minHeight: 72, textAlignVertical: 'top' as const },
  }));
}
