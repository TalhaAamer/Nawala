/**
 * Spacing scale — DESIGN-SPEC §4. Screen horizontal padding = `lg` (16).
 * Named keys avoid magic numbers in components.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type Spacing = typeof spacing;

/** Standard screen horizontal padding. */
export const screenPaddingX = spacing.lg;

/** Minimum interactive hit target (a11y) — DESIGN-SPEC §4. */
export const minHitTarget = 44;
