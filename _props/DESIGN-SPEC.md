# DESIGN-SPEC.md — Crave

Design language abstracted from Mobbin's Food & Drink category (**DoorDash**, iOS,
285 screens, flows: Onboarding, Home, Store detail, Adding to cart, Placing an order,
Tracking an order). Original tokens, copy, and branding — build a small in‑house
component library to these tokens.

## 1. Design language summary

- **Bright, appetizing, photo‑forward.** Light canvas, lots of food photography, a single
  warm accent for actions and price/CTAs.
- **Fast to scan.** Location + search pinned at top; a row of round category icons; filter
  chips; then a vertical feed of restaurant cards.
- **Cards everywhere.** Rounded cards with image, name, rating, ETA, fee, and a
  membership/deal badge.
- **Always‑there cart.** A sticky bottom cart bar appears the moment something's added.
- **Clear ordering momentum.** Add‑to‑cart fly animation, a prominent CTA, and a
  step‑by‑step order tracker.

## 2. Color tokens (`src/theme/colors.ts`) — light default + dark

### Light (default)
| Token | Value | Use |
|-------|-------|-----|
| `bg` | `#FFFFFF` | app canvas |
| `bgMuted` | `#F5F6F8` | sections, inputs, skeletons |
| `surface` | `#FFFFFF` | cards |
| `textPrimary` | `#15171A` | titles, prices |
| `textSecondary` | `#646A73` | meta (ETA, fee, rating count) |
| `textTertiary` | `#9AA0A6` | hints, disabled |
| `accent` | `#FF3008` | primary CTA, price, active (warm red) |
| `accentPressed` | `#D8280B` | pressed accent |
| `accentSoft` | `#FFE9E4` | accent‑tinted chips/badges |
| `success` | `#1F9D55` | "free delivery", confirmed |
| `warning` | `#F0A020` | rating stars, surge |
| `border` | `#E6E8EB` | hairlines, chip outline |
| `overlay` | `rgba(10,11,13,0.5)` | sheets/modals |

### Dark
| Token | Value |
|-------|-------|
| `bg` | `#0E0F11` |
| `bgMuted` | `#17191C` |
| `surface` | `#1B1D20` |
| `textPrimary` | `#FFFFFF` |
| `textSecondary` | `#A4AAB2` |
| `accent` | `#FF4A28` |
| `border` | `#272A2E` |
| (success/warning same) | |

## 3. Typography (`src/theme/typography.ts`)
Font: **Inter** (or **Plus Jakarta Sans** for a friendlier feel) via `@expo-google-fonts`.

| Style | Size / Line / Weight | Use |
|-------|----------------------|-----|
| `display` | 30 / 36 / 800 | store name on detail hero |
| `titleLg` | 22 / 28 / 700 | section headers ("Fastest near you") |
| `title` | 17 / 22 / 700 | card title, restaurant name |
| `body` | 15 / 21 / 500 | default |
| `meta` | 13 / 18 / 500 | ETA, fee, rating |
| `price` | 15 / 20 / 700 | item price, totals |
| `chip` | 13 / 16 / 600 | filter chips, badges |

## 4. Spacing / radius / elevation
- **Spacing**: 4, 8, 12, 16, 20, 24, 32. Screen horizontal padding = 16.
- **Radii**: `sm 10`, `md 14`, `lg 18`, `xl 24`, `pill 999`. Cards = `lg`; images = `md`.
- **Elevation (light)**: card shadow y2 blur8 `rgba(10,11,13,0.06)`; sticky cart bar
  y‑(-2) blur16 `rgba(10,11,13,0.12)`. Dark mode: use `surface` contrast, minimal shadow.
- **Hit targets** min 44×44.

## 5. Core components (`src/components`)
- **`Button`** — `primary` (accent fill), `secondary` (muted), `ghost`; loading/disabled;
  spring press 0.97.
- **`Chip`** — filter/toggle (DashPass‑style, Pickup, Deals, Under 30 min, $ levels);
  selected = accentSoft bg + accent text.
- **`CategoryIcon`** — round image/emoji tile + label (Deals, Grocery, Pizza, Sushi…).
- **`RestaurantCard`** — `expo-image` hero (16:9) with favorite heart overlay + badge
  (e.g. "Free delivery"), title, rating ★ + count, ETA · fee row. Press → restaurant.
- **`RestaurantCardWide`** / **`RestaurantCardSmall`** — horizontal‑carousel variants.
- **`MenuItemRow`** — left text (name, description, price, popular tag), right square
  photo with a small circular "＋" add button.
- **`SearchPill`** — `bgMuted`, leading search icon, placeholder ("Search Crave").
- **`LocationHeader`** — pin + "Deliver to ▾ <address>", right‑side cart icon w/ badge.
- **`CartBar`** — sticky bottom bar: item count, subtotal, "View cart" CTA; slides up via
  Reanimated when the cart becomes non‑empty.
