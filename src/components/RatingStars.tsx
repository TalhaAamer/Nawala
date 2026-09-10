import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';

export type RatingStarsProps = {
  rating: number; // 0..5
  count?: number;
  /** Show the star glyph alongside the number. */
  showIcon?: boolean;
  size?: number;
};

/**
 * Rating display. ALWAYS renders the numeric value as text (a11y — never
 * conveys rating by color/icon alone, DESIGN-SPEC §9).
 */
export function RatingStars({ rating, count, showIcon = true, size = 14 }: RatingStarsProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs },
    value: { ...t.typography.meta, color: t.colors.textPrimary },
    count: { ...t.typography.meta, color: t.colors.textSecondary },
  }));

  const label =
    count != null
      ? `${rating.toFixed(1)} stars from ${count.toLocaleString('en-US')} reviews`
      : `${rating.toFixed(1)} stars`;

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={label}>
      {showIcon ? <Ionicons name="star" size={size} color={theme.colors.warning} /> : null}
      <Text style={styles.value}>{rating.toFixed(1)}</Text>
      {count != null ? (
        <Text style={styles.count}>({count.toLocaleString('en-US')})</Text>
      ) : null}
    </View>
  );
}
