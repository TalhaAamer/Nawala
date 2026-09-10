/**
 * ThemeProvider — owns the theme `mode` ('system' | 'light' | 'dark'), persists it,
 * resolves the effective light/dark scheme, and exposes the composed Theme via context.
 *
 * As foundational infrastructure (not a screen/component) this is the one place
 * outside services that may touch AsyncStorage directly.
 */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildTheme, type ColorSchemeName, type Theme, type ThemeMode } from './tokens';

const THEME_MODE_KEY = 'crave-theme';

export type ThemeContextValue = {
  theme: Theme;
  /** The active resolved scheme after applying `mode` + system preference. */
  scheme: ColorSchemeName;
  /** User preference: may be 'system'. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** True once the persisted mode has been read from storage. */
  hydrated: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(mode: ThemeMode, systemScheme: ColorSchemeName): ColorSchemeName {
  return mode === 'system' ? systemScheme : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted preference once on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((stored) => {
        if (active && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setModeState(stored);
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Track OS appearance so 'system' mode flips live.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_MODE_KEY, next);
  }, []);

  const scheme = resolveScheme(mode, systemScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: buildTheme(scheme), scheme, mode, setMode, hydrated }),
    [scheme, mode, setMode, hydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
