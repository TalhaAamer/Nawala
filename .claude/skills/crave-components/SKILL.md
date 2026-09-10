---
name: crave-components
description: Phase 1 of Crave — build the entire in-house component library in src/components per DESIGN-SPEC §5 (Button, Chip, CategoryIcon, RestaurantCard + wide/small, MenuItemRow, SearchPill, LocationHeader, CartBar, QuantityStepper, RatingStars, Badge, SectionHeader, Sheet, Skeleton, EmptyState, Stepper, MapView placeholder) plus the cross-cutting Reanimated motion patterns (press spring 0.97, cart fly, skeleton shimmer, sticky CartBar slide). Every component reads tokens from useTheme — no hardcoded design values. Use after crave-theme.
---

# crave-components

Phase 1 of the Crave build. Build every component listed in `_props/DESIGN-SPEC.md §5` so that screens (Phases 3–5) only compose, never style from raw values.

## Preconditions
- `src/theme` exists with tokens + `useTheme` (crave-theme).
- `expo-image`, `react-native-reanimated`, `react-native-worklets`, `expo-haptics`, `@gorhom/bottom-sheet`, `@expo/vector-icons` are installed.

## Files

```
src/components/
  Button.tsx            # primary | secondary | ghost; loading; disabled; press spring
  Chip.tsx              # filter/toggle; selected = accentSoft bg + accent text
  CategoryIcon.tsx      # round image/emoji tile + label
  RestaurantCard.tsx    # 16:9 hero, favorite heart, badge, title, rating, meta row
  RestaurantCardWide.tsx
  RestaurantCardSmall.tsx
  MenuItemRow.tsx       # text left + square photo right with circular + button
  SearchPill.tsx        # bgMuted, leading search icon
  LocationHeader.tsx    # pin + "Deliver to ▾ <address>" + cart icon w/ badge
  CartBar.tsx           # sticky bottom bar; slides in via Reanimated when non-empty
  QuantityStepper.tsx
  RatingStars.tsx       # always shows numeric rating too (a11y)
  Badge.tsx             # solid + soft variants
  SectionHeader.tsx     # title + optional "See all"
  Sheet.tsx             # wraps @gorhom/bottom-sheet with theme-aware defaults
  Skeleton.tsx          # Reanimated shimmer
  EmptyState.tsx
  Stepper.tsx           # vertical order-status timeline
  MapView.tsx           # PLACEHOLDER — same prop shape as a real map for future swap
  index.ts              # barrel export
```

## Implementation rules

### Tokens only
Every color, padding, font size, radius, shadow comes from `useTheme()`. A literal hex/number in any component is a bug. Numeric layout (flex, percentages, image aspect ratios) is fine.

### Press interactions
- All pressable elements use a Reanimated `useSharedValue` scale animated to 0.97 on `onPressIn`, back to 1 on `onPressOut` with spring `{ damping: 18, stiffness: 220 }`.
- Min hit target 44×44 — pad with `hitSlop` if visual size is smaller.
- Honor `useReducedMotion()` from Reanimated — fall back to opacity flicker.

### Images
- `expo-image` with `placeholder={{ blurhash }}` and `contentFit="cover"`.
- Restaurant hero aspect ratio 16:9 (`aspectRatio: 16/9`).
- Menu item thumbnail square (`aspectRatio: 1`).

### CartBar animation
- Translates from `+80` to `0` on Y when `useCart().items.length` transitions from 0 → >0.
- Uses `withSpring`. Hidden state must not intercept touches (`pointerEvents="none"`).

### Skeleton shimmer
- Animated gradient sweep via `interpolateColor` between `bgMuted` and a slightly lighter tone, looping `withRepeat`.
- Pause animation when `useReducedMotion()` is true.

### Add-to-cart fly animation (helper, not its own component)
Expose a hook `useFlyToCart()` in `src/components/animations/useFlyToCart.ts` that:
- Accepts a source view ref + target ref (cart icon in `LocationHeader`).
- Renders a portal-style absolute image that interpolates X/Y + scale + opacity.
- Triggers a haptic `selection` impact at completion. Screens (Item modal) call it.

### MapView placeholder contract
```ts
type MapViewProps = {
  route: { lat: number; lng: number }[];   // polyline points
  courier?: { progress: number };          // 0..1 along route
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
};
```
Render a styled rectangle with an SVG polyline and an animated dot at `progress * length`. **Real `react-native-maps` / `expo-maps` must drop in behind the same prop shape later.**

### Accessibility
- `accessibilityRole` set for every interactive element (`button`, `link`, `image`, `header`).
- `accessibilityLabel` composed from human-readable parts. Restaurant card example:
  `"Sushi Place, 4.7 stars from 1,200 reviews, 20 to 30 minutes, $0 delivery fee, Free delivery"`.
- `RatingStars` always renders the numeric value as text — never color-only.

## Acceptance
- All components listed above exist and export from `src/components/index.ts`.
- Each renders correctly in light + dark mode using only theme tokens.
- `npx tsc --noEmit` clean; `npx expo lint` clean.
- Reduce-motion honored in every animation.

## Hard rules
- No third-party UI kit (MUI, NativeBase, Tamagui, gluestack, etc.). Build to the spec.
- Never import from `@react-navigation/*` directly; use `expo-router` primitives if any nav is needed.
- Don't ship a component without its accessibility props.
- After this skill completes, the next step is `crave-kitchen-sink` to visually audit everything.
