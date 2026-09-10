---
name: crave-browse
description: Phase 4 of Crave — build the core browsing surfaces by composing components against the mock API. Fills in Home (LocationHeader + SearchPill + categories + filter chips + feed sections + pull-to-refresh + skeletons), Search (debounced query + filter sheet), Restaurant detail (collapsing hero + sticky category strip + menu sections), and Item detail modal (option groups with live price + quantity + add-to-cart fly animation). Sticky CartBar appears whenever cart is non-empty. Use after crave-routing-auth.
---

# crave-browse

Phase 4. The user-visible heart of the app — every screen below renders 100% from the mock API with loading/empty/error states in both themes.

## Preconditions
- Components, theme, mocks, api, stores, routing all in place.
- Hooks `useRestaurants`, `useRestaurant`, `useMenu`, `useSearchRestaurants`, `useCategories` exist (from crave-api-storage).

## Screens

### `app/(tabs)/index.tsx` — Home
Order top-to-bottom:
1. `LocationHeader` — pin + "Deliver to ▾ <currentAddress.label>" + right-side cart icon with badge (count via `useCart`).
2. `SearchPill` — pressing routes to `/(tabs)/search` and autofocuses.
3. Horizontal `FlatList` of `CategoryIcon`s (from `useCategories`). Tapping sets a category filter.
4. Horizontal scroll of filter `Chip`s: DashPass-style, Pickup, Deals, Top rated, Under 30 min, $, $$, $$$, $$$$. Multi-select; visually selected = `accentSoft` bg + `accent` text.
5. Feed sections (each is a memoized component reading `useRestaurants`):
   - **"Fastest near you"** — horizontal `FlatList` of `RestaurantCardWide`.
   - **"Offers for you"** — horizontal `FlatList` of `RestaurantCard` filtered by `badges.includes('Promo')`.
   - **"Popular restaurants"** — vertical list of `RestaurantCard`.
6. `RefreshControl` triggers a refetch of all sections.
7. Loading: `Skeleton` placeholders matching each section's layout.
8. Empty: `EmptyState` with "Try a different filter".

### `app/(tabs)/search.tsx` — Search
- Top `SearchPill` (now an input, autofocuses on entry).
- Debounce 250ms before calling `api.searchRestaurants(q, filters)`.
- Recent searches persisted to AsyncStorage under `crave/recent-searches` (last 8).
- Suggested searches: top 4 cuisines.
- Filter button opens a `Sheet`: sort (rating / ETA / price), cuisine (multi-select chips), max price level, dietary tags. Apply triggers a fresh query.
- Results: vertical list of `RestaurantCard`.
- Empty: "No results for '<q>'".

### `app/restaurant/[id].tsx` — Restaurant detail
1. Full-bleed hero via `expo-image` (16:9), parallax / collapsing on scroll via Reanimated `useAnimatedScrollHandler`.
2. Floating overlay buttons (back, favorite, share) on the hero with translucent backdrop.
3. Info block: `display`-styled name, `RatingStars` with numeric value + count, meta row `ETA · Delivery fee · $$`, "Free delivery over $X" if `freeDeliveryThresholdMinor`.
4. Sticky horizontal category-tab strip — taps scroll the menu to the matching `SectionHeader`. Active tab updates as the user scrolls (use `onViewableItemsChanged` or a measured-offset approach).
5. Menu: `SectionHeader` per section + `MenuItemRow` per item. Tap row → `router.push({ pathname: '/item/[id]', params: { id: item.id, restaurantId } })`.
6. Sticky `CartBar` at the bottom whenever `useCart().items.length > 0` AND the line items match this restaurant (or any restaurant — show count + subtotal + "View cart").
7. Loading: hero skeleton + 3 menu-section skeletons. Error: `EmptyState` with retry.

### `app/item/[id].tsx` — Item modal
Presentation: modal (set in route file).
1. Item photo, name, description, base price.
2. Render `optionGroups` from the menu item:
   - `type: 'radio'` → exclusive selection via styled `Chip` row or labeled radio.
   - `type: 'checkbox'` → multi-select.
   - Each option shows `+ $X.XX` delta when `priceDeltaMinor > 0`.
   - `required: true` groups must have a selection before Add-to-cart enables.
3. "Special instructions" `TextInput` (multiline, 200 char max).
4. `QuantityStepper` (min 1, max 20).
5. Sticky bottom **Add to cart — $<live total>** button:
   - Live total = `(basePrice + sum(selected deltas)) * qty`.
   - On press: if cart belongs to a different restaurant, show a confirm `Sheet` ("Start a new cart? Your current cart will be cleared."). On confirm or same restaurant: build a `CartItem`, push to cart, trigger `useFlyToCart()` from item photo → cart icon, fire `Haptics.selectionAsync()`, then `router.back()`.

## Cross-cutting

### Add-to-cart fly animation
Hook lives in `src/components/animations/useFlyToCart.ts` (from crave-components). Item modal:
- Measures the photo's on-screen rect on mount.
- Reads cart icon target rect from a ref forwarded from `LocationHeader` via a context (`src/components/animations/CartIconTarget.tsx`).
- On add: render a clone of the photo absolutely positioned, animate position + scale (1 → 0.2) + opacity (1 → 0), duration ~600ms with easing. After animation, bump the cart-icon badge (spring scale 1 → 1.3 → 1).

### Loading / empty / error trio
Every screen must show all three states correctly. Toggle `globalThis.__simulateErrors = true` during QA to verify error paths.

## Acceptance
- Home renders cards from `useRestaurants` with skeletons during load.
- Filter chip selections trigger a refetch with `FeedParams`.
- Search debounces and shows results.
- Restaurant detail collapses on scroll; sticky category strip scrolls menu to section.
- Item modal computes live price across option deltas; required groups block add.
- Add-to-cart fly animation runs; cart badge updates; sticky `CartBar` slides in.
- Cart state persists across restart.
- Light + dark both correct; reduce-motion honored.
- `npx tsc --noEmit` and `npx expo lint` clean.

## Hard rules
- No direct `mocks` imports — go through hooks.
- No hardcoded design values — tokens only.
- No `console.log` left in shipped screens.
- Don't refetch on every keystroke — debounce search.
- Switching restaurants in the cart requires explicit confirmation, not silent clobber.
