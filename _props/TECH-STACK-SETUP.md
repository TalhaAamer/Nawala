# TECH-STACK-SETUP.md — Crave

Toolchain, install commands, and mock‑data + local‑storage wiring. No backend, no keys.

> **Versions here are a BASELINE captured 2026‑06‑08, not a lockfile.** Claude Code has
> web access and **must confirm the current latest stable versions** (Expo SDK, React
> Native, Expo Router, Reanimated, `react-native-worklets`, AsyncStorage/MMKV, Zustand,
> `expo-image`) before installing, then build on whatever is latest. The structure and
> patterns below stay valid; only the numbers move. **Let `npx expo install` pick the
> SDK‑compatible version.**

## 1. Toolchain (verify first)
- **Node** ≥ 20.19 LTS · **npm** ≥ 10
- **Expo SDK** (latest stable — baseline SDK 56 → RN 0.85, React 19.2, Hermes V1, New
  Architecture on by default)
- **Xcode** 16+ / **Android Studio** for device builds
- Expo Go is enough for this whole app (everything is JS + on‑device storage — no native
  backend modules). Only switch to a dev build if you later add a real native map.

## 2. Create the project (in place, alongside `_props/`)
You're already inside `crave/`, which contains `_props/` (the planning docs). Scaffold the
Expo app **at the root of `crave/`**, not in a nested folder:
```bash
# from inside crave/
npx create-expo-app@latest . --template default     # scaffolds in place; keeps _props/
# If it refuses on a non-empty dir, use a temp dir then move up:
#   npx create-expo-app@latest .tmp-app --template default
#   (move .tmp-app/* and .tmp-app/.* into ./, then rm -rf .tmp-app)  — never touch _props/
cp _props/CLAUDE.md ./CLAUDE.md                      # so Claude Code auto-reads it
```
Final layout: `crave/{ _props/, CLAUDE.md, app/, src/, package.json, ... }`.

## 3. Dependencies (install via expo install so versions match the SDK)
```bash
# routing + animation
npx expo install expo-router react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-screens react-native-safe-area-context

# ui / media / system
npx expo install expo-image expo-linear-gradient expo-blur expo-haptics @expo/vector-icons \
  @gorhom/bottom-sheet expo-font @expo-google-fonts/inter expo-splash-screen expo-status-bar

# local persistence (pick ONE; AsyncStorage is simplest, MMKV is faster)
npx expo install @react-native-async-storage/async-storage
#   — or —  npm i react-native-mmkv   (needs a dev build, not Expo Go)

# state + validation + utils
npm i zustand zod date-fns
npm i @tanstack/react-query        # optional, for caching mock API reads (phase 4+)
```

> **No firebase / supabase / axios to a server.** This build is local‑only by design.

## 4. Babel / Metro / TS config
- **`babel-preset-expo` already bundles the Reanimated v4 worklets plugin** — for a
  standard Expo app you usually need NO `babel.config.js`. Only add one (worklets plugin
  **last**, never the old `react-native-reanimated/plugin`) if you hit the "plugin moved
  to react-native-worklets" warning.
- `tsconfig.json`: extend `expo/tsconfig.base`, `strict: true`, `@/* → src/*` path alias.
- `app.json`: `newArchEnabled: true`, `experiments.typedRoutes: true`.

