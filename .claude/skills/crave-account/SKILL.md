---
name: crave-account
description: Phase 5/6 of Crave — build the Account tab (profile, saved addresses, payment methods (mock), appearance picker (system/light/dark), notifications toggles, favorites list, sign-out). Guest mode shows a "Sign in" prompt and disables persistent sections. Use after crave-order-flow.
---

# crave-account

The Account tab — settings, mock identity, and the appearance switch. Small surface but pulls from session, theme, favorites, and addresses stores.

## Preconditions
- Session + theme stores exist; favorites + addresses storage helpers built.

## File

`app/(tabs)/account.tsx`

## Sections (top to bottom)

### 1. Header
- Avatar circle (initials from email/phone, or "G" for guest) + name line ("Guest" or email/phone) + secondary line (member-since for users, "Browsing as guest" for guests).
- For guest: primary **Sign in** button → `/(auth)/sign-in`.

### 2. Saved addresses
- Renders `addresses` from storage (Home / Work / etc.) with selected one marked.
- Tap row → `Sheet` to edit/delete. "Add address" button opens a form sheet (label + line1 + city + state + zip; zod-validated).
- Hidden / disabled for guests.

### 3. Payment methods (mock)
- List of mock cards (e.g. Visa •••• 4242, Mastercard •••• 5555).
- Helper text: "Demo build — payment is not real."
- "Add card" button opens a sheet that only collects last-4 (frontend mock).

### 4. Appearance
- Segmented control: **System** / **Light** / **Dark**. Writes to `theme.setMode()` (persists via theme provider).
- Live-previews instantly.

### 5. Notifications
- Three switches (mock — persisted to `crave/notifications` JSON, no real registration):
  - Order updates
  - Promos & deals
  - New restaurants near me

### 6. Favorites
- Reads `favorites: string[]` (restaurant ids) from storage.
- Horizontal `FlatList` of `RestaurantCardSmall` for each; tap → restaurant detail.
- Empty state: "Heart restaurants to save them here."

### 7. About + Sign out
- App version (from `expo-constants`).
- Links: Terms, Privacy (open `Sheet` with placeholder text — this is a demo).
- **Sign out** button (text variant `accent`): clears session, navigates to `(auth)/welcome`. For guests, show **Sign in** instead.

## Guest behavior
- Sections 2 + 3 + 6 hidden. Section 1 shows the Sign-in CTA. Sections 4, 5, 7 still visible.

## Acceptance
- Toggling appearance flips theme instantly and survives restart.
- Adding/removing favorites in the browse flow updates this screen.
- Sign-out clears session, cart is preserved (user choice — cart belongs to the device, not the identity), and you land on welcome.
- Guest sees the appropriate locked-out experience.
- Light + dark both correct.
- `npx tsc --noEmit` clean.

## Hard rules
- No real card / personal data collection.
- Notifications switches do NOT call `expo-notifications` — purely visual + persisted.
- Sign-out doesn't clear `crave/orders` (history persists across sessions on this device for demo purposes).
