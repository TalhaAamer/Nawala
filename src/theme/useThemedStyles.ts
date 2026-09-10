import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { Theme } from './tokens';
import { useTheme } from './useTheme';

/**
 * Build a themed StyleSheet that recomputes only when the active scheme changes.
 *
 *   const styles = useThemedStyles((t) => ({
 *     card: { backgroundColor: t.colors.surface, borderRadius: t.radii.lg },
 *   }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const { theme, scheme } = useTheme();
  // `scheme` is the cache key — styles are stable until light/dark flips.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [scheme]);
}