- **`QuantityStepper`**, **`RatingStars`**, **`Badge`**, **`SectionHeader` + "See all"**,
  **`Sheet`** (bottom sheet), **`Skeleton`**, **`EmptyState`**, **`Stepper`** (order
  status timeline), **`MapView`** (placeholder wrapper — real map drops in later).

## 6. Screens

### 6.1 Splash
Brand mark on `bg`; hold via `SplashScreen.preventAutoHideAsync()` until fonts + session
restore.

### 6.2 Onboarding / location intro `(auth)/welcome`
1–2 friendly slides ("Your favorite food, delivered"), then a "Set your location" CTA
that opens a mock address picker (seeded addresses; no real geolocation required) and a
"Continue as guest" link. Reanimated paging.

### 6.3 Mock sign‑in `(auth)/sign-in`
Email or phone field (accepts anything valid‑looking), primary **Continue**, social
placeholder buttons (disabled, "demo build"), and **Continue as guest**. On continue,
store a fake session in storage and route to the tabs. Inline zod validation.

### 6.4 Home `(tabs)/index`
`LocationHeader` (deliver‑to address + cart icon) · `SearchPill` · horizontal **category
icons** row · **filter chips** row (DashPass‑style, Pickup, Deals, Top rated, Under 30
min, $–$$$) · feed sections: **"Fastest near you"** (horizontal cards), **"Offers for
you"** (badge cards), **"Popular restaurants"** (vertical list). Pull‑to‑refresh;
skeletons while the mock API resolves. Tapping a card → restaurant detail.

### 6.5 Search `(tabs)/search`
Search field + recent/ suggested searches; results as restaurant cards; filter sheet
(sort by rating/ETA/price, cuisine, dietary). Debounced query against `searchRestaurants`.

### 6.6 Restaurant detail `restaurant/[id]`
Full‑bleed **hero image** with back/favorite/share overlay; collapsing header on scroll
(Reanimated). Info block: name, rating ★ + count, ETA · delivery fee · price level,
"Free delivery over $X" note. Sticky **category tab strip** (Most Ordered, Popular,
sections) that scrolls the menu. Menu = `SectionHeader` + `MenuItemRow`s. Sticky
`CartBar` at the bottom once items are added.

### 6.7 Item detail / customize `item/[id]` (modal sheet)
Photo, name, description, price; option groups (size — radio; add‑ons — checkboxes; with
price deltas), special‑instructions field, `QuantityStepper`, and an **Add to cart — $X**
button that reflects live total. Add triggers a fly‑to‑cart animation.

### 6.8 Cart `cart`
Grouped by restaurant; line items with stepper + remove; promo code field; price summary
(subtotal, delivery fee, service fee, taxes, total); **Go to checkout** CTA. Empty state
with a "Browse restaurants" action.

### 6.9 Checkout `checkout`
Delivery address (from mock addresses), delivery time (ASAP / schedule), **mock payment
method** (e.g. "•••• 4242", clearly demo — never collect real card data), tip selector,
order summary, **Place order** → creates an order via `placeOrder` and routes to tracking.

### 6.10 Order tracking `order/[id]`
**Map placeholder** with a moving courier dot (Reanimated along a path), a **status
`Stepper`** (Confirmed → Preparing → Picked up → On the way → Delivered) that advances on
a timer, ETA, courier card (name, vehicle, message/call placeholders), and an order
summary. Delivered state shows a rate‑your‑order prompt.

### 6.11 Orders `(tabs)/orders`
Active orders (with live status) on top; past orders below; tap → tracking/receipt;
"Reorder" action repopulates the cart.

### 6.12 Account `(tabs)/account`
Profile, saved addresses, payment methods (mock), appearance (theme: system/light/dark),
notifications, favorites, sign‑out. Guest sees a "Sign in" prompt.

## 7. Bottom tab bar
4 tabs: **Home**, **Search**, **Orders**, **Account**. Active tint = `accent`, inactive =
`textSecondary`. Cart is reached via the header icon + the sticky `CartBar` (not a tab).

## 8. Motion spec (Reanimated)
- Add‑to‑cart: item image flies to the cart icon; cart badge bumps (spring).
- `CartBar`: slides up/in when cart becomes non‑empty, down/out when emptied.
- Restaurant hero: collapsing/parallax header on scroll.
- Skeletons: shimmer while the mock API resolves.
- Order tracking: courier dot eases along the route; `Stepper` fills as status advances;
  delivered → subtle success scale. All motion respects reduce‑motion.

## 9. Accessibility
Every card/row/button labeled (e.g. "Sushi Place, 4.7 stars, 20 to 30 minutes, $0
delivery fee"). Rating never conveyed by color alone (always show the number). Price and
totals announced. Honor Dynamic Type (cap scaling on the hero name only).
