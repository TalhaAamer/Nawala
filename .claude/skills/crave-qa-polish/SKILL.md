---
name: crave-qa-polish
description: Phase 6 of Crave — release-ready polish & QA. Sweeps empty/error/loading states across every screen, adds haptics on add-to-cart and place-order, runs an accessibility pass (VoiceOver/TalkBack, AA contrast, Dynamic Type, reduce-motion), enforces tsc + lint + expo-doctor are clean, removes debug routes (/_kitchen-sink), and finalizes app icon + splash + adaptive icon. Optionally produces an EAS preview build. Final phase — run after every other crave-* skill.
---

# crave-qa-polish

Phase 6. Take a working app to a clean, production-quality demo build.

## Pass 1 — State coverage audit
Walk every screen with these toggles to verify all states render correctly:
- Fresh install (no session, empty cart, no orders, no favorites).
- Slow API (`delay()` bumped to 1500–2500ms) — skeletons visible.
- Errors on (`globalThis.__simulateErrors = true`) — error UI everywhere.
- Mid-order resume — kill app during status `preparing`, relaunch, verify resumption.
- Both light + dark for each screen.

For each gap found: add the missing skeleton / empty / error state using `Skeleton` / `EmptyState` from the component library.

## Pass 2 — Haptics
Add `expo-haptics` calls at:
- **Add to cart** (item modal): `Haptics.selectionAsync()` on the fly-animation completion.
- **Place order**: `Haptics.notificationAsync(NotificationFeedbackType.Success)` on success; `Error` on failure.
- **Reorder**: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`.
- **Order delivered transition**: `Haptics.notificationAsync(Success)` when the Stepper hits delivered.

## Pass 3 — Motion polish
- All Reanimated animations honor `useReducedMotion()` (fall back to opacity / instant snaps).
- Spring values consistent across components (use a shared `motion.ts` if drift detected).
- No animation longer than ~700ms.
- No layout shift on theme toggle.

## Pass 4 — Accessibility
- Every interactive node has `accessibilityRole` + `accessibilityLabel`.
- Hit targets ≥ 44×44 (use `hitSlop` to expand visually-small elements).
- AA contrast verified on `textSecondary` over `bg` and `bgMuted` in both modes.
- VoiceOver (iOS Simulator → Accessibility Inspector) + TalkBack walkthrough of the golden flow (browse → add → checkout → track).
- Dynamic Type: scale text up — only the restaurant-hero display name should cap scaling.
- `RatingStars` reads as text (already), not as color-only.
- Order Stepper announces current status.

## Pass 5 — Quality gates
All must be clean:
```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
Plus: cold-start the app in Expo Go, run the full golden flow (browse → add → checkout → track → delivered → reorder), verify all data survives a force-quit + relaunch.

## Pass 6 — Strip debug surfaces
- Delete `app/_kitchen-sink.tsx` (or guard with `if (!__DEV__) return null` and remove the link in Account).
- Remove any `console.log` / `console.debug`.
- Remove `__simulateErrors` toggle UI (the flag itself can stay for dev).
- Remove any TODO comments left behind.

## Pass 7 — Branding & assets
- App icon (`assets/icon.png`, 1024×1024) — Crave wordmark + flame/fork mark in `accent`.
- Splash (`assets/splash.png`) — accent background + centered icon at ~30% width.
- Adaptive icon (`assets/adaptive-icon.png`) — foreground layer + flat `accent` background.
- `app.json`: name "Crave", slug "crave", scheme "crave", `userInterfaceStyle: "automatic"`.

## Pass 8 — Optional EAS preview build
```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform ios
```
Share the internal-distribution link. Do NOT run production builds unless explicitly asked.

## Acceptance
- Every screen renders empty/loading/error correctly in both modes.
- All four quality gates clean (`tsc`, `expo lint`, `expo-doctor`, Expo Go boot).
- Golden flow works end-to-end offline on seed data.
- A11y audit complete; reduce-motion respected.
- `/_kitchen-sink` not reachable from any user-facing surface.
- Final summary handed back: what changed, what to demo, the run command.

## Hard rules
- Don't skip a gate. If `tsc` fails, fix the root cause — don't suppress with `@ts-ignore`.
- Don't remove features to make the build pass. If a check fails, fix the implementation.
- No production EAS submit without explicit user approval.
