import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { Button } from './Button';

export type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Use the error treatment (accent icon tint). */
  variant?: 'empty' | 'error';
};

/** Reusable empty/error state for lists and screens (DESIGN-SPEC §5). */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  variant = 'empty',
}: EmptyStateProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    wrap: { alignItems: 'center' as const, justifyContent: 'center' as const, gap: t.spacing.md, padding: t.spacing.xl },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.bgMuted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    title: { ...t.typography.titleLg, color: t.colors.textPrimary, textAlign: 'center' as const },
    message: { ...t.typography.body, color: t.colors.textSecondary, textAlign: 'center' as const },
  }));

  const resolvedIcon = icon ?? (variant === 'error' ? 'cloud-offline-outline' : 'fast-food-outline');

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Ionicons
          name={resolvedIcon}
          size={34}
          color={variant === 'error' ? theme.colors.accent : theme.colors.textTertiary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" fullWidth={false} />
      ) : null}
    </View>
  );
}
