# CLAUDE.md — Crave project rules

> Persistent context for Claude Code. Keep at the project root (`crave/`).
> Toolchain baseline verified 2026-06-08.

## Project

**Crave** — a DoorDash‑inspired food‑delivery app.
Stack: Expo + React Native + Expo Router + Reanimated + Zustand + on‑device storage
(AsyncStorage/MMKV) · TypeScript (strict). **Mock / local‑only backend** — no servers,
no API keys. **Always use the latest stable versions** (see "Versions & the web").

Design system → `_props/DESIGN-SPEC.md`. Phased plan → `_props/BUILD-PLAN.md`. Versions &
setup → `_props/TECH-STACK-SETUP.md`. **These three are the source of truth.**

## Project location

This file lives at the root of the project directory **`crave/`** (named after the app).
All planning docs/assets live in **`crave/_props/`**. The Expo app is scaffolded **in
place at the root of `crave/`, alongside `_props/`** — not in a nested app folder. Never
delete or overwrite `_props/`; treat it as read‑only reference.

## Versions & the web (you have web access — use it)

- Versions in the docs are a **baseline from 2026‑06‑08** and may be stale. Before
  installing/upgrading, **look up the current latest stable release** (docs.expo.dev,
  expo.dev/changelog, npm).
- Use `npx expo install <pkg>` for Expo‑managed packages; don't hand‑pin past what Expo
  resolves. Run `npx expo-doctor` after dependency changes.
- If an official API/pattern changed since these docs, follow the current docs and note
  the change in your phase summary.

## Golden rules

1. **No hardcoded design values.** Colors, spacing, radii, fonts, shadows come from
   `src/theme`. A literal hex/number in a component is a bug.
2. **No network backend.** All data flows through `src/services/api` (the mock API).
   Components never read JSON or storage directly — they call hooks that call the API.
3. **Everything renders from seed data first** — realistic restaurants, menus, images.
   No `// TODO` screens.
4. **Stop at phase checkpoints.** Summarize, give the run command, wait for approval.
5. **Typed routes only** (`expo-router`; never `@react-navigation/*` in app code).
6. **Accessibility is not optional.** Roles + labels on every interactive element;
   44×44 hit targets; AA contrast; honor reduce‑motion.

## Folder structure

```
app/                      # Expo Router routes (file-based)
  _layout.tsx             # theme + session + cart providers, fonts, splash
  (auth)/                 # mock auth group
    welcome.tsx           # onboarding / location intro
    sign-in.tsx           # accepts any email/phone, or "Continue as guest"
  (tabs)/                 # main app (tab navigator)
    _layout.tsx           # Home, Search, Orders, Account
    index.tsx             # Home (location, search, categories, restaurant feed)
    search.tsx
    orders.tsx
    account.tsx
  restaurant/[id].tsx     # store detail (hero, menu sections)
  item/[id].tsx           # item detail / customization (modal)
  cart.tsx                # cart + mock checkout entry
  checkout.tsx            # address, time, mock payment, place order
  order/[id].tsx          # order tracking (status timeline + map placeholder)
src/
  theme/                  # tokens, ThemeProvider, useTheme, light+dark
  components/             # Button, Chip, RestaurantCard, MenuItemRow, CartBar, ...
  features/               # restaurants, cart, orders, auth modules
  services/
    api/                  # typed MOCK api (async, simulated latency) — swap point
    storage/              # AsyncStorage/MMKV persistence helpers
  store/                  # Zustand stores (cart, session)
  mocks/                  # seed data: restaurants, menus, categories, images
  lib/                    # money/date/eta formatters, validators (zod)
  types/                  # shared TS types
_props/                   # planning docs/assets (this kit) — read-only reference
```

## The mock API contract (`src/services/api`)

Expose typed async functions that *look like* a real client so they can be swapped:

```ts
getCategories(): Promise<Category[]>
getRestaurants(params?: FeedParams): Promise<Restaurant[]>
getRestaurant(id: string): Promise<RestaurantDetail>
getMenu(restaurantId: string): Promise<MenuSection[]>
searchRestaurants(query: string, filters?: Filters): Promise<Restaurant[]>
placeOrder(input: PlaceOrderInput): Promise<Order>     // persists locally
getOrders(): Promise<Order[]>
getOrder(id: string): Promise<Order>
```

Each resolves seed data after a short `await delay(300–800ms)` and can randomly throw to
exercise error states (behind a `__simulateErrors` flag). Order tracking advances through
statuses on a timer (Confirmed → Preparing → Picked up → On the way → Delivered).

## Conventions

- **TypeScript strict**, no `any`. Zod for form input + parsing seed/stored data.
- **State**: Zustand for cart + session (persisted to storage); local state otherwise.
  TanStack Query optional for caching API reads (phase 4+).
- **Money**: integer minor units + currency code; format with `Intl.NumberFormat`.
- **Images**: use `expo-image` with blurhash placeholders; seed with royalty‑free food
  photos (document the source) or solid‑color placeholders if offline.
- **Animations**: Reanimated worklets; honor `useReducedMotion()`.
- **Imports**: absolute via `@/` alias.

## Definition of done (per feature)

Renders in light + dark · works from the mock API with loading/empty/error states ·
cart/session survive an app restart (persistence) · keyboard + screen‑reader navigable ·
`npx tsc --noEmit` and `npx expo lint` clean.

## Commands

`npx expo start` · `npx tsc --noEmit` · `npx expo lint` · `npx expo-doctor` ·
`npx eas build` (device/store — see TECH-STACK-SETUP.md)
