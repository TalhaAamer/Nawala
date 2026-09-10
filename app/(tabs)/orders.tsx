import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, EmptyState, PressableScale, SectionHeader, Skeleton, Sheet } from '@/components';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useOrders } from '@/hooks/useApi';
import { orderClock } from '@/services/api';
import { useCart } from '@/store/cart';
import { formatMinor } from '@/lib/money';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  picked_up: 'Picked up',
  on_the_way: 'On the way',
  delivered: 'Delivered',
};

export default function Orders() {
  const styles = useStyles();
  const router = useRouter();
  const { allowed } = useAuthGate('orders');
  const orders = useOrders();
  const cartItems = useCart((s) => s.items);
  const cartRestaurant = useCart((s) => s.restaurantId);
  const replaceCart = useCart((s) => s.replace);

  const [pendingReorder, setPendingReorder] = useState<Order | null>(null);

  // Refetch whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      orders.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const active = (orders.data ?? []).filter((o) => o.status !== 'delivered');
  const past = (orders.data ?? []).filter((o) => o.status === 'delivered');

  // Live-update the list as active orders advance.
  const activeIds = active.map((o) => o.id).join(',');
  useEffect(() => {
    if (!activeIds) return;
    const unsubs = activeIds.split(',').map((oid) => orderClock.subscribe(oid, () => orders.refetch()));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds]);

  const doReorder = (order: Order) => {
    replaceCart(order.items, order.restaurantId, order.restaurantName);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/cart');
  };

  const onReorder = (order: Order) => {
    if (cartItems.length > 0 && cartRestaurant !== order.restaurantId) {
      setPendingReorder(order);
    } else {
      doReorder(order);
    }
  };

  if (!allowed) return <View style={styles.safe} />;

  if (orders.loading && !orders.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={92} radius={14} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (orders.error && !orders.data) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]} edges={['top']}>
        <EmptyState variant="error" title="Couldn’t load orders" message="Please try again." actionLabel="Retry" onAction={orders.refetch} />
      </SafeAreaView>
    );
  }

  if ((orders.data?.length ?? 0) === 0) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]} edges={['top']}>
        <EmptyState
          icon="receipt-outline"
          title="No orders yet"
          message="When you place an order it’ll show up here."
          actionLabel="Browse restaurants"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {active.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Active" />
            {active.map((o) => (
              <OrderRow key={o.id} order={o} onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })} />
            ))}
          </View>
        ) : null}

        {past.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Past orders" />
            {past.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}
                onReorder={() => onReorder(o)}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="time-outline" title="No past orders" message="Your past orders show up here." />
        )}
      </ScrollView>

      <Sheet visible={pendingReorder != null} onClose={() => setPendingReorder(null)} title="Start a new cart?">
        <Text style={styles.confirmText}>Reordering will replace your current cart with items from {pendingReorder?.restaurantName}.</Text>
        <Button
          label="Replace cart & reorder"
          onPress={() => {
            if (pendingReorder) doReorder(pendingReorder);
            setPendingReorder(null);
          }}
        />
        <Button label="Keep current cart" variant="ghost" onPress={() => setPendingReorder(null)} />
      </Sheet>
    </SafeAreaView>
  );
}

function OrderRow({ order, onPress, onReorder }: { order: Order; onPress: () => void; onReorder?: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles();
  const itemCount = order.items.reduce((n, it) => n + it.qty, 0);
  const isActive = order.status !== 'delivered';
  const thumb = order.items.find((it) => it.image)?.image;

  return (
    <View style={styles.orderCard}>
      <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${order.restaurantName}, ${itemCount} items, ${STATUS_LABEL[order.status]}`} style={styles.orderMain} noAnimation>
        {thumb ? (
          <Image source={thumb} contentFit="cover" style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.colors.bgMuted }]} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.orderName} numberOfLines={1}>{order.restaurantName}</Text>
          <Text style={styles.orderMeta}>{itemCount} items · {formatMinor(order.totalMinor)}</Text>
          <View style={styles.statusRow}>
            {isActive ? <View style={[styles.dot, { backgroundColor: theme.colors.success }]} /> : null}
            <Text style={[styles.orderStatus, isActive && { color: theme.colors.success }]}>
              {isActive ? STATUS_LABEL[order.status] : `Delivered · ${formatDistanceToNow(order.placedAt, { addSuffix: true })}`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </PressableScale>

      {onReorder ? (
        <View style={styles.reorderWrap}>
          <Button label="Reorder" variant="secondary" icon="repeat" fullWidth={false} onPress={onReorder} />
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { paddingHorizontal: t.screenPaddingX, paddingVertical: t.spacing.md },
    title: { ...t.typography.display, color: t.colors.textPrimary },
    scroll: { paddingHorizontal: t.screenPaddingX, paddingBottom: t.spacing.xl, gap: t.spacing.xl },
    list: { paddingHorizontal: t.screenPaddingX, gap: t.spacing.md },
    section: { gap: t.spacing.md },
    orderCard: { backgroundColor: t.colors.surface, borderRadius: t.radii.lg, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' as const },
    orderMain: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, padding: t.spacing.md },
    thumb: { width: 56, height: 56, borderRadius: t.radii.sm },
    orderName: { ...t.typography.title, color: t.colors.textPrimary },
    orderMeta: { ...t.typography.meta, color: t.colors.textSecondary },
    statusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    orderStatus: { ...t.typography.meta, color: t.colors.textSecondary },
    reorderWrap: { paddingHorizontal: t.spacing.md, paddingBottom: t.spacing.md, alignItems: 'flex-start' as const },
    confirmText: { ...t.typography.body, color: t.colors.textSecondary },
  }));
}
