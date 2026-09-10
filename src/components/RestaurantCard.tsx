import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import type { Restaurant } from '@/types';
import { etaLabel, restaurantA11yLabel } from '@/lib/restaurant';
import { deliveryFeeLabel, priceLevelLabel } from '@/lib/money';
import { PressableScale } from './PressableScale';
import { Badge } from './Badge';
import { RatingStars } from './RatingStars';

export type RestaurantCardProps = {
  restaurant: Restaurant;
  onPress?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

/** Primary vertical restaurant card with 16:9 hero (DESIGN-SPEC §5). */
export function RestaurantCard({ restaurant: r, onPress, favorite, onToggleFavorite }: RestaurantCardProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    card: { borderRadius: t.radii.lg, backgroundColor: t.colors.surface, ...t.elevation.card },
    heroWrap: { borderRadius: t.radii.lg, overflow: 'hidden' as const },
    hero: { width: '100%' as const, aspectRatio: 16 / 9, backgroundColor: t.colors.bgMuted },
    heart: {
      position: 'absolute' as const,
      top: t.spacing.sm,
      right: t.spacing.sm,
      width: 34,
      height: 34,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.scrim,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    badge: { position: 'absolute' as const, top: t.spacing.sm, left: t.spacing.sm },
    body: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, gap: t.spacing.xs },
    titleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: t.spacing.sm },
    title: { ...t.typography.title, color: t.colors.textPrimary, flexShrink: 1 },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: t.spacing.xs, flexWrap: 'wrap' as const },
    meta: { ...t.typography.meta, color: t.colors.textSecondary },
    dot: { ...t.typography.meta, color: t.colors.textTertiary },
  }));

  const primaryBadge = r.badges.includes('Free delivery')
    ? { label: 'Free delivery', tone: 'success' as const }
    : r.badges.includes('Promo') && r.promo
      ? { label: r.promo, tone: 'accent' as const }
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
        {primaryBadge ? (
          <View style={styles.badge}>
            <Badge label={primaryBadge.label} tone={primaryBadge.tone} variant="solid" />
          </View>
        ) : null}
        {onToggleFavorite ? (
          <PressableScale
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={favorite ? `Remove ${r.name} from favorites` : `Add ${r.name} to favorites`}
            accessibilityState={{ selected: favorite }}
            style={styles.heart}
            hitSlop={6}
            noAnimation
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={18}
              color={favorite ? theme.colors.accent : '#FFFFFF'}
            />
          </PressableScale>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {r.name}
          </Text>
          <RatingStars rating={r.rating} count={r.ratingCount} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{etaLabel(r)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{deliveryFeeLabel(r.deliveryFeeMinor, r.currency)} delivery</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{priceLevelLabel(r.priceLevel)}</Text>
        </View>
      </View>
    </PressableScale>
  );
}
