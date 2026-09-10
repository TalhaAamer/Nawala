import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';

export type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** When min is 0, reaching 0 shows a trash icon instead of minus. */
  allowRemove?: boolean;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

/** +/- stepper for cart lines and item customization (DESIGN-SPEC §5). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  allowRemove = false,
  size = 'md',
  accessibilityLabel = 'Quantity',
}: QuantityStepperProps) {
  const { theme } = useTheme();
  const dim = size === 'sm' ? 30 : 36;

  const styles = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.bgMuted,
      borderRadius: t.radii.pill,
      padding: 3,
      gap: t.spacing.sm,
    },
    btn: {
      width: dim,
      height: dim,
      borderRadius: t.radii.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: t.colors.surface,
    },
    btnDisabled: { opacity: 0.4 },
    value: { ...t.typography.price, color: t.colors.textPrimary, minWidth: 20, textAlign: 'center' as const },
  }));

  const canDec = value > min || (allowRemove && value > 0);
  const canInc = value < max;
  const decIcon = allowRemove && value <= 1 ? 'trash-outline' : 'remove';

  return (
    <View style={styles.row} accessibilityLabel={`${accessibilityLabel}: ${value}`}>
      <PressableScale
        onPress={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={6}
        style={[styles.btn, !canDec && styles.btnDisabled]}
      >
        <Ionicons name={decIcon} size={18} color={theme.colors.accent} />
      </PressableScale>

      <Text style={styles.value}>{value}</Text>

      <PressableScale
        onPress={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={6}
        style={[styles.btn, !canInc && styles.btnDisabled]}
      >
        <Ionicons name="add" size={18} color={theme.colors.accent} />
      </PressableScale>
    </View>
  );
}
