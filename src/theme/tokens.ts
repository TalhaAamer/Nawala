/**
 * Composed theme object. `useTheme()` returns one of these (plus `mode`/`setMode`).
 * This is the shape every component reads design values from.
 */
import { colorsByMode, type ColorTokens } from './colors';
import { typography, type TypographyTokens, fontFamilies } from './typography';
import { spacing, type Spacing, screenPaddingX, minHitTarget } from './spacing';
import { radii, type Radii } from './radii';
import { elevationByMode, type ElevationTokens } from './elevation';

export type ColorSchemeName = 'light' | 'dark';
export type ThemeMode = 'system' | 'light' | 'dark';

export type Theme = {
  scheme: ColorSchemeName;
  colors: ColorTokens;
  typography: TypographyTokens;
  fontFamilies: typeof fontFamilies;
  spacing: Spacing;
  screenPaddingX: number;
  minHitTarget: number;
  radii: Radii;
  elevation: ElevationTokens;
};

export function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: colorsByMode[scheme],
    typography,
    fontFamilies,
    spacing,
    screenPaddingX,
    minHitTarget,
    radii,
    elevation: elevationByMode[scheme],
  };
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
