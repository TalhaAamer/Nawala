/**
 * Money helpers. All amounts are integer minor units; format only at the edge.
 */
import type { CurrencyCode } from '@/types';

/** 1299 -> "$12.99". The only place minor units are divided by 100. */
export function formatMinor(minor: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
}

/** Compact form that drops the cents on whole-dollar values: 500 -> "$5", 599 -> "$5.99". */
export function formatMinorCompact(minor: number, currency: CurrencyCode = 'USD'): string {
  const whole = minor % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
  }).format(minor / 100);
}

/** "$" | "$$" | "$$$" | "$$$$" for a 1..4 price level. */
export function priceLevelLabel(level: 1 | 2 | 3 | 4): string {
  return '$'.repeat(level);
}

/** "Free" for 0, otherwise the formatted fee. */
export function deliveryFeeLabel(minor: number, currency: CurrencyCode = 'USD'): string {
  return minor === 0 ? 'Free' : formatMinorCompact(minor, currency);
}
