import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';

export type BadgeTone = 'accent' | 'success' | 'neutral';
export type BadgeVariant = 'solid' | 'soft';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

/** Small pill label for "Free delivery", "Promo", "Top rated", etc. (DESIGN-SPEC §5). */
export function Badge({ label, tone = 'accent', variant = 'soft', icon, style }: BadgeProps) {
  const { theme } = useTheme();

  const palette = {
    accent: { solidBg: theme.colors.accent, softBg: theme.colors.accentSoft, solidFg: theme.colors.onAccent, softFg: theme.colors.onAccentSoft },
    success: { solidBg: theme.colors.success, softBg: theme.colors.accentSoft, solidFg: '#FFFFFF', softFg: theme.colors.success },
    neutral: { solidBg: theme.colors.textPrimary, softBg: theme.colors.bgMuted, solidFg: theme.colors.bg, softFg: theme.colors.textSecondary },
  }[tone];

  const bg = variant === 'solid' ? palette.solidBg : palette.softBg;
  const fg = variant === 'solid' ? palette.solidFg : palette.softFg;

  const styles = useThemedStyles((t) => ({
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      alignSelf: 'flex-start' as const,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
      borderRadius: t.radii.sm,
      overflow: 'hidden' as const,
    },
    label: { ...t.typography.chip },
  }));

  return (
    <View style={[styles.base, { backgroundColor: bg }, style]} accessibilityRole="text">
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
