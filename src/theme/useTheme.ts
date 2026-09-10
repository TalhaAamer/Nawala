import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from './ThemeProvider';

/**
 * Access the active theme + mode controls. Must be used under <ThemeProvider>.
 * Returns: { theme, scheme, mode, setMode, hydrated }.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
