import { useEffect, useRef } from 'react';
import { Text, View, type View as RNView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useTheme, useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';
import { useCartIconTarget } from './animations/CartIconTarget';
import { BADGE_BUMP_SPRING } from './animations/motion';

export type LocationHeaderProps = {
  addressLabel: string;
  onPressLocation?: () => void;
  onPressCart?: () => void;
  cartCount?: number;
};

/** Top-of-home header: location selector + cart icon with live badge (DESIGN-SPEC §5). */
export function LocationHeader({
  addressLabel,
  onPressLocation,
  onPressCart,
  cartCount = 0,
}: LocationHeaderProps) {
  const { theme } = useTheme();
  const target = useCartIconTarget();
  const iconRef = useRef<RNView>(null);

  // Register the cart icon as the fly-to-cart animation target.
  useEffect(() => {
    target?.registerTarget(iconRef.current);
    return () => target?.registerTarget(null);
  }, [target]);

  // Spring-bump the badge when the count increases.
  const bump = useSharedValue(1);
  const prevCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCount.current) {
      bump.value = withSequence(withSpring(1.35, BADGE_BUMP_SPRING), withSpring(1, BADGE_BUMP_SPRING));
    }
    prevCount.current = cartCount;
  }, [cartCount, bump]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    locBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, flexShrink: 1 },
    deliverTo: { ...t.typography.meta, color: t.colors.textSecondary },
    addressRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs },
    address: { ...t.typography.title, color: t.colors.textPrimary, flexShrink: 1 },
    cartBtn: {
      width: t.minHitTarget,
      height: t.minHitTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.bgMuted,
    },
    badge: {
      position: 'absolute' as const,
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    badgeText: { ...t.typography.chip, color: t.colors.onAccent, fontSize: 11, lineHeight: 14 },
  }));

  return (
    <View style={styles.row}>
      <PressableScale
        onPress={onPressLocation}
        accessibilityRole="button"
        accessibilityLabel={`Deliver to ${addressLabel}. Change delivery address`}
        style={styles.locBtn}
        noAnimation
      >
        <Ionicons name="location-sharp" size={18} color={theme.colors.accent} />
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.deliverTo}>Deliver to</Text>
          <View style={styles.addressRow}>
            <Text style={styles.address} numberOfLines={1}>
              {addressLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.textPrimary} />
          </View>
        </View>
      </PressableScale>

      <PressableScale
        ref={iconRef}
        onPress={onPressCart}
        accessibilityRole="button"
        accessibilityLabel={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        style={styles.cartBtn}
        hitSlop={6}
      >
        <Ionicons name="bag-handle-outline" size={22} color={theme.colors.textPrimary} />
        {cartCount > 0 ? (
          <Animated.View style={[styles.badge, badgeStyle]}>
            <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
          </Animated.View>
        ) : null}
      </PressableScale>
    </View>
  );
}
