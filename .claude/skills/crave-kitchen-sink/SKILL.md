---
name: crave-kitchen-sink
description: Build the /_kitchen-sink showcase route — a single screen that renders every component from src/components in both light and dark themes for visual audit. Includes a top theme-toggle and an "Exercise mock API" panel that calls each api.* method and prints the result. Used continuously across Phases 1–5 to catch drift; removed in Phase 6 (crave-qa-polish).
---

# crave-kitchen-sink

The internal showcase that proves the component library + mock API both work without needing the real screens. Built alongside crave-components, kept healthy each phase, deleted at release.

## File

`app/_kitchen-sink.tsx` (the leading underscore makes it a hidden route — not reachable from tabs/nav, only by typing the URL or via a debug button in the Account screen during development).

## Sections

### 0. Header
- Theme toggle (System / Light / Dark) wired to `theme.setMode()`.
- "Simulate errors" switch → sets `globalThis.__simulateErrors = true/false`.
- "Reset storage" button → clears `crave/*` keys and `crave-cart` (with confirm).

### 1. Tokens
Render swatches for every color token in both modes (display both side-by-side or per the active mode), spacing rulers, radii samples, every typography style with sample text.

### 2. Components
Render each component from `src/components/index.ts` with at least:
- All variants (`Button`: primary/secondary/ghost + disabled + loading).
- All states (`Chip`: unselected/selected).
- Edge cases (`RestaurantCard` with long restaurant name; `MenuItemRow` with no description; `Skeleton` shimmer in motion).
- `Sheet` triggered by a button.
- `Stepper` showing each of the 5 order statuses.
- `MapView` placeholder with a sample route + a courier animating at `progress = 0.4`.

### 3. Mock API exerciser
A vertical list of buttons, one per `api.*` method:
- `getCategories` · `getRestaurants` · `getRestaurant(<seed id>)` · `getMenu(<seed id>)` · `searchRestaurants("pizza")` · `placeOrder(<sample input>)` · `getOrders` · `getOrder(<latest id>)`

Each button:
- Runs the call.
- Shows a status pill (idle / loading / ok / error).
- On expand, shows the result JSON (pretty-printed, scrollable, truncated to ~80 lines).
- Times the call in ms.

### 4. Animation lab
- Trigger the add-to-cart fly animation between two placeholder rects.
- Toggle `useReducedMotion` simulation via a switch (overrides Reanimated's check for this screen only).
- Force `CartBar` slide-in/out manually.

## Acceptance
- `/_kitchen-sink` opens directly without auth gating (use a top-level route so it bypasses tabs).
- Every component listed in crave-components appears at least once in each theme.
- Every `api.*` call can be exercised and shows a result.
- Toggling appearance live-flips the entire screen.

## Hard rules
- This route is NEVER linked from the user-facing nav. Only reachable by URL during development.
- Must be deleted (or excluded via env check) in crave-qa-polish before the release build.
- Don't put real production logic in this screen — it's a viewer/exerciser only.
