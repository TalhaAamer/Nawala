import { ActivityIndicator, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading Ionicons glyph name. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional trailing content, e.g. a live price. */
  trailing?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  icon,
  trailing,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.sm,
      borderRadius: t.radii.pill,
      borderWidth: 1,
    },
    md: { minHeight: t.minHitTarget, paddingHorizontal: t.spacing.lg },
    lg: { minHeight: 52, paddingHorizontal: t.spacing.xl },
    primary: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    secondary: { backgroundColor: t.colors.bgMuted, borderColor: t.colors.bgMuted },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    disabled: { opacity: 0.45 },
    labelBase: { ...t.typography.title },
    labelPrimary: { color: t.colors.onAccent },
    labelSecondary: { color: t.colors.textPrimary },
    labelGhost: { color: t.colors.accent },
    trailing: { ...t.typography.title, opacity: 0.92 },
  }));

  const labelColorStyle =
    variant === 'primary'
      ? styles.labelPrimary
      : variant === 'secondary'
        ? styles.labelSecondary
        : styles.labelGhost;
  const fgColor =
    variant === 'primary'
      ? theme.colors.onAccent
      : variant === 'secondary'
        ? theme.colors.textPrimary
        : theme.colors.accent;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        styles[variant],
        (disabled || loading) && styles.disabled,
        fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fgColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fgColor} /> : null}
          <Text style={[styles.labelBase, labelColorStyle]} numberOfLines={1}>
            {label}
          </Text>
          {trailing ? (
            <>
              <View style={{ flex: 1 }} />
              <Text style={[styles.trailing, labelColorStyle]} numberOfLines={1}>
                {trailing}
              </Text>
            </>
          ) : null}
        </>
      )}
    </PressableScale>
  );
}
