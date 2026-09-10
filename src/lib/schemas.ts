/**
 * Zod schemas for runtime validation of seed + stored data. Used in dev to
 * surface typos at module load, and to safely parse persisted JSON on launch.
 */
import { z } from 'zod';

export const currencySchema = z.literal('USD');

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().optional(),
  image: z.string().optional(),
});

export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisines: z.array(z.string()).min(1),
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  etaMin: z.number().int().positive(),
  etaMax: z.number().int().positive(),
  deliveryFeeMinor: z.number().int().nonnegative(),
  currency: currencySchema,
  priceLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  badges: z.array(z.enum(['Free delivery', 'DashPass', 'Top rated', 'New', 'Promo'])),
  heroImage: z.string(),
  blurhash: z.string(),
  address: z.string(),
  promo: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export const restaurantDetailSchema = restaurantSchema.extend({
  description: z.string(),
  hoursToday: z.string(),
  freeDeliveryThresholdMinor: z.number().int().nonnegative().optional(),
});

export const optionGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['radio', 'checkbox']),
  required: z.boolean().optional(),
  options: z
    .array(z.object({ id: z.string(), label: z.string(), priceDeltaMinor: z.number().int() }))
    .min(1),
});

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceMinor: z.number().int().positive(),
  currency: currencySchema,
  image: z.string(),
  blurhash: z.string(),
  popular: z.boolean().optional(),
  optionGroups: z.array(optionGroupSchema).optional(),
});

export const menuSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(menuItemSchema).min(1),
});

export const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

export const orderStatusSchema = z.enum([
  'confirmed',
  'preparing',
  'picked_up',
  'on_the_way',
  'delivered',
]);

export const cartItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  priceMinor: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
  options: z.record(z.string(), z.array(z.string())).optional(),
  optionsSummary: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
  blurhash: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  restaurantName: z.string(),
  items: z.array(cartItemSchema),
  addressId: z.string(),
  paymentLabel: z.string(),
  tipMinor: z.number().int().nonnegative(),
  subtotalMinor: z.number().int().nonnegative(),
  feeMinor: z.number().int().nonnegative(),
  serviceFeeMinor: z.number().int().nonnegative(),
  taxMinor: z.number().int().nonnegative(),
  discountMinor: z.number().int().nonnegative(),
  totalMinor: z.number().int().nonnegative(),
  currency: currencySchema,
  scheduledFor: z.number().optional(),
  status: orderStatusSchema,
  placedAt: z.number(),
  etaMin: z.number().int().nonnegative(),
  courier: z.object({ name: z.string(), vehicle: z.string(), etaMin: z.number().int() }).optional(),
});

export const ordersArraySchema = z.array(orderSchema);
