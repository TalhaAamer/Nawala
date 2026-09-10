---
name: crave-mock-data
description: Phase 2 (part 1) of Crave — author the seed dataset in src/mocks. Produces 12–18 realistic restaurants across cuisines (rating, ETA range, fee, price level, badges, hero image with blurhash) plus 3–5 menu sections per restaurant (items with name, description, priceMinor, photo, popular flag, option groups), plus the categories row (Deals, Grocery, Pizza, Sushi, Burgers, Breakfast, Healthy, Dessert, Coffee). All money as integer minor units + currency. Use after crave-components.
---

# crave-mock-data

Phase 2 part 1. The data backbone the entire app reads through `src/services/api`.

## Files

```
src/mocks/
  categories.ts          # Category[]
  restaurants.ts         # Restaurant[] (12–18 entries)
  menus.ts               # Record<restaurantId, MenuSection[]>
  addresses.ts           # seed delivery addresses for mock auth + checkout
  blurhashes.ts          # mapping of image URLs → blurhash strings
  images.ts              # central image-URL constants (Unsplash etc.)
  index.ts               # re-exports
src/types/
  index.ts               # shared types (mirrored from the API contract)
```

## Types (in `src/types/index.ts`)

```ts
export type Category = { id: string; name: string; emoji?: string; image?: string };

export type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];          // e.g. ['Sushi', 'Japanese']
  rating: number;              // 0..5, one decimal
  ratingCount: number;
  etaMin: number;              // minutes (low)
  etaMax: number;              // minutes (high)
  deliveryFeeMinor: number;    // integer minor units
  currency: 'USD';
  priceLevel: 1 | 2 | 3 | 4;   // $ – $$$$
  badges: ('Free delivery' | 'DashPass' | 'Top rated' | 'New' | 'Promo')[];
  heroImage: string;
  blurhash: string;
  address: string;
  promo?: string;              // e.g. "20% off, up to $5"
};

export type RestaurantDetail = Restaurant & {
  description: string;
  hoursToday: string;
  freeDeliveryThresholdMinor?: number;
};

export type OptionGroup = {
  id: string;
  title: string;             // "Size", "Add-ons"
  type: 'radio' | 'checkbox';
  required?: boolean;
  options: { id: string; label: string; priceDeltaMinor: number }[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: 'USD';
  image: string;
  blurhash: string;
  popular?: boolean;
  optionGroups?: OptionGroup[];
};

export type MenuSection = { id: string; title: string; items: MenuItem[] };

export type Address = { id: string; label: string; line1: string; city: string; state: string; zip: string };
```

(Order / Cart / PlaceOrderInput types live in `crave-api-storage`.)

## Seed-data rules

### Variety
12–18 restaurants spanning **at least**: Pizza, Sushi, Burgers, Breakfast, Healthy/Salads, Dessert, Coffee, Grocery, Tacos/Mexican, Thai, Indian, Mediterranean. Each cuisine appears at least once.

### Realism
- `rating` between 4.1 and 4.9 (one decimal). `ratingCount` 80–5000.
- `etaMin/etaMax` plausible (e.g. 15–25, 20–35, 30–45). Always `etaMin < etaMax`.
- `deliveryFeeMinor` either `0` (paired with `'Free delivery'` badge) or 99/199/299/399.
- `priceLevel` distributed across 1–4.
- 30–40% have a `promo` and a `'Promo'` badge.
- 3–5 carry `'DashPass'`-style and 2–3 `'Top rated'`.

### Menus
- 3–5 sections per restaurant (e.g. Most Ordered, Popular, Starters, Mains, Sides, Drinks, Desserts).
- 4–8 items per section.
- 20–30% of items flagged `popular: true`.
- At least one restaurant has multiple `optionGroups` (size radio + add-ons checkbox) to exercise the Item modal.
- Prices in minor units (e.g. `priceMinor: 1299` for $12.99); use `currency: 'USD'`.

### Images
- Prefer royalty-free Unsplash URLs scoped to food. Document the source in a header comment.
- Every image MUST have a precomputed `blurhash` string in `blurhashes.ts` for offline display.
- If an image fails to load, the blurhash placeholder must remain visible (`expo-image` handles this).
- Acceptable fallback: solid-color placeholders keyed by cuisine if the user wants pure-offline mode.

### Categories
```
[
  { id: 'deals',     name: 'Deals',     emoji: '🏷️' },
  { id: 'grocery',   name: 'Grocery',   emoji: '🛒' },
  { id: 'pizza',     name: 'Pizza',     emoji: '🍕' },
  { id: 'sushi',     name: 'Sushi',     emoji: '🍣' },
  { id: 'burgers',   name: 'Burgers',   emoji: '🍔' },
  { id: 'breakfast', name: 'Breakfast', emoji: '🥞' },
  { id: 'healthy',   name: 'Healthy',   emoji: '🥗' },
  { id: 'dessert',   name: 'Dessert',   emoji: '🍰' },
  { id: 'coffee',    name: 'Coffee',    emoji: '☕' },
]
```

### Addresses
Seed 3 addresses (Home, Work, Friend's place) for the mock onboarding picker + checkout.

## Validation
Use `zod` schemas in `src/lib/schemas.ts` to validate seed data at module load (dev only) so a typo surfaces immediately. Throw early on validation failure.

## Acceptance
- `src/mocks/index.ts` exports `restaurants`, `menusByRestaurant`, `categories`, `addresses`.
- Importing them in a temp script and `console.log`-ing counts shows ≥12 restaurants and every restaurant has a non-empty menu.
- All images have blurhashes; opening the app offline still shows placeholders, not broken icons.
- `npx tsc --noEmit` clean.

## Hard rules
- Money is **always** integer minor units. Never floats. Format only at render via `Intl.NumberFormat`.
- No `Math.random` or `Date.now` in seed module-level code — seed data is deterministic.
- Components NEVER import from `src/mocks` — they go through `src/services/api`.
