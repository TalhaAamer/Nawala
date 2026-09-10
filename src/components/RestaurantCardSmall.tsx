import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useThemedStyles } from '@/theme';
import type { Restaurant } from '@/types';
import { etaLabel, restaurantA11yLabel } from '@/lib/restaurant';
import { PressableScale } from './PressableScale';
import { RatingStars } from './RatingStars';

export type RestaurantCardSmallProps = {
  restaurant: Restaurant;
  onPress?: () => void;
  width?: number;
};

/** Compact square-ish card for "Favorites" / dense carousels — DESIGN-SPEC §5. */
export function RestaurantCardSmall({ restaurant: r, onPress, width = 150 }: RestaurantCardSmallProps) {
  const styles = useThemedStyles((t) => ({
    card: { width, gap: t.spacing.xs },
    hero: { width: '100%' as const, aspectRatio: 1, borderRadius: t.radii.md, backgroundColor: t.colors.bgMuted },
    title: { ...t.typography.body, color: t.colors.textPrimary },
    meta: { ...t.typography.meta, color: t.colors.textSecondary },
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={restaurantA11yLabel(r)}
      style={styles.card}
    >
      <Image
        source={r.heroImage}
        placeholder={{ blurhash: r.blurhash }}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        style={styles.hero}
      />
      <Text style={styles.title} numberOfLines={1}>
        {r.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RatingStars rating={r.rating} showIcon />
        <Text style={styles.meta}>· {etaLabel(r)}</Text>
      </View>
    </PressableScale>
  );
}
