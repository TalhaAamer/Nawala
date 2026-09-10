import { forwardRef } from 'react';
import { Text, View, type View as RNView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import type { MenuItem } from '@/types';
import { formatMinor } from '@/lib/money';
import { PressableScale } from './PressableScale';

export type MenuItemRowProps = {
  item: MenuItem;
  onPress?: () => void;
  onAdd?: () => void;
  /** Quantity of this item already in cart (shows a count chip on the add button). */
  cartQty?: number;
};

/** Menu row: text left, square photo right with a circular "+" add button (DESIGN-SPEC §5). */
export const MenuItemRow = forwardRef<RNView, MenuItemRowProps>(function MenuItemRow(
  { item, onPress, onAdd, cartQty = 0 },
  ref,
) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row' as const, gap: t.spacing.md, paddingVertical: t.spacing.md },
    text: { flex: 1, gap: t.spacing.xs },
    name: { ...t.typography.title, color: t.colors.textPrimary },
    popular: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs },
    popularText: { ...t.typography.meta, color: t.colors.accent },
    desc: { ...t.typography.meta, color: t.colors.textSecondary },
    price: { ...t.typography.price, color: t.colors.textPrimary, marginTop: t.spacing.xs },
    media: { width: 96 },
    photo: { width: 96, height: 96, borderRadius: t.radii.md, backgroundColor: t.colors.bgMuted },
    addBtn: {
      position: 'absolute' as const,
      bottom: -10,
      right: -6,
      width: 34,
      height: 34,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...t.elevation.card,
    },
    qtyBadge: {
      position: 'absolute' as const,
      top: -6,
      left: -6,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    qtyText: { ...t.typography.chip, color: t.colors.onAccent, fontSize: 11, lineHeight: 14 },
  }));

  return (
    <PressableScale
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatMinor(item.priceMinor, item.currency)}${item.popular ? ', popular' : ''}`}
      style={styles.row}
      noAnimation
    >
      <View style={styles.text}>
        {item.popular ? (
          <View style={styles.popular}>
            <Ionicons name="flame" size={13} color={theme.colors.accent} />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>{formatMinor(item.priceMinor, item.currency)}</Text>
      </View>

      <View style={styles.media}>
        <Image
          source={item.image}
          placeholder={{ blurhash: item.blurhash }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          style={styles.photo}
        />
        {onAdd ? (
          <PressableScale
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to cart`}
            style={styles.addBtn}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color={theme.colors.accent} />
            {cartQty > 0 ? (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{cartQty}</Text>
              </View>
            ) : null}
          </PressableScale>
        ) : null}
      </View>
    </PressableScale>
  );
});
