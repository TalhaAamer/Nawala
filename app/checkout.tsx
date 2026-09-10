import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { useTheme, useThemedStyles } from '@/theme';
import { Button, Chip, ChipRow, PressableScale, Sheet, SheetRow } from '@/components';
import { useAuthGate } from '@/features/auth/useAuthGate';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { useRestaurant } from '@/hooks/useApi';
import { api } from '@/services/api';
import { loadAddresses } from '@/services/storage/addresses';
import { mockCards, defaultCardId } from '@/features/checkout/payments';
import { formatMinor } from '@/lib/money';
import { computePricing } from '@/lib/pricing';
import { etaLabel } from '@/lib/restaurant';
import type { Address, PlaceOrderInput } from '@/types';

type SheetKind = null | 'address' | 'payment' | 'time' | 'tip';
const TIP_PCTS = [0, 10, 15, 20];

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { allowed } = useAuthGate('checkout');

  const items = useCart((s) => s.items);
  const restaurantId = useCart((s) => s.restaurantId);
  const restaurantName = useCart((s) => s.restaurantName);
  const subtotal = useCart((s) => s.subtotalMinor());
  const promoCode = useCart((s) => s.promoCode);
  const clearCart = useCart((s) => s.clear);
  const selectedAddressId = useSession((s) => s.selectedAddressId);
  const setAddress = useSession((s) => s.setAddress);

  const restaurant = useRestaurant(restaurantId ?? '');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cardId, setCardId] = useState(defaultCardId);
  const [tipPct, setTipPct] = useState(15);
  const [customTip, setCustomTip] = useState<number | null>(null);
  const [customTipInput, setCustomTipInput] = useState('');
  const [scheduledFor, setScheduledFor] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses().then(setAddresses);
  }, []);

  const tipMinor = customTip != null ? customTip : Math.round(subtotal * (tipPct / 100));

  const pricing = computePricing({
    subtotalMinor: subtotal,
    baseDeliveryFeeMinor: restaurant.data?.deliveryFeeMinor ?? 0,
    freeDeliveryThresholdMinor: restaurant.data?.freeDeliveryThresholdMinor,
    promoCode,
    tipMinor,
  });

  const address = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const card = mockCards.find((c) => c.id === cardId) ?? mockCards[0];

  const timeSlots = buildTimeSlots();

  const onPlaceOrder = async () => {
    if (submitting || !restaurantId || !address) return;
    setSubmitting(true);
    setError(null);
    const input: PlaceOrderInput = {
      restaurantId,
      restaurantName: restaurantName ?? restaurant.data?.name ?? 'Restaurant',
      items,
      addressId: address.id,
      paymentLabel: `${card.brand} ${card.label}`,
      tipMinor,
      subtotalMinor: pricing.subtotalMinor,
      feeMinor: pricing.deliveryFeeMinor,
      serviceFeeMinor: pricing.serviceFeeMinor,
      taxMinor: pricing.taxMinor,
      discountMinor: pricing.discountMinor,
      totalMinor: pricing.totalMinor,
      currency: 'USD',
      scheduledFor: scheduledFor ?? undefined,
    };
    try {
      const order = await api.placeOrder(input);
      clearCart();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/order/[id]', params: { id: order.id } });
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('We couldn’t place your order. Please try again.');
      setSubmitting(false);
    }
  };

  if (!allowed) return <View style={styles.safe} />;

  if (items.length === 0) {
    // Cart got cleared (e.g. order placed) — bounce home.
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackBtn onPress={() => router.replace('/(tabs)')} />
          <Text style={styles.title}>Checkout</Text>
        </View>
        <Text style={styles.note}>Your cart is empty.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackBtn onPress={() => router.back()} />
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Address */}
        <Card title="Delivery address" onAction={() => setSheet('address')} actionLabel="Change">
          {address ? (
            <>
              <Text style={styles.cardPrimary}>{address.label}</Text>
              <Text style={styles.cardSecondary}>{address.line1}, {address.city}</Text>
            </>
          ) : (
            <Text style={styles.cardSecondary}>No address selected</Text>
          )}
        </Card>

        {/* Time */}
        <Card title="Delivery time" onAction={() => setSheet('time')} actionLabel="Change">
          <Text style={styles.cardPrimary}>
            {scheduledFor ? `Scheduled · ${format(scheduledFor, 'h:mm a')}` : 'ASAP'}
          </Text>
          {!scheduledFor && restaurant.data ? <Text style={styles.cardSecondary}>{etaLabel(restaurant.data)}</Text> : null}
        </Card>

        {/* Payment */}
        <Card title="Payment" onAction={() => setSheet('payment')} actionLabel="Change">
          <View style={styles.payRow}>
            <Ionicons name="card" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.cardPrimary}>{card.brand} {card.label}</Text>
          </View>
          <Text style={styles.demoNote}>Demo build — no real payment is processed.</Text>
        </Card>

        {/* Tip */}
        <View style={styles.cardWrap}>
          <Text style={styles.cardTitle}>Add a tip</Text>
          <ChipRow>
            {TIP_PCTS.map((p) => (
              <Chip
                key={p}
                label={p === 0 ? 'None' : `${p}%`}
                selected={customTip == null && tipPct === p}
                onPress={() => {
                  setTipPct(p);
                  setCustomTip(null);
                }}
              />
            ))}
            <Chip label={customTip != null ? `Custom · ${formatMinor(customTip)}` : 'Custom'} selected={customTip != null} onPress={() => setSheet('tip')} />
          </ChipRow>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Row label="Subtotal" value={formatMinor(pricing.subtotalMinor)} />
          <Row label="Delivery fee" value={pricing.deliveryFeeMinor === 0 ? 'Free' : formatMinor(pricing.deliveryFeeMinor)} />
          <Row label="Service fee" value={formatMinor(pricing.serviceFeeMinor)} />
          <Row label="Estimated tax" value={formatMinor(pricing.taxMinor)} />
          {pricing.discountMinor > 0 ? <Row label={`Discount (${promoCode})`} value={`– ${formatMinor(pricing.discountMinor)}`} accent /> : null}
          <Row label="Tip" value={formatMinor(pricing.tipMinor)} />
          <View style={styles.divider} />
          <Row label="Total" value={formatMinor(pricing.totalMinor)} bold />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.accent} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ height: 96 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={submitting ? 'Placing order…' : 'Place order'}
          trailing={submitting ? undefined : formatMinor(pricing.totalMinor)}
          loading={submitting}
          disabled={submitting}
          onPress={onPlaceOrder}
        />
      </View>

      {/* Address sheet */}
      <Sheet visible={sheet === 'address'} onClose={() => setSheet(null)} title="Delivery address">
        {addresses.map((a) => (
          <SheetRow key={a.id}>
            <PressableScale
              onPress={() => {
                setAddress(a.id);
                setSheet(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: a.id === address?.id }}
              accessibilityLabel={`${a.label}, ${a.line1}`}
              style={styles.choiceRow}
              noAnimation
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardPrimary}>{a.label}</Text>
                <Text style={styles.cardSecondary}>{a.line1}, {a.city}</Text>
              </View>
              <Ionicons name={a.id === address?.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={a.id === address?.id ? theme.colors.accent : theme.colors.textTertiary} />
            </PressableScale>
          </SheetRow>
        ))}
      </Sheet>

      {/* Payment sheet */}
      <Sheet visible={sheet === 'payment'} onClose={() => setSheet(null)} title="Payment method">
        {mockCards.map((c) => (
          <SheetRow key={c.id}>
            <PressableScale
              onPress={() => {
                setCardId(c.id);
                setSheet(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: c.id === cardId }}
              accessibilityLabel={`${c.brand} ${c.label}`}
              style={styles.choiceRow}
              noAnimation
            >
              <Ionicons name="card" size={20} color={theme.colors.textPrimary} />
              <Text style={[styles.cardPrimary, { flex: 1 }]}>{c.brand} {c.label}</Text>
              <Ionicons name={c.id === cardId ? 'radio-button-on' : 'radio-button-off'} size={22} color={c.id === cardId ? theme.colors.accent : theme.colors.textTertiary} />
            </PressableScale>
          </SheetRow>
        ))}
        <Text style={styles.demoNote}>Demo build — these are not real cards.</Text>
      </Sheet>

      {/* Time sheet */}
      <Sheet visible={sheet === 'time'} onClose={() => setSheet(null)} title="Delivery time" snapPoints={['60%']}>
        <ScrollView>
          <SheetRow>
            <PressableScale
              onPress={() => {
                setScheduledFor(null);
                setSheet(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: scheduledFor == null }}
              accessibilityLabel="Deliver as soon as possible"
              style={styles.choiceRow}
              noAnimation
            >
              <Text style={[styles.cardPrimary, { flex: 1 }]}>ASAP</Text>
              <Ionicons name={scheduledFor == null ? 'radio-button-on' : 'radio-button-off'} size={22} color={scheduledFor == null ? theme.colors.accent : theme.colors.textTertiary} />
            </PressableScale>
          </SheetRow>
          {timeSlots.map((ts) => (
            <SheetRow key={ts}>
              <PressableScale
                onPress={() => {
                  setScheduledFor(ts);
                  setSheet(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: scheduledFor === ts }}
                accessibilityLabel={`Deliver at ${format(ts, 'h:mm a')}`}
                style={styles.choiceRow}
                noAnimation
              >
                <Text style={[styles.cardPrimary, { flex: 1 }]}>{format(ts, 'h:mm a')}</Text>
                <Ionicons name={scheduledFor === ts ? 'radio-button-on' : 'radio-button-off'} size={22} color={scheduledFor === ts ? theme.colors.accent : theme.colors.textTertiary} />
              </PressableScale>
            </SheetRow>
          ))}
        </ScrollView>
      </Sheet>

      {/* Custom tip sheet */}
      <Sheet visible={sheet === 'tip'} onClose={() => setSheet(null)} title="Custom tip">
        <View style={styles.tipInputRow}>
          <Text style={styles.tipDollar}>$</Text>
          <TextInput
            value={customTipInput}
            onChangeText={(t) => setCustomTipInput(t.replace(/[^0-9]/g, ''))}
            placeholder="0"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="number-pad"
            style={styles.tipInput}
            accessibilityLabel="Custom tip in dollars"
          />
        </View>
        <Button
          label="Set tip"
          onPress={() => {
            const dollars = parseInt(customTipInput || '0', 10);
            setCustomTip(dollars * 100);
            setCustomTipInput('');
            setSheet(null);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function buildTimeSlots(): number[] {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(Math.ceil((now.getMinutes() + 30) / 15) * 15, 0, 0);
  const slots: number[] = [];
  for (let i = 0; i < 24; i++) {
    slots.push(start.getTime() + i * 15 * 60 * 1000);
  }
  return slots;
}

function Card({ title, children, onAction, actionLabel }: { title: string; children: React.ReactNode; onAction?: () => void; actionLabel?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title}</Text>
        {onAction ? (
          <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={`${actionLabel} ${title}`} noAnimation>
            <Text style={styles.action}>{actionLabel}</Text>
          </PressableScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  const { theme } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={bold ? styles.rowLabelBold : styles.rowLabel}>{label}</Text>
      <Text style={[bold ? styles.rowValueBold : styles.rowValue, accent && { color: theme.colors.success }]}>{value}</Text>
    </View>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} noAnimation>
      <Ionicons name="chevron-back" size={26} color={theme.colors.textPrimary} />
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm, paddingHorizontal: t.screenPaddingX, paddingVertical: t.spacing.md },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary },
    scroll: { padding: t.screenPaddingX, gap: t.spacing.md },
    note: { ...t.typography.body, color: t.colors.textSecondary, paddingHorizontal: t.screenPaddingX },
    cardWrap: { backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, gap: t.spacing.xs, borderWidth: 1, borderColor: t.colors.border },
    cardHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    cardTitle: { ...t.typography.title, color: t.colors.textPrimary },
    action: { ...t.typography.chip, color: t.colors.accent },
    cardPrimary: { ...t.typography.body, color: t.colors.textPrimary },
    cardSecondary: { ...t.typography.meta, color: t.colors.textSecondary },
    payRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm },
    demoNote: { ...t.typography.meta, color: t.colors.textTertiary, marginTop: t.spacing.xs },
    summary: { backgroundColor: t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing.lg, gap: t.spacing.sm, borderWidth: 1, borderColor: t.colors.border },
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    rowLabel: { ...t.typography.body, color: t.colors.textSecondary },
    rowLabelBold: { ...t.typography.title, color: t.colors.textPrimary },
    rowValue: { ...t.typography.body, color: t.colors.textPrimary },
    rowValueBold: { ...t.typography.titleLg, color: t.colors.textPrimary },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
    errorBanner: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.sm, backgroundColor: t.colors.accentSoft, borderRadius: t.radii.md, padding: t.spacing.md },
    errorText: { ...t.typography.meta, color: t.colors.onAccentSoft, flex: 1 },
    footer: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, paddingBottom: t.spacing.lg, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.border },
    choiceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, flex: 1 },
    tipInputRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, backgroundColor: t.colors.bgMuted, borderRadius: t.radii.md, paddingHorizontal: t.spacing.lg },
    tipDollar: { ...t.typography.titleLg, color: t.colors.textPrimary },
    tipInput: { ...t.typography.titleLg, color: t.colors.textPrimary, flex: 1, minHeight: 56 },
  }));
}
