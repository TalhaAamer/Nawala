/**
 * Color tokens — DESIGN-SPEC §2. Light is the default; dark mirrors it.
 * These are the ONLY place raw color values may appear. Components read them
 * via useTheme(); a literal hex anywhere else is a bug.
 */

export type ColorTokens = {
  bg: string;
  bgMuted: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  /** Readable foreground placed on top of `accent` (e.g. primary button label). */
  onAccent: string;
  /** Readable foreground placed on top of `accentSoft` chips/badges. */
  onAccentSoft: string;
  success: string;
  warning: string;
  border: string;
  overlay: string;
  /** Translucent scrim for overlay buttons floating on hero photography. */
  scrim: string;
};

export const lightColors: ColorTokens = {
  bg: '#FFFFFF',
  bgMuted: '#F5F6F8',
  surface: '#FFFFFF',
  textPrimary: '#15171A',
  textSecondary: '#646A73',
  textTertiary: '#9AA0A6',
  accent: '#FF3008',
  accentPressed: '#D8280B',
  accentSoft: '#FFE9E4',
  onAccent: '#FFFFFF',
  onAccentSoft: '#D8280B',
  success: '#1F9D55',
  warning: '#F0A020',
  border: '#E6E8EB',
  overlay: 'rgba(10,11,13,0.5)',
  scrim: 'rgba(10,11,13,0.45)',
};

export const darkColors: ColorTokens = {
  bg: '#0E0F11',
  bgMuted: '#17191C',
  surface: '#1B1D20',
  textPrimary: '#FFFFFF',
  textSecondary: '#A4AAB2',
  textTertiary: '#6E747C',
  accent: '#FF4A28',
  accentPressed: '#E03A1C',
  accentSoft: '#3A1C16',
  onAccent: '#FFFFFF',
  onAccentSoft: '#FF7E63',
  success: '#1F9D55',
  warning: '#F0A020',
  border: '#272A2E',
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(0,0,0,0.5)',
};

export const colorsByMode = {
  light: lightColors,
  dark: darkColors,
} as const;