## 5. The mock API layer (`src/services/api/index.ts`) — the one swap point
```ts
import type { Restaurant, RestaurantDetail, MenuSection, Order, PlaceOrderInput } from '@/types';
import { restaurants, menusByRestaurant, categories } from '@/mocks';
import { saveOrder, loadOrders } from '@/services/storage/orders';

const delay = (ms = 400 + Math.random() * 400) => new Promise(r => setTimeout(r, ms));
const maybeFail = () => { if (__DEV__ && (globalThis as any).__simulateErrors) throw new Error('network'); };

export const api = {
  async getCategories() { await delay(); maybeFail(); return categories; },
  async getRestaurants(params?: { sort?: string; cuisine?: string }) {
    await delay(); maybeFail();
    let list = [...restaurants];
    if (params?.cuisine) list = list.filter(r => r.cuisines.includes(params.cuisine));
    if (params?.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (params?.sort === 'eta') list.sort((a, b) => a.etaMin - b.etaMin);
    return list;
  },
  async getRestaurant(id: string): Promise<RestaurantDetail> {
    await delay(); const r = restaurants.find(x => x.id === id);
    if (!r) throw new Error('not found'); return r as RestaurantDetail;
  },
  async getMenu(id: string): Promise<MenuSection[]> { await delay(); return menusByRestaurant[id] ?? []; },
  async searchRestaurants(q: string) {
    await delay(); const t = q.trim().toLowerCase();
    return restaurants.filter(r => r.name.toLowerCase().includes(t) || r.cuisines.some(c => c.includes(t)));
  },
  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    await delay(); const order: Order = { id: `ord_${Date.now()}`, ...input,
      status: 'confirmed', placedAt: Date.now() };
    await saveOrder(order); return order;
  },
  async getOrders(): Promise<Order[]> { await delay(); return loadOrders(); },
  async getOrder(id: string) { const all = await loadOrders(); const o = all.find(x => x.id === id);
    if (!o) throw new Error('not found'); return o; },
};
```
Because every screen calls `api.*` (via hooks), swapping to a real backend later means
re‑implementing this one module — no screen changes.

## 6. Local persistence (`src/services/storage`)
Thin typed wrappers over AsyncStorage (or MMKV): `getJSON<T>(key)`, `setJSON(key, v)`.
Persist: `session` (mock user/guest), `cart` (via Zustand persist), `orders[]`,
`favorites[]`, `addresses[]`, `theme`. Restore on launch in the root layout before
hiding the splash.

## 7. Cart + session stores (`src/store`, Zustand + persist)
```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CartItem = { id: string; restaurantId: string; name: string; priceMinor: number;
  qty: number; options?: Record<string, string[]> };

export const useCart = create<{
  items: CartItem[]; add: (i: CartItem) => void; setQty: (id: string, qty: number) => void;
  remove: (id: string) => void; clear: () => void; subtotalMinor: () => number;
}>()(persist((set, get) => ({
  items: [],
  add: (i) => set(s => ({ items: [...s.items, i] })),
  setQty: (id, qty) => set(s => ({ items: s.items.map(x => x.id === id ? { ...x, qty } : x) })),
  remove: (id) => set(s => ({ items: s.items.filter(x => x.id !== id) })),
  clear: () => set({ items: [] }),
  subtotalMinor: () => get().items.reduce((sum, x) => sum + x.priceMinor * x.qty, 0),
}), { name: 'crave-cart', storage: createJSONStorage(() => AsyncStorage) }));
```

## 8. Seed data (`src/mocks`)
~12–18 restaurants across cuisines, each with rating, ETA range, fee, price level, badges,
a hero image, and 3–5 menu sections of items (name, description, priceMinor, photo,
popular flag, option groups). Categories: Deals, Grocery, Pizza, Sushi, Burgers,
Breakfast, Healthy, Dessert, Coffee. Use royalty‑free food photos via `expo-image`
(document the source, e.g. Unsplash) or solid‑color placeholders with blurhash so the app
works offline. Keep all money as integer minor units + `currency`.

## 9. Map placeholder (`src/components/MapView`)
For order tracking, render a styled static map graphic (or a simple SVG route) with a
Reanimated courier dot moving along a path — **no Maps API key**. Keep the real‑map
interface identical so `react-native-maps` / `expo-maps` can replace it later behind the
same props.

## 10. EAS build (optional — device / store)
```bash
npm i -g eas-cli && eas login && eas build:configure
eas build --profile preview --platform ios     # internal share
eas build --profile production --platform all
```
`eas.json`: `preview` (internal distribution) + `production` profiles. A `development`
profile is only needed if you adopt MMKV or a native map.

## 11. Quality gates
`npx tsc --noEmit` clean · `npx expo lint` clean · `npx expo-doctor` passes · app boots in
Expo Go · cart/session/orders persist across a full app restart.
