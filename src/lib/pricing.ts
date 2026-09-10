/**
 * Order pricing — all integer minor units. The single source of truth for the
 * cart, checkout, and order summaries so totals always agree.
 */
export const SERVICE_FEE_RATE = 0.1; // 10% of subtotal
export const SERVICE_FEE_MIN_MINOR = 199; // $1.99 floor
export const TAX_RATE = 0.08; // 8% of subtotal

export type PromoCode = 'CRAVE10';
const PROMOS: Record<string, { kind: 'percent'; value: number; label: string }> = {
  CRAVE10: { kind: 'percent', value: 10, label: '10% off your order' },
};

export function validatePromo(code: string): { ok: boolean; label?: string } {
  const promo = PROMOS[code.trim().toUpperCase()];
  return promo ? { ok: true, label: promo.label } : { ok: false };
}

export function discountMinorFor(code: string | null | undefined, subtotalMinor: number): number {
  if (!code) return 0;
  const promo = PROMOS[code.trim().toUpperCase()];
  if (!promo) return 0;
  return Math.round(subtotalMinor * (promo.value / 100));
}

export type PricingInput = {
  subtotalMinor: number;
  baseDeliveryFeeMinor: number;
  freeDeliveryThresholdMinor?: number;
  promoCode?: string | null;
  tipMinor?: number;
};

export type Pricing = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  serviceFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  tipMinor: number;
  totalMinor: number;
  freeDeliveryApplied: boolean;
};

export function computePricing(input: PricingInput): Pricing {
  const { subtotalMinor, baseDeliveryFeeMinor, freeDeliveryThresholdMinor, promoCode, tipMinor = 0 } = input;

  const freeDeliveryApplied =
    freeDeliveryThresholdMinor != null &&
    freeDeliveryThresholdMinor > 0 &&
    subtotalMinor >= freeDeliveryThresholdMinor;
  const deliveryFeeMinor = freeDeliveryApplied ? 0 : baseDeliveryFeeMinor;

  const serviceFeeMinor =
    subtotalMinor === 0 ? 0 : Math.max(Math.round(subtotalMinor * SERVICE_FEE_RATE), SERVICE_FEE_MIN_MINOR);
  const taxMinor = Math.round(subtotalMinor * TAX_RATE);
  const discountMinor = discountMinorFor(promoCode, subtotalMinor);

  const totalMinor = Math.max(
    0,
    subtotalMinor + deliveryFeeMinor + serviceFeeMinor + taxMinor + tipMinor - discountMinor,
  );

  return {
    subtotalMinor,
    deliveryFeeMinor,
    serviceFeeMinor,
    taxMinor,
    discountMinor,
    tipMinor,
    totalMinor,
    freeDeliveryApplied,
  };
}
