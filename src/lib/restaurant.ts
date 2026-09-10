/**
 * Presentation helpers for restaurants — keep meta strings + a11y labels in one
 * place so all card variants read identically.
 */
import type { Restaurant } from '@/types';
import { deliveryFeeLabel, priceLevelLabel } from './money';

/** "20–30 min" */
export function etaLabel(r: Pick<Restaurant, 'etaMin' | 'etaMax'>): string {
  return `${r.etaMin}–${r.etaMax} min`;
}

/** "20 to 30 minutes" — spoken form for screen readers. */
export function etaSpoken(r: Pick<Restaurant, 'etaMin' | 'etaMax'>): string {
  return `${r.etaMin} to ${r.etaMax} minutes`;
}

/** "$0.99 delivery fee" or "Free delivery" */
export function feeSpoken(r: Pick<Restaurant, 'deliveryFeeMinor' | 'currency'>): string {
  return r.deliveryFeeMinor === 0
    ? 'Free delivery'
    : `${deliveryFeeLabel(r.deliveryFeeMinor, r.currency)} delivery fee`;
}

/** Composed accessibility label for a restaurant card (DESIGN-SPEC §9). */
export function restaurantA11yLabel(r: Restaurant): string {
  const parts = [
    r.name,
    `${r.rating.toFixed(1)} stars from ${r.ratingCount.toLocaleString('en-US')} reviews`,
    etaSpoken(r),
    feeSpoken(r),
    priceLevelLabel(r.priceLevel),
    ...r.badges,
  ];
  return parts.join(', ');
}
