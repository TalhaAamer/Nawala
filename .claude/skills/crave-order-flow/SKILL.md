---
name: crave-order-flow
description: Phase 5 of Crave — complete the order loop. Builds Cart (grouped items with steppers, promo code, price summary), Checkout (mock address picker, time selector ASAP/schedule, mock payment, tip selector, place-order CTA), Order Tracking (MapView placeholder with animated courier + Stepper advancing on a timer + courier card + delivered rating prompt), and the Orders tab (active + past with reorder). Money math is integer minor units throughout. Use after crave-browse.
---

# crave-order-flow

Phase 5. Take items added to the cart through checkout, into a tracked order, and into history — all persisted, all on the timer-driven mock backend.

## Preconditions
- crave-browse done — cart has items in it.
- `useAuthGate()` available; `orderClock` and `placeOrder` working.

## Screens

### `app/cart.tsx`
- Grouped by `restaurantId` (current single-restaurant cart still groups under one header showing restaurant name + ETA).
- Each line:
  - `expo-image` thumbnail (square 56×56).
  - Name, options summary (e.g. "Large · Extra cheese"), price formatted via `Intl.NumberFormat`.
  - `QuantityStepper` (min 0 → triggers `remove`).
  - Swipe-to-delete (react-native-gesture-handler) as a secondary affordance.
- Promo code input + Apply button (mock validator — accept `CRAVE10` → 10% off subtotal, anything else → inline error). Persist applied promo in cart store.
- Price summary card (use tokens for surface + spacing):
  - Subtotal · Delivery fee · Service fee (10% of subtotal, min $1.99) · Tax (8% of subtotal) · Promo discount (if any) · **Total** in bold price style.
- Sticky **Go to checkout — $<total>** at the bottom.
  - If guest → tapping triggers `useAuthGate()` redirect.
  - Otherwise → `router.push('/checkout')`.
- Empty state: illustration + "Your cart is empty" + "Browse restaurants" CTA → `/(tabs)/index`.

### `app/checkout.tsx`
Wrapped in `useAuthGate()`.

Sections (each a card on `surface`):
1. **Delivery address** — selected `Address` row, "Change" opens a `Sheet` listing seeded addresses with radio selection.
2. **Delivery time** — segmented control: **ASAP** (default; shows ETA range from restaurant) / **Schedule**. Schedule opens a `Sheet` with 15-min increments for the next 6 hours.
3. **Payment** — mock card row: `•••• 4242 · Visa`. "Change" opens a `Sheet` with 2–3 mock cards. **Helper text below: "Demo build — no real payment is processed."**
4. **Tip** — chip row 0% / 10% / 15% / 20% / Custom. Default 15%. Custom opens a numeric input sheet (whole dollars).
5. **Order summary** — same line breakdown as cart, read-only.
6. Sticky bottom **Place order — $<total>** button:
   - Disabled while submitting.
   - On press: build `PlaceOrderInput`, `await api.placeOrder(input)`, on success: `cart.clear()`, fire `Haptics.notificationAsync(Success)`, `router.replace({ pathname: '/order/[id]', params: { id: order.id } })`.
   - On failure: inline error banner + retry.

### `app/order/[id].tsx` — Order tracking
Wrapped in `useAuthGate()`.

1. Top section: `MapView` placeholder (from crave-components) — render a polyline route between restaurant location and address, courier dot interpolating along it based on `(now - statusStartedAt) / statusDuration`.
2. ETA pill overlay on the map: "Arriving in 8–12 min".
3. Status `Stepper` (vertical or horizontal) below the map with five steps:
   - `Confirmed` · `Preparing` · `Picked up` · `On the way` · `Delivered`
   - Subscribe to `orderClock.subscribe(orderId, cb)` so re-renders happen on each transition.
4. Courier card (only after `picked_up`): avatar placeholder, name, vehicle, "Message" + "Call" buttons (disabled, "demo build" tooltip).
5. Order summary (collapsible) — line items + total.
6. **Delivered** state: replace the map with a "Delivered at hh:mm" banner; show a `Sheet` prompting "Rate your order" (5-star tap + optional text); on submit, store rating in `crave/order-ratings` and dismiss.

### `app/(tabs)/orders.tsx`
Wrapped in `useAuthGate()`.

- Two sections:
  - **Active** — orders with status ≠ `delivered`. Tap → `/order/[id]`. Show live status text.
  - **Past** — orders with status = `delivered`, newest first. Tap → `/order/[id]` (shows receipt + reorder).
- Each row: restaurant name, items summary ("3 items"), total formatted, relative time via `date-fns/formatDistanceToNow`.
- Past-order rows have a secondary **Reorder** button:
  - Confirms if current cart non-empty + different restaurant.
  - Repopulates the cart from the order's `items` (qty + options preserved), routes to `/cart`.
- Empty state for past: "Your past orders show up here."

## Money formatting (`src/lib/money.ts`)

```ts
export const formatMinor = (minor: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
```
Use everywhere. Never `.toFixed(2)` manually.

## Acceptance
- Place an order: cart clears, you land on `/order/[id]`, the courier dot moves and status advances through all 5 stages on the timer.
- Closing and reopening the app mid-order resumes at the correct status (orderClock rehydrate works).
- Orders tab shows the order under Active during, then under Past after delivery.
- Reorder repopulates the cart and routes to `/cart`.
- Tip changes update the total live.
- Guest visiting `/checkout` or `/orders` gets bounced to sign-in.
- Light + dark both correct; reduce-motion honored on the courier dot (snap-to-position when reduced).
- `npx tsc --noEmit` and `npx expo lint` clean.

## Hard rules
- All money math in integer minor units. The only float involvement is the final divide-by-100 inside `formatMinor`.
- Never display a real card number or accept one. Payment is always a mock label.
- `placeOrder` is called exactly once per place-order tap — disable the button during the await.
- Cleanup any subscription to `orderClock` on unmount to avoid leaks.
