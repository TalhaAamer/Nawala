/**
 * Elevation tokens — DESIGN-SPEC §4.
 * Light mode uses soft shadows; dark mode relies on `surface` contrast with
 * minimal shadow. Each token is a ready-to-spread RN ViewStyle shadow group.
 */
import type { ViewStyle } from 'react-native';

export type ElevationToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export type ElevationTokens = {
  none: ElevationToken;
  card: ElevationToken;
  cartBar: ElevationToken;
};

export const lightElevation: ElevationTokens = {
  none: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  card: {
    shadowColor: 'rgba(10,11,13,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cartBar: {
    shadowColor: 'rgba(10,11,13,1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const darkElevation: ElevationTokens = {
  none: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  // Dark mode: contrast comes from `surface`; keep shadows subtle.
  card: {
    shadowColor: 'rgba(0,0,0,1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  cartBar: {
    shadowColor: 'rgba(0,0,0,1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const elevationByMode = {
  light: lightElevation,
  dark: darkElevation,
} as const;
