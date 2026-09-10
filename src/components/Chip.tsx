import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional leading Ionicons glyph. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Show a trailing chevron (e.g. filter chips that open a sheet). */
  hasDropdown?: boolean;
  disabled?: boolean;
};

/** Filter / toggle chip — selected = accentSoft bg + accent text (DESIGN-SPEC §5). */
export function Chip({ label, selected = false, onPress, icon, hasDropdown, disabled }: ChipProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      minHeight: 36,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radii.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    selected: {
      backgroundColor: t.colors.accentSoft,
      borderColor: t.colors.accentSoft,
    },
    disabled: { opacity: 0.45 },
    label: { ...t.typography.chip, color: t.colors.textPrimary },
    labelSelected: { ...t.typography.chip, color: t.colors.onAccentSoft },
  }));

  const fg = selected ? theme.colors.onAccentSoft : theme.colors.textSecondary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      style={[styles.base, selected && styles.selected, disabled && styles.disabled]}
    >
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      <Text style={selected ? styles.labelSelected : styles.label}>{label}</Text>
      {hasDropdown ? <Ionicons name="chevron-down" size={14} color={fg} /> : null}
    </PressableScale>
  );
}

/** Non-interactive grouping used by kitchen-sink / rows. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles((t) => ({
    row: { flexDirection: 'row' as const, gap: t.spacing.sm, flexWrap: 'wrap' as const },
  }));
  return <View style={styles.row}>{children}</View>;
}
