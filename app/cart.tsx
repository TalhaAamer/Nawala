import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, QuantityStepper, EmptyState, PressableScale } from '@/components';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { useRestaurant } from '@/hooks/useApi';
import { formatMinor } from '@/lib/money';
import { computePricing, validatePromo } from '@/lib/pricing';
import { etaLabel } from '@/lib/restaurant';
import type { CartItem } from '@/types';

export default function CartScreen() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();

  const items = useCart((s) => s.items);
  const restaurantId = useCart((s) => s.restaurantId);
  const restaurantName = useCart((s) => s.restaurantName);
  const subtotal = useCart((s) => s.subtotalMinor());
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const promoCode = useCart((s) => s.promoCode);
  const setPromo = useCart((s) => s.setPromo);
  const isAuthed = useSession((s) => s.user?.kind === 'user');

  const restaurant = useRestaurant(restaurantId ?? '');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const pricing = computePricing({
    subtotalMinor: subtotal,
    baseDeliveryFeeMinor: restaurant.data?.deliveryFeeMinor ?? 0,
    freeDeliveryThresholdMinor: restaurant.data?.freeDeliveryThresholdMinor,
    promoCode,
  });

  const applyPromo = () => {
    const result = validatePromo(promoInput);
    if (result.ok) {
      setPromo(promoInput.trim().toUpperCase());
      setPromoError(null);
      setPromoInput('');
    } else {
      setPromoError('That promo code isn’t valid.');
    }
  };

  const onCheckout = () => {
    if (!isAuthed) {
      router.push({ pathname: '/(auth)/sign-in', params: { reason: 'checkout' } });
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header onClose={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="bag-handle-outline"
            title="Your cart is empty"
            message="Add items from a restaurant to get started."
            actionLabel="Browse restaurants"
            onAction={() => router.replace('/(tabs)')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header onClose={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Restaurant group header */}
        <View style={styles.groupHead}>
          <Text style={styles.restName}>{restaurantName ?? restaurant.data?.name ?? 'Your order'}</Text>
          {restaurant.data ? <Text style={styles.meta}>{etaLabel(restaurant.data)} delivery</Text> : null}
        </View>

        <View style={styles.lines}>
          {items.map((line) => (
            <CartLine
              key={line.id}
              line={line}
              onQty={(q) => setQty(line.id, q)}
              onRemove={() => remove(line.id)}
            />
          ))}
        </View>

        {/* Promo */}
        <View style={styles.promoCard}>
          {promoCode ? (
            <View style={styles.promoApplied}>
              <Ionicons name="pricetag" size={18} color={theme.colors.success} />
              <Text style={styles.promoAppliedText}>{promoCode} applied</Text>
              <PressableScale onPress={() => setPromo(null)} accessibilityRole="button" accessibilityLabel="Remove promo code" noAnimation>
                <Text style={styles.promoRemove}>Remove</Text>
              </PressableScale>
            </View>
          ) : (
            <>
              <View style={styles.promoRow}>
                <TextInput
                  value={promoInput}
                  onChangeText={(t) => {
                    setPromoInput(t);
                    setPromoError(null);
                  }}
                  placeholder="Promo code (try CRAVE10)"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="characters"
                  style={styles.promoInput}
                  accessibilityLabel="Promo code"
                />
                <Button label="Apply" variant="secondary" fullWidth={false} onPress={applyPromo} />
              </View>
              {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
            </>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Row label="Subtotal" value={formatMinor(pricing.subtotalMinor)} />
          <Row
            label="Delivery fee"
            value={pricing.deliveryFeeMinor === 0 ? 'Free' : formatMinor(pricing.deliveryFeeMinor)}
            hint={pricing.freeDeliveryApplied ? 'Free delivery unlocked' : undefined}
          />
          <Row label="Service fee" value={formatMinor(pricing.serviceFeeMinor)} />
          <Row label="Estimated tax" value={formatMinor(pricing.taxMinor)} />
          {pricing.discountMinor > 0 ? (
            <Row label={`Discount (${promoCode})`} value={`– ${formatMinor(pricing.discountMinor)}`} accent />
          ) : null}
          <View style={styles.divider} />
          <Row label="Total" value={formatMinor(pricing.totalMinor)} bold />
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: theme.spacing.lg }]}>
        <Button label="Go to checkout" trailing={formatMinor(pricing.totalMinor)} onPress={onCheckout} />
      </View>
    </SafeAreaView>
  );
}

function CartLine({ line, onQty, onRemove }: { line: CartItem; onQty: (q: number) => void; onRemove: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <Swipeable
      renderRightActions={() => (
        <PressableScale onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${line.name}`} style={styles.swipeDelete} noAnimation>
          <Ionicons name="trash" size={22} color={theme.colors.onAccent} />
        </PressableScale>
      )}
    >
      <View style={styles.line}>
        {line.image ? (
          <Image source={line.image} placeholder={line.blurhash ? { blurhash: line.blurhash } : undefined} contentFit="cover" style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.colors.bgMuted }]} />
        )}
        <View style={styles.lineBody}>
          <Text style={styles.lineName} numberOfLines={1}>
            {line.name}
          </Text>
          {line.optionsSummary ? <Text style={styles.lineOpts} numberOfLines={1}>{line.optionsSummary}</Text> : null}
          {line.notes ? <Text style={styles.lineNotes} numberOfLines={1}>“{line.notes}”</Text> : null}
          <Text style={styles.linePrice}>{formatMinor(line.priceMinor * line.qty)}</Text>
        </View>
        <QuantityStepper value={line.qty} onChange={onQty} min={0} allowRemove size="sm" accessibilityLabel={`${line.name} quantity`} />
      </View>
    </Swipeable>
  );
}

function Row({ label, value, bold, accent, hint }: { label: string; value: string; bold?: boolean; accent?: boolean; hint?: string }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={bold ? styles.rowLabelBold : styles.rowLabel}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: theme.colors.success }]}>{hint}</Text> : null}
      </View>
      <Text style={[bold ? styles.rowValueBold : styles.rowValue, accent && { color: theme.colors.success }]}>{value}</Text>
    </View>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Your cart</Text>
      <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} noAnimation>
        <Ionicons name="close" size={26} color={theme.colors.textPrimary} />
      </PressableScale>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: t.screenPaddingX, paddingVertical: t.spacing.md },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary },
    scroll: { paddingBottom: t.spacing.lg },
    groupHead: { paddingHorizontal: t.screenPaddingX, paddingBottom: t.spacing.sm, gap: 2 },
    restName: { ...t.typography.title, color: t.colors.textPrimary },
    meta: { ...t.typography.meta, color: t.colors.textSecondary },
    lines: { borderTopWidth: 1, borderTopColor: t.colors.border },
    line: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, paddingHorizontal: t.screenPaddingX, paddingVertical: t.spacing.md, backgroundColor: t.colors.bg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    thumb: { width: 56, height: 56, borderRadius: t.radii.sm, backgroundColor: t.colors.bgMuted },
    lineBody: { flex: 1, gap: 2 },
    lineName: { ...t.typography.title, color: t.colors.textPrimary },
    lineOpts: { ...t.typography.meta, color: t.colors.textSecondary },
    lineNotes: { ...t.typography.meta, color: t.colors.textTertiary, fontStyle: 'italic' as const },
    linePrice: { ...t.typography.price, color: t.colors.textPrimary, marginTop: 2 },
    swipeDelete: { backgroundColor: t.colors.accent, justifyContent: 'center' as const, alignItems: 'center' as const, width: 72 },
    promoCard: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.lg },
    promoRow: { flexDirection: 'row' as const, gap: t.spacing.sm, alignItems: 'center' as const },
    promoInput: { ...t.typography.body, color: t.colors.textPrimary, flex: 1, backgroundColor: t.colors.bgMuted, borderRadius: t.radii.md, paddingHorizontal: t.spacing.lg, minHeight: 48 },
    promoError: { ...t.typography.meta, color: t.colors.accent, marginTop: t.spacing.xs },
    promoApplied: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm },
    promoAppliedText: { ...t.typography.body, color: t.colors.textPrimary, flex: 1 },
    promoRemove: { ...t.typography.chip, color: t.colors.accent },
    summary: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.lg, gap: t.spacing.sm },
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    rowLabel: { ...t.typography.body, color: t.colors.textSecondary },
    rowLabelBold: { ...t.typography.title, color: t.colors.textPrimary },
    rowHint: { ...t.typography.meta },
    rowValue: { ...t.typography.body, color: t.colors.textPrimary },
    rowValueBold: { ...t.typography.titleLg, color: t.colors.textPrimary },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
    footer: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.border },
  }));
}
