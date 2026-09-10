import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Renders a "See all" action when provided. */
  onSeeAll?: () => void;
  seeAllLabel?: string;
};

/** Feed section title with an optional "See all" affordance (DESIGN-SPEC §5). */
export function SectionHeader({ title, subtitle, onSeeAll, seeAllLabel = 'See all' }: SectionHeaderProps) {
  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary, flexShrink: 1 },
    subtitle: { ...t.typography.meta, color: t.colors.textSecondary, marginTop: 2 },
    seeAll: { ...t.typography.chip, color: t.colors.accent },
  }));

  return (
    <View style={styles.row}>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <PressableScale
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`${seeAllLabel}, ${title}`}
          hitSlop={8}
          noAnimation
        >
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
