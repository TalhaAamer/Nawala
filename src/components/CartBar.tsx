import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemedStyles } from '@/theme';
import { formatMinor } from '@/lib/money';
import type { CurrencyCode } from '@/types';
import { PressableScale } from './PressableScale';
import { ENTER_SPRING } from './animations/motion';

export type CartBarProps = {
  itemCount: number;
  subtotalMinor: number;
  currency?: CurrencyCode;
  onPress?: () => void;
  label?: string;
};

/**
 * Sticky bottom cart bar. Slides up when the cart becomes non-empty, down when
 * emptied (DESIGN-SPEC §5/§8). Prop-driven so screens wire the cart store to it.
 */
export function CartBar({
  itemCount,
  subtotalMinor,
  currency = 'USD',
  onPress,
  label = 'View cart',
}: CartBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const visible = itemCount > 0;

  const translateY = useSharedValue(visible ? 0 : 120);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      translateY.value = visible ? 0 : 120;
      opacity.value = withTiming(visible ? 1 : 0, { duration: 150 });
    } else {
      translateY.value = withSpring(visible ? 0 : 120, ENTER_SPRING);
      opacity.value = withTiming(visible ? 1 : 0, { duration: 180 });
    }
  }, [visible, reduced, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const styles = useThemedStyles((t) => ({
    wrap: {
      position: 'absolute' as const,
      left: t.screenPaddingX,
      right: t.screenPaddingX,
      bottom: 0,
    },
    bar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      backgroundColor: t.colors.accent,
      borderRadius: t.radii.lg,
      paddingHorizontal: t.spacing.lg,
      minHeight: 56,
      ...t.elevation.cartBar,
    },
    countBubble: {
      minWidth: 26,
      height: 26,
      paddingHorizontal: 6,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.onAccent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    countText: { ...t.typography.price, color: t.colors.accent },
    label: { ...t.typography.title, color: t.colors.onAccent, flex: 1 },
    subtotal: { ...t.typography.price, color: t.colors.onAccent },
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.wrap, { paddingBottom: insets.bottom + theme.spacing.sm }, animatedStyle]}
    >
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}, subtotal ${formatMinor(subtotalMinor, currency)}`}
        style={styles.bar}
      >
        <View style={styles.countBubble}>
          <Text style={styles.countText}>{itemCount}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtotal}>{formatMinor(subtotalMinor, currency)}</Text>
        <Ionicons name="arrow-forward" size={18} color={theme.colors.onAccent} />
      </PressableScale>
    </Animated.View>
  );
}
