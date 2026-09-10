/**
 * Shared motion constants so springs/timings stay consistent across components.
 * DESIGN-SPEC §8.
 */
export const PRESS_SPRING = { damping: 18, stiffness: 220, mass: 0.6 } as const;
export const PRESS_SCALE = 0.97;

export const ENTER_SPRING = { damping: 20, stiffness: 180, mass: 0.8 } as const;

export const SHIMMER_DURATION_MS = 1100;
export const FLY_DURATION_MS = 600;
export const BADGE_BUMP_SPRING = { damping: 8, stiffness: 260 } as const;
