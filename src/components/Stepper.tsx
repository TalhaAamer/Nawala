import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { ORDER_STATUS_SEQUENCE, type OrderStatus } from '@/types';

export type StepperStep = { status: OrderStatus; label: string; sublabel?: string };

export const DEFAULT_ORDER_STEPS: StepperStep[] = [
  { status: 'confirmed', label: 'Order confirmed' },
  { status: 'preparing', label: 'Preparing your food' },
  { status: 'picked_up', label: 'Picked up' },
  { status: 'on_the_way', label: 'On the way' },
  { status: 'delivered', label: 'Delivered' },
];

export type StepperProps = {
  current: OrderStatus;
  steps?: StepperStep[];
};

/** Vertical order-status timeline; fills as status advances (DESIGN-SPEC §5/§8). */
export function Stepper({ current, steps = DEFAULT_ORDER_STEPS }: StepperProps) {
  const { theme } = useTheme();
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current);

  const styles = useThemedStyles((t) => ({
    step: { flexDirection: 'row' as const, gap: t.spacing.md },
    railCol: { alignItems: 'center' as const, width: 28 },
    dot: { width: 28, height: 28, borderRadius: t.radii.pill, alignItems: 'center' as const, justifyContent: 'center' as const },
    dotDone: { backgroundColor: t.colors.accent },
    dotActive: { backgroundColor: t.colors.accent },
    dotPending: { backgroundColor: t.colors.bgMuted, borderWidth: 1, borderColor: t.colors.border },
    connector: { width: 2, flex: 1, marginVertical: 2 },
    label: { ...t.typography.title, color: t.colors.textPrimary },
    labelPending: { ...t.typography.title, color: t.colors.textTertiary },
    sublabel: { ...t.typography.meta, color: t.colors.textSecondary, marginTop: 2 },
    body: { paddingBottom: t.spacing.lg, flex: 1 },
  }));

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ now: currentIndex + 1, min: 1, max: steps.length }}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const pending = i > currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.railCol}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive, pending && styles.dotPending]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color={theme.colors.onAccent} />
                ) : active ? (
                  <Ionicons name="ellipse" size={10} color={theme.colors.onAccent} />
                ) : (
                  <View />
                )}
              </View>
              {!isLast ? (
                <View
                  style={[styles.connector, { backgroundColor: i < currentIndex ? theme.colors.accent : theme.colors.border }]}
                />
              ) : null}
            </View>
            <View style={styles.body}>
              <Text style={pending ? styles.labelPending : styles.label} accessibilityState={{ selected: active }}>
                {step.label}
              </Text>
              {step.sublabel ? <Text style={styles.sublabel}>{step.sublabel}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
