---
name: crave-theme
description: Build Crave's design-token system in src/theme — colors (light default + dark), typography (Inter / Plus Jakarta Sans), spacing scale (4/8/12/16/20/24/32), radii (sm/md/lg/xl/pill), elevation, plus ThemeProvider, useTheme, and useThemedStyles hooks. Use immediately after crave-scaffold (Phase 0 close-out / Phase 1 prereq). Components MUST read every color, spacing, radius, and font size from here — literal hex/numbers in components are bugs.
---

# crave-theme

Phase 0 close-out + Phase 1 prereq. Establish the single source of truth for all design values per `_props/DESIGN-SPEC.md §2–4` before any component is written.

## Files to create

```
src/theme/
  colors.ts        # light + dark palettes
  typography.ts    # font family + text styles
  spacing.ts       # 4/8/12/16/20/24/32 scale
  radii.ts         # sm 10, md 14, lg 18, xl 24, pill 999
  elevation.ts     # card + sticky-cart-bar shadows (light/dark variants)
  tokens.ts        # default export combining all token groups
  ThemeProvider.tsx
  useTheme.ts
  useThemedStyles.ts
  index.ts         # re-exports
```

## Color tokens (`colors.ts`)

Pull exact values from `_props/DESIGN-SPEC.md §2`. Both modes must define every key listed there.

Light:
- `bg #FFFFFF`, `bgMuted #F5F6F8`, `surface #FFFFFF`
- `textPrimary #15171A`, `textSecondary #646A73`, `textTertiary #9AA0A6`
- `accent #FF3008`, `accentPressed #D8280B`, `accentSoft #FFE9E4`
- `success #1F9D55`, `warning #F0A020`, `border #E6E8EB`
- `overlay rgba(10,11,13,0.5)`

Dark:
- `bg #0E0F11`, `bgMuted #17191C`, `surface #1B1D20`
- `textPrimary #FFFFFF`, `textSecondary #A4AAB2`
- `accent #FF4A28`, `border #272A2E`
- success / warning unchanged

## Typography (`typography.ts`)

Font: **Inter** (default) loaded via `@expo-google-fonts/inter`. Expose styles matching DESIGN-SPEC §3:
- `display` 30/36/800 · `titleLg` 22/28/700 · `title` 17/22/700
- `body` 15/21/500 · `meta` 13/18/500 · `price` 15/20/700 · `chip` 13/16/600

Each style returns `{ fontFamily, fontSize, lineHeight, fontWeight }`.

## Spacing / radii / elevation

- `spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }`
- `radii = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 }`
- `elevation.card` (light): `shadowOffset {0,2}`, `shadowRadius 8`, `shadowColor rgba(10,11,13,0.06)`, plus Android `elevation: 2`.
- `elevation.cartBar`: `shadowOffset {0,-2}`, `shadowRadius 16`, `shadowColor rgba(10,11,13,0.12)`.
- Dark elevation: rely on `surface` contrast; minimize shadow.

## ThemeProvider + hooks

```ts
// useTheme(): { mode: 'light'|'dark', colors, typography, spacing, radii, elevation, setMode }
```

- Provider state: `mode` (`'system' | 'light' | 'dark'`), persisted to AsyncStorage under key `crave-theme`.
- Resolves `effectiveMode` from `Appearance.getColorScheme()` when `mode === 'system'`.
- `useThemedStyles(fn)` memoizes a `StyleSheet.create(fn(theme))` across theme changes.
- Restore persisted mode in `app/_layout.tsx` BEFORE `SplashScreen.hideAsync()` so first paint is correct.

## Font loading

In `app/_layout.tsx` use `useFonts` from `@expo-google-fonts/inter`; hold splash until fonts + theme + session restore all resolve.

## Acceptance
- A bare component reading `useTheme()` renders correctly in both modes.
- Toggling system appearance in iOS Simulator / Android emulator flips the app instantly.
- `npx tsc --noEmit` clean.
- No literal color hex / spacing number anywhere outside `src/theme/`.

## Hard rules
- Components NEVER hardcode colors, spacing, radii, font sizes, or shadows. Always resolve from `useTheme()`.
- Don't introduce additional palettes/tokens beyond what DESIGN-SPEC defines without flagging the change.
- Status bar style follows `mode` — use `<StatusBar style={mode === 'dark' ? 'light' : 'dark'} />`.
