/**
 * Shared domain types — the single source of truth for the data model.
 * Components, the mock API, stores, and screens all import from here.
 * Money is ALWAYS integer minor units (e.g. 1299 = $12.99) + a currency code.
 */

export type CurrencyCode = 'USD';

export type Category = {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
};

export type RestaurantBadge = 'Free delivery' | 'DashPass' | 'Top rated' | 'New' | 'Promo';

export type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];
  rating: number; // 0..5, one decimal
  ratingCount: number;
  etaMin: number; // minutes (low)
  etaMax: number; // minutes (high)
  deliveryFeeMinor: number;
  currency: CurrencyCode;
  priceLevel: 1 | 2 | 3 | 4;
  badges: RestaurantBadge[];
  heroImage: string;
  blurhash: string;
  address: string;
  promo?: string;
  /** Geo point used by the order-tracking map placeholder. */
  location?: { lat: number; lng: number };
};

export type RestaurantDetail = Restaurant & {
  description: string;
  hoursToday: string;
  freeDeliveryThresholdMinor?: number;
};

export type OptionGroup = {
  id: string;
  title: string;
  type: 'radio' | 'checkbox';
  required?: boolean;
  options: { id: string; label: string; priceDeltaMinor: number }[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: CurrencyCode;
  image: string;
  blurhash: string;
  popular?: boolean;
  optionGroups?: OptionGroup[];
};

export type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

// ── Cart & orders ────────────────────────────────────────────────────────────

export type CartItem = {
  id: string; // unique cart line id
  itemId: string; // source menu item id
  restaurantId: string;
  name: string;
  priceMinor: number; // unit price incl. selected option deltas
  qty: number;
  options?: Record<string, string[]>; // groupId -> selected option ids
  optionsSummary?: string; // human-readable, e.g. "Large · Extra cheese"
  notes?: string;
  image?: string;
  blurhash?: string;
};

export type OrderStatus = 'confirmed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered';

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'confirmed',
  'preparing',
  'picked_up',
  'on_the_way',
  'delivered',
];

export type Courier = {
  name: string;
  vehicle: string;
  etaMin: number;
};

export type PlaceOrderInput = {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  addressId: string;
  paymentLabel: string; // mock, e.g. "•••• 4242"
  tipMinor: number;
  subtotalMinor: number;
  feeMinor: number;
  serviceFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: CurrencyCode;
  scheduledFor?: number; // epoch ms; ASAP when undefined
};

export type Order = PlaceOrderInput & {
  id: string;
  status: OrderStatus;
  placedAt: number; // epoch ms
  etaMin: number;
  courier?: Courier;
};

// ── API params ───────────────────────────────────────────────────────────────

export type FeedSort = 'rating' | 'eta' | 'price';

export type FeedParams = {
  sort?: FeedSort;
  cuisine?: string;
};

export type Filters = {
  sort?: FeedSort;
  cuisines?: string[];
  maxPriceLevel?: 1 | 2 | 3 | 4;
};
