import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, type View as RNView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTheme, useThemedStyles } from '@/theme';
import {
  Button,
  QuantityStepper,
  PressableScale,
  Skeleton,
  EmptyState,
  Sheet,
  useFlyToCart,
} from '@/components';
import { useMenu, useRestaurant } from '@/hooks/useApi';
import { useCart } from '@/store/cart';
import { formatMinor } from '@/lib/money';
import {
  unitPriceMinor,
  selectionComplete,
  buildCartItem,
  type Selection,
} from '@/lib/cart';
import type { OptionGroup } from '@/types';

export const unstable_settings = { presentation: 'modal' };

export default function ItemModal() {
  const { theme } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, restaurantId } = useLocalSearchParams<{ id: string; restaurantId: string }>();

  const menu = useMenu(restaurantId ?? '');
  const restaurant = useRestaurant(restaurantId ?? '');
  const item = useMemo(
    () => (menu.data ?? []).flatMap((s) => s.items).find((i) => i.id === id),
    [menu.data, id],
  );

  const add = useCart((s) => s.add);
  const canAdd = useCart((s) => s.canAdd);
  const { fly } = useFlyToCart();

  const [selection, setSelection] = useState<Selection>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const photoRef = useRef<RNView>(null);

  const groups = item?.optionGroups ?? [];
  const complete = selectionComplete(groups, selection);
  const unit = item ? unitPriceMinor(item, selection) : 0;
  const total = unit * qty;

  const pick = (group: OptionGroup, optionId: string) => {
    setSelection((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.type === 'radio') return { ...prev, [group.id]: [optionId] };
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      return { ...prev, [group.id]: next };
    });
  };

  const doAdd = () => {
    if (!item || !restaurantId) return;
    const line = buildCartItem(item, restaurantId, selection, qty, notes.trim() || undefined);
    add(line, restaurant.data?.name);
    photoRef.current?.measureInWindow((x, y, width, height) => {
      void fly({ from: { x, y, width, height }, image: item.image, blurhash: item.blurhash });
    });
    router.back();
  };

  const onAddPress = () => {
    if (!item || !restaurantId) return;
    if (!canAdd(restaurantId)) setConfirmOpen(true);
    else doAdd();
  };

  // ── Loading / not found ──────────────────────────────────────────────────────
  if (menu.loading && !menu.data) {
    return (
      <View style={styles.safe}>
        <Handle />
        <Skeleton width="100%" height={220} radius={0} />
        <View style={styles.body}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="90%" height={16} />
          <Skeleton width="40%" height={20} />
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.safe, { justifyContent: 'center' }]}>
        <Handle />
        <EmptyState variant="error" title="Item unavailable" message="This item couldn’t be loaded." actionLabel="Close" onAction={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <Handle />
      <PressableScale onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" style={styles.close} hitSlop={8} noAnimation>
        <Ionicons name="close" size={22} color="#FFFFFF" />
      </PressableScale>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View ref={photoRef} collapsable={false}>
          <Image
            source={item.image}
            placeholder={{ blurhash: item.blurhash }}
            contentFit="cover"
            transition={200}
            style={styles.photo}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          <Text style={styles.price}>{formatMinor(item.priceMinor, item.currency)}</Text>

          {groups.map((group) => (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.required ? <Text style={styles.required}>Required</Text> : <Text style={styles.optional}>Optional</Text>}
              </View>
              {group.options.map((opt) => {
                const selected = (selection[group.id] ?? []).includes(opt.id);
                return (
                  <PressableScale
                    key={opt.id}
                    onPress={() => pick(group, opt.id)}
                    accessibilityRole={group.type === 'radio' ? 'radio' : 'checkbox'}
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${opt.label}${opt.priceDeltaMinor > 0 ? `, plus ${formatMinor(opt.priceDeltaMinor)}` : ''}`}
                    style={styles.optRow}
                    noAnimation
                  >
                    <Ionicons
                      name={
                        group.type === 'radio'
                          ? selected
                            ? 'radio-button-on'
                            : 'radio-button-off'
                          : selected
                            ? 'checkbox'
                            : 'square-outline'
                      }
                      size={22}
                      color={selected ? theme.colors.accent : theme.colors.textTertiary}
                    />
                    <Text style={styles.optLabel}>{opt.label}</Text>
                    {opt.priceDeltaMinor > 0 ? <Text style={styles.optDelta}>+ {formatMinor(opt.priceDeltaMinor)}</Text> : null}
                  </PressableScale>
                );
              })}
            </View>
          ))}

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Special instructions</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note (allergies, preferences…)"
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={200}
              multiline
              style={styles.notes}
              accessibilityLabel="Special instructions"
            />
          </View>

          <View style={styles.qtyRow}>
            <Text style={styles.groupTitle}>Quantity</Text>
            <QuantityStepper value={qty} onChange={setQty} min={1} max={20} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        <Button
          label={complete ? 'Add to cart' : 'Select required options'}
          trailing={complete ? formatMinor(total, item.currency) : undefined}
          onPress={onAddPress}
          disabled={!complete}
        />
      </View>

      <Sheet visible={confirmOpen} onClose={() => setConfirmOpen(false)} title="Start a new cart?">
        <Text style={styles.confirmText}>
          Your cart has items from another restaurant. Adding this will clear your current cart.
        </Text>
        <Button
          label="Start new cart"
          onPress={() => {
            setConfirmOpen(false);
            doAdd();
          }}
        />
        <Button label="Keep current cart" variant="ghost" onPress={() => setConfirmOpen(false)} />
      </Sheet>
    </View>
  );
}

function Handle() {
  const styles = useStyles();
  return <View style={styles.handle} />;
}

function useStyles() {
  return useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    handle: { alignSelf: 'center' as const, width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border, marginTop: t.spacing.sm, zIndex: 2 },
    close: { position: 'absolute' as const, top: t.spacing.lg, right: t.spacing.lg, zIndex: 3, width: 36, height: 36, borderRadius: t.radii.pill, backgroundColor: t.colors.scrim, alignItems: 'center' as const, justifyContent: 'center' as const },
    photo: { width: '100%' as const, height: 240, backgroundColor: t.colors.bgMuted },
    body: { paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.lg, gap: t.spacing.sm },
    name: { ...t.typography.display, color: t.colors.textPrimary },
    desc: { ...t.typography.body, color: t.colors.textSecondary },
    price: { ...t.typography.titleLg, color: t.colors.textPrimary, marginTop: t.spacing.xs },
    group: { gap: t.spacing.xs, marginTop: t.spacing.lg },
    groupHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    groupTitle: { ...t.typography.title, color: t.colors.textPrimary },
    required: { ...t.typography.meta, color: t.colors.accent },
    optional: { ...t.typography.meta, color: t.colors.textTertiary },
    optRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.md, paddingVertical: t.spacing.sm, minHeight: t.minHitTarget },
    optLabel: { ...t.typography.body, color: t.colors.textPrimary, flex: 1 },
    optDelta: { ...t.typography.price, color: t.colors.textSecondary },
    notes: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      backgroundColor: t.colors.bgMuted,
      borderRadius: t.radii.md,
      padding: t.spacing.md,
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
    qtyRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: t.spacing.xl },
    footer: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, paddingHorizontal: t.screenPaddingX, paddingTop: t.spacing.sm, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.border },
    confirmText: { ...t.typography.body, color: t.colors.textSecondary },
  }));
}
