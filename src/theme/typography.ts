/**
 * Typography tokens — DESIGN-SPEC §3. Font: Inter (via @expo-google-fonts/inter).
 *
 * Each style names a concrete Inter family file so weight is carried by the font
 * itself (avoids synthetic bolding on Android). The numeric `fontWeight` is kept
 * for semantic clarity and web fallback.
 */
import type { TextStyle } from 'react-native';

/** Family keys map 1:1 to the @expo-google-fonts/inter exports loaded in _layout. */
export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type TextStyleToken = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight'
>;

export type TypographyTokens = {
  display: TextStyleToken;
  titleLg: TextStyleToken;
  title: TextStyleToken;
  body: TextStyleToken;
  meta: TextStyleToken;
  price: TextStyleToken;
  chip: TextStyleToken;
};

export const typography: TypographyTokens = {
  display: { fontFamily: fontFamilies.extrabold, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  titleLg: { fontFamily: fontFamilies.bold, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontFamily: fontFamilies.bold, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontFamily: fontFamilies.medium, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  meta: { fontFamily: fontFamilies.medium, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  price: { fontFamily: fontFamilies.bold, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  chip: { fontFamily: fontFamilies.semibold, fontSize: 13, lineHeight: 16, fontWeight: '600' },
};
