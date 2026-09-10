import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemedStyles } from '@/theme';
import { PressableScale } from './PressableScale';

type CommonProps = {
  placeholder?: string;
};

/** Static (button) variant — taps route to the Search screen. */
export function SearchPillButton({
  placeholder = 'Search Crave',
  onPress,
}: CommonProps & { onPress?: () => void }) {
  const { theme } = useTheme();
  const styles = usePillStyles();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      style={styles.pill}
    >
      <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
      <Text style={styles.placeholder}>{placeholder}</Text>
    </PressableScale>
  );
}

/** Interactive input variant — used on the Search screen. */
export const SearchPillInput = forwardRef<TextInput, CommonProps & TextInputProps>(
  function SearchPillInput({ placeholder = 'Search Crave', value, onChangeText, ...rest }, ref) {
    const { theme } = useTheme();
    const styles = usePillStyles();
    return (
      <View style={styles.pill}>
        <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={placeholder}
          {...rest}
        />
        {value ? (
          <PressableScale
            onPress={() => onChangeText?.('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            noAnimation
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </PressableScale>
        ) : null}
      </View>
    );
  },
);

function usePillStyles() {
  return useThemedStyles((t) => ({
    pill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      minHeight: t.minHitTarget,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radii.pill,
      backgroundColor: t.colors.bgMuted,
    },
    placeholder: { ...t.typography.body, color: t.colors.textSecondary, flex: 1 },
    input: { ...t.typography.body, color: t.colors.textPrimary, flex: 1, paddingVertical: 0 },
  }));
}
