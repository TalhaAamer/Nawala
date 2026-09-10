import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useThemedStyles } from '@/theme';
import type { Restaurant } from '@/types';
import { etaLabel, restaurantA11yLabel } from '@/lib/restaurant';
import { deliveryFeeLabel } from '@/lib/money';
import { PressableScale } from './PressableScale';
import { Badge } from './Badge';
import { RatingStars } from './RatingStars';

export type RestaurantCardWideProps = {
  restaurant: Restaurant;
  onPress?: () => void;
  /** Fixed width for horizontal carousels. */
  width?: number;
};

/** Horizontal-carousel card ("Fastest near you") — DESIGN-SPEC §5. */
export function RestaurantCardWide({ restaurant: r, onPress, width = 260 }: RestaurantCardWideProps) {
  const styles = useThemedStyles((t) => ({
    card: { width, gap: t.spacing.sm },
    heroWrap: { borderRadius: t.radii.md, overflow: 'hidden' as const },
    hero: { width: '100%' as const, aspectRatio: 16 / 9, backgroundColor: t.colors.bgMuted },
    badge: { position: 'absolute' as const, top: t.spacing.sm, left: t.spacing.sm },
    title: { ...t.typography.title, color: t.colors.textPrimary },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs },
    meta: { ...t.typography.meta, color: t.colors.textSecondary },
    dot: { ...t.typography.meta, color: t.colors.textTertiary },
  }));

  const badge = r.badges.includes('Free delivery')
    ? { label: 'Free delivery', tone: 'success' as const }
    : r.badges[0]
      ? { label: r.badges[0], tone: 'accent' as const }
      : null;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={restaurantA11yLabel(r)}
      style={styles.card}
    >
      <View style={styles.heroWrap}>
        <Image
          source={r.heroImage}
          placeholder={{ blurhash: r.blurhash }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          style={styles.hero}
        />
        {badge ? (
          <View style={styles.badge}>
            <Badge label={badge.label} tone={badge.tone} variant="solid" />
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {r.name}
      </Text>
      <View style={styles.metaRow}>
        <RatingStars rating={r.rating} count={r.ratingCount} />
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{etaLabel(r)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta}>{deliveryFeeLabel(r.deliveryFeeMinor, r.currency)}</Text>
      </View>
    </PressableScale>
  );
}
