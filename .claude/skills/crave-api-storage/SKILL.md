---
name: crave-api-storage
description: Phase 2 (part 2) of Crave — build the typed mock API layer (src/services/api), the AsyncStorage persistence wrappers (src/services/storage), and the Zustand cart + session stores with persist middleware. The api module is the SINGLE swap point for a real backend later — every screen reads through it via hooks. Includes the timer-driven order-status advance (Confirmed → Preparing → Picked up → On the way → Delivered). Use after crave-mock-data.
---

# crave-api-storage

Phase 2 part 2. Wire the mock API, on-device storage, and global stores so Phase 3+ screens have a real data backbone to render from.

## Files

```
src/services/
  api/
    index.ts             # typed mock client (the swap point)
    delay.ts             # delay() + __simulateErrors flag
    orderClock.ts        # advances order status on a timer
  storage/
    kv.ts                # getJSON<T>/setJSON/removeJSON over AsyncStorage
    orders.ts            # saveOrder, loadOrders, updateOrderStatus
    session.ts           # saveSession, loadSession, clearSession
    favorites.ts
    addresses.ts
src/store/
  cart.ts                # Zustand + persist
  session.ts             # Zustand + persist
src/hooks/
  useApi.ts              # thin wrappers per endpoint (or TanStack Query layer)
src/types/
  index.ts               # add Order / Cart / PlaceOrderInput types
```

## Types to add (`src/types/index.ts`)

```ts
export type OrderStatus = 'confirmed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered';

export type CartItem = {
  id: string;                       // line id (uuid)
  itemId: string;                   // menu item id
  restaurantId: string;
  name: string;
  priceMinor: number;
  qty: number;
  options?: Record<string, string[]>;
  notes?: string;
};

export type PlaceOrderInput = {
  restaurantId: string;
  items: CartItem[];
  addressId: string;
  paymentLabel: string;             // e.g. "•••• 4242"
  tipMinor: number;
  subtotalMinor: number;
  feeMinor: number;
  taxMinor: number;
  totalMinor: number;
  scheduledFor?: number;            // epoch ms (ASAP if undefined)
};

export type Order = PlaceOrderInput & {
  id: string;
  status: OrderStatus;
  placedAt: number;
  etaMin: number;
  courier?: { name: string; vehicle: string; eta: number };
};

export type FeedParams = { sort?: 'rating' | 'eta' | 'price'; cuisine?: string };
export type Filters = { sort?: FeedParams['sort']; cuisine?: string; maxPrice?: 1|2|3|4 };
```

## Mock API contract (`src/services/api/index.ts`)

```ts
async getCategories(): Promise<Category[]>
async getRestaurants(params?: FeedParams): Promise<Restaurant[]>
async getRestaurant(id: string): Promise<RestaurantDetail>
async getMenu(restaurantId: string): Promise<MenuSection[]>
async searchRestaurants(q: string, filters?: Filters): Promise<Restaurant[]>
async placeOrder(input: PlaceOrderInput): Promise<Order>
async getOrders(): Promise<Order[]>
async getOrder(id: string): Promise<Order>
```

Behavior:
- Every call `await delay(300–800ms)`.
- `delay()` lives in `delay.ts` and reads from `(globalThis as any).__simulateErrors` to optionally throw `new Error('network')` ~20% of the time when the flag is on (lets us exercise error states).
- `placeOrder` writes to storage AND kicks off `orderClock` for that order id.
- `getOrders` / `getOrder` read from storage, not the seed file.

## Order clock (`orderClock.ts`)

Advance status on a timer per order. Default schedule (compressed for demo realism):
- `confirmed` → `preparing` after 8s
- `preparing` → `picked_up` after 12s
- `picked_up` → `on_the_way` after 6s
- `on_the_way` → `delivered` after 18s

Persist each transition to storage. Expose `subscribe(orderId, cb)` for the tracking screen so it re-renders without polling. Restore in-flight orders on app launch — if `now - placedAt` exceeds total schedule, fast-forward to `delivered`.

## Storage wrappers (`storage/kv.ts`)

```ts
export async function getJSON<T>(key: string, fallback: T): Promise<T>
export async function setJSON<T>(key: string, value: T): Promise<void>
export async function removeJSON(key: string): Promise<void>
```

Keys are namespaced under `crave/*` (e.g. `crave/orders`, `crave/session`, `crave/favorites`, `crave/addresses`). The Zustand cart store uses its own key `crave-cart` via `createJSONStorage`.

## Stores

### `src/store/cart.ts`
Zustand + `persist` middleware backed by AsyncStorage. Shape:
```ts
{
  items: CartItem[];
  restaurantId: string | null;    // single-restaurant cart; switching clears
  add(item: CartItem): void;
  setQty(lineId: string, qty: number): void;
  remove(lineId: string): void;
  clear(): void;
  subtotalMinor(): number;
}
```
- Adding from a different restaurant: prompt confirm (the screen handles the prompt; the store exposes `canAdd(restaurantId)` to check).
- Persist key: `crave-cart`.

### `src/store/session.ts`
```ts
{
  user: { kind: 'guest' } | { kind: 'user'; id: string; email?: string; phone?: string } | null;
  selectedAddressId: string | null;
  signIn(payload): void;
  continueAsGuest(): void;
  signOut(): void;
  setAddress(id: string): void;
}
```
Persist key: `crave/session`.

## Hooks (`src/hooks/useApi.ts`)
Either thin manual wrappers `useRestaurants()`, `useRestaurant(id)`, etc., each managing `{ data, loading, error }`, **or** TanStack Query (optional from Phase 4). If using Query, cache keys mirror endpoint names.

**Screens import these hooks, never the api object directly** — keeps the swap layer clean.

## Acceptance
- Each `api.*` returns seed data after 300–800ms.
- Cart add/remove survives a full app restart.
- Placed order shows in `getOrders()` and its status advances through all five states on the timer.
- `__simulateErrors = true` causes screens to render their error states.
- `npx tsc --noEmit` clean.

## Hard rules
- The `api` module is the **only** place that imports from `src/mocks` (besides validation/tests).
- Screens NEVER call `AsyncStorage` directly — they go through stores or `services/storage`.
- All money stays integer minor units end to end. Format only at render.
- Order-clock timers must clear on `clear()` / sign-out so a fresh user starts clean.
