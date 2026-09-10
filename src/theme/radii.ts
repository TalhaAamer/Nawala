/**
 * Corner radii — DESIGN-SPEC §4. Cards use `lg`; images use `md`; pills use `pill`.
 */
export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export type Radii = typeof radii;
