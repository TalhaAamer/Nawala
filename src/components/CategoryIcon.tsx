import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useThemedStyles } from '@/theme';
import type { Category } from '@/types';
import { PressableScale } from './PressableScale';

export type CategoryIconProps = {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
};

/** Round emoji/image tile + label for the home category row (DESIGN-SPEC §5). */
export function CategoryIcon({ category, selected = false, onPress }: CategoryIconProps) {
  const styles = useThemedStyles((t) => ({
    wrap: { alignItems: 'center' as const, gap: t.spacing.xs, width: 68 },
    tile: {
      width: 60,
      height: 60,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.bgMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: selected ? t.colors.accent : 'transparent',
    },
    emoji: { fontSize: 28 },
    image: { width: 60, height: 60, borderRadius: t.radii.pill },
    label: { ...t.typography.meta, color: selected ? t.colors.accent : t.colors.textPrimary, textAlign: 'center' as const },
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={category.name}
      accessibilityState={{ selected }}
      style={styles.wrap}
    >
      <View style={styles.tile}>
        {category.image ? (
          <Image source={category.image} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <Text style={styles.emoji}>{category.emoji ?? '🍽️'}</Text>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {category.name}
      </Text>
    </PressableScale>
  );
}
