# BUILD-PLAN.md — Crave

Execute in order. **Stop at every checkpoint**, summarize, give the run command, and wait
for "approved" before the next phase. Each phase must leave the app runnable on seed data.

---

## Phase 0 — Environment & scaffolding
**Goal:** a booting Expo Router app with theme + folder structure, on the latest stable stack.
- **Scaffold the Expo app in place at the root of `crave/`, alongside the existing
  `_props/` folder** (don't create a nested app folder). Run `npx create-expo-app .` from
  `crave/`; if it refuses on a non‑empty dir, scaffold into a temp dir, move contents up,
  delete the temp dir — never touching `_props/`. Copy `_props/CLAUDE.md` to `./CLAUDE.md`.
- Confirm Node/npm/Expo versions. **Use web access to look up the current latest stable
  versions**; present a `package | baseline | latest found | will install` table and wait
  for confirmation. Build on the latest.
- Configure `tsconfig` path alias and `app.json` (`newArchEnabled`, `typedRoutes`).
- Create the `src/` + `app/` structure from `CLAUDE.md`.
- Build `src/theme` (colors, spacing, radii, typography) + `ThemeProvider`/`useTheme`/
  `useThemedStyles`, **light default + dark**. Load fonts; wire splash hold.
**Checkpoint:** themed blank screen renders; `npx tsc --noEmit` clean. **Run:** `npx expo start`

## Phase 1 — Design system / component library
**Goal:** every component from `DESIGN-SPEC §5`, viewable in isolation.
- Build `Button`, `Chip`, `CategoryIcon`, `RestaurantCard` (+ wide/small), `MenuItemRow`,
  `SearchPill`, `LocationHeader`, `CartBar`, `QuantityStepper`, `RatingStars`, `Badge`,
  `SectionHeader`, `Sheet`, `Skeleton`, `EmptyState`, `Stepper`, `MapView` (placeholder).
- Use `expo-image` with blurhash. Add a `/_kitchen-sink` route rendering all components in
  light + dark. Wire base Reanimated press interactions.
**Checkpoint:** kitchen‑sink shows all components correctly in both themes. **Run:** open `/_kitchen-sink`

## Phase 2 — Seed data + mock API + stores
**Goal:** the data backbone, testable before any screen.
- Author `src/mocks` (12–18 restaurants, categories, menus with options + images).
- Implement `src/services/api` (typed, simulated latency, optional error flag) and
  `src/services/storage` wrappers.
- Implement Zustand `cart` + `session` stores with persistence.
- Add a tiny temporary debug screen (or kitchen‑sink section) that calls each `api.*` and
  prints results, to prove the layer works.
**Checkpoint:** every `api.*` returns seed data; cart add/remove persists across restart.
**Run:** `npx expo start`

## Phase 3 — Navigation, onboarding & mock auth
**Goal:** full route graph with the mock session gate.
- Root layout: theme + session + cart providers, gesture root, splash control, storage
  restore.
- `(auth)`: onboarding/location intro + mock sign‑in (accepts anything / guest), storing a
  fake session. `(tabs)`: Home, Search, Orders, Account tab bar. Stubs for restaurant/item/
  cart/checkout/order routes.
- Gate checkout/orders behind a session; guest can browse.
**Checkpoint:** can onboard, sign in (or guest), and navigate every tab + auth screen.
**Run:** `npx expo start`

## Phase 4 — Browse & discovery (Home, Search, Restaurant, Item)
**Goal:** the core ordering surfaces, all from the mock API.
- Home: `LocationHeader`, search pill, category row, filter chips, feed sections, pull‑to‑
  refresh, skeletons. Restaurant detail: collapsing hero, info, sticky category strip,
  menu sections. Item modal: options/add‑ons with live price, quantity, add‑to‑cart fly
  animation. Search with debounce + filter sheet.
- Sticky `CartBar` appears when the cart is non‑empty.
**Checkpoint:** browse → restaurant → customize item → add to cart works end‑to‑end with
loading/empty/error states, both themes. **Run:** `npx expo start`

## Phase 5 — Cart, checkout & order tracking
**Goal:** complete the order loop.
- Cart screen (grouped items, stepper, promo, price summary). Checkout (mock address,
  time, **mock payment**, tip, place order via `placeOrder`). Order tracking (map
  placeholder + moving courier, status `Stepper` advancing on a timer, ETA, courier card,
  rate prompt on delivery). Orders tab (active + past, reorder).
**Checkpoint:** place an order, watch it advance through statuses, see it in Orders, reorder
repopulates the cart — all persisted. **Run:** `npx expo start`

## Phase 6 — Polish, QA & release prep
**Goal:** production‑ready demo.
- Empty/error/loading audit; haptics on add‑to‑cart & place‑order; micro‑animation pass.
- Accessibility pass (VoiceOver/TalkBack, contrast, Dynamic Type, reduce‑motion).
- `expo-doctor`, `tsc`, lint all clean; remove debug/kitchen‑sink routes.
- App icon, splash, adaptive icon; optional `eas build --profile preview`.
**Checkpoint:** a clean build installs and the full order flow works offline on seed data.

---

## Cross‑cutting acceptance (every phase)
Light + dark both correct · all data via the mock `api` (no direct JSON/storage reads in
components) · no hardcoded design values · no `@react-navigation/*` imports in app code ·
`npx tsc --noEmit` + `npx expo lint` clean · interactive elements labeled, 44×44 targets,
AA contrast, reduce‑motion honored.

## Suggested commits
`chore: scaffold + theme` → `feat: component library` → `feat: seed data + mock api + stores`
→ `feat: routing + onboarding + mock auth` → `feat: browse (home/search/restaurant/item)`
→ `feat: cart + checkout + order tracking` → `chore: polish + release prep`.

## Later (when you outgrow mock/local)
Swap `src/services/api` for a real client (Supabase/Firebase/REST), replace `MapView` with
`expo-maps`/`react-native-maps`, and turn mock auth into real auth — none of which require
touching the screens, because they only talk to the api layer, the stores, and the theme.
