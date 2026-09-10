import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, useThemedStyles } from '@/theme';
import { SHIMMER_DURATION_MS } from './animations/motion';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Single shimmering placeholder block. Pauses animation under reduce-motion. */
export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration: SHIMMER_DURATION_MS }), -1, true);
  }, [reduced, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: reduced
      ? theme.colors.bgMuted
      : interpolateColor(progress.value, [0, 1], [theme.colors.bgMuted, theme.colors.border]),
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius ?? theme.radii.sm }, animatedStyle, style]}
    />
  );
}

/** Skeleton shaped like a RestaurantCard, for feed loading states. */
export function RestaurantCardSkeleton() {
  const styles = useThemedStyles((t) => ({
    card: { borderRadius: t.radii.lg, backgroundColor: t.colors.surface, overflow: 'hidden' as const, ...t.elevation.card },
    body: { padding: t.spacing.md, gap: t.spacing.sm },
  }));
  return (
    <View style={styles.card}>
      <Skeleton height={160} radius={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="45%" height={13} />
      </View>
    </View>
  );
}
