---
name: crave-routing-auth
description: Phase 3 of Crave — wire the full Expo Router graph (root layout with providers + splash control + storage restore, (auth) group with welcome + sign-in, (tabs) group with Home/Search/Orders/Account, plus restaurant/[id], item/[id] modal, cart, checkout, order/[id] routes) AND build the mock authentication flow (accepts any email/phone OR Continue as guest, persisted via session store, gating checkout/orders). Use after crave-api-storage.
---

# crave-routing-auth

Phase 3 of the Crave build. Full route graph + mock session gate so Phase 4+ screens have a navigable shell to drop into.

## Preconditions
- Theme, components, mocks, api, stores all complete.
- `expo-router` installed; `app.json` has `experiments.typedRoutes: true`.

## Files

```
app/
  _layout.tsx                 # providers + fonts + splash hold + storage restore
  +not-found.tsx
  (auth)/
    _layout.tsx               # Stack, headerShown false
    welcome.tsx               # onboarding + location intro (paged)
    sign-in.tsx               # email/phone field + guest
  (tabs)/
    _layout.tsx               # Tabs: Home, Search, Orders, Account
    index.tsx                 # Home (stub now, filled in crave-browse)
    search.tsx                # stub
    orders.tsx                # stub
    account.tsx               # stub
  restaurant/[id].tsx         # stub
  item/[id].tsx               # presentation: 'modal'
  cart.tsx                    # stub
  checkout.tsx                # stub
  order/[id].tsx              # stub
src/features/auth/
  validators.ts               # zod: email OR phone (loose mock check)
  useAuthGate.ts              # redirects if no session + route requires auth
```

## Root layout (`app/_layout.tsx`)

Responsibilities, in order:
1. `SplashScreen.preventAutoHideAsync()` (top-level).
2. `useFonts` Inter weights 400/500/600/700/800.
3. Mount `<ThemeProvider>`, `<GestureHandlerRootView style={{ flex: 1 }}>`, `<BottomSheetModalProvider>`.
4. On mount, run a single async restore: theme mode, session, cart (already auto-via Zustand persist), in-flight orders → rehydrate the order clock for each.
5. Once fonts AND restore both resolved → `SplashScreen.hideAsync()`.
6. Render `<Stack>` with `(auth)`, `(tabs)`, modal routes.
7. `<StatusBar style={mode === 'dark' ? 'light' : 'dark'} />`.

## Tab bar (`app/(tabs)/_layout.tsx`)

```ts
<Tabs screenOptions={{
  tabBarActiveTintColor: theme.colors.accent,
  tabBarInactiveTintColor: theme.colors.textSecondary,
  tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
  headerShown: false,
}}>
  <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ... }} />
  <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ... }} />
  <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ... }} />
  <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ... }} />
</Tabs>
```
Cart is NOT a tab — it's reached via the header cart icon and the sticky `CartBar`.

## Auth group

### `(auth)/welcome.tsx`
1–2 paged slides (Reanimated, `useReducedMotion` → fade fallback). Last slide CTA: **"Set your location"** opens a `Sheet` with seeded addresses (`src/mocks/addresses.ts`); on pick, call `session.setAddress(id)` and `router.replace('/(auth)/sign-in')`. Secondary link: **"Continue as guest"** → `session.continueAsGuest()` + `router.replace('/(tabs)')`.

### `(auth)/sign-in.tsx`
- Single input that accepts an email OR phone — `zod` schema:
  ```ts
  z.union([z.string().email(), z.string().regex(/^\+?[\d\s\-()]{7,}$/)])
  ```
- Inline validation only after first blur.
- Primary button **Continue** → `session.signIn({ id: <uuid>, email/phone })` → `router.replace('/(tabs)')`.
- Social placeholders rendered but `disabled` with helper text "demo build".
- Footer link **Continue as guest**.

## Session gate (`src/features/auth/useAuthGate.ts`)

A small hook used by `checkout.tsx`, `order/[id].tsx`, and the Orders tab:
```ts
export function useAuthGate() {
  const { user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!user || user.kind === 'guest') {
      router.replace({ pathname: '/(auth)/sign-in', params: { reason: 'checkout' } });
    }
  }, [user]);
}
```
Guests CAN browse Home, Search, Restaurant detail, Item modal, and the cart screen — but pressing **Go to checkout** prompts sign-in.

## Item modal route

`app/item/[id].tsx`:
```ts
export const unstable_settings = { presentation: 'modal' };
```
Item screen itself is built in `crave-browse`.

## Acceptance
- Cold launch shows splash until fonts + theme + session + orders restored, then routes to:
  - `(auth)/welcome` if no session.
  - `(tabs)/index` if session (user or guest) exists.
- All four tabs reachable; all stub routes resolve without crashing.
- Mock sign-in with anything email-shaped or phone-shaped succeeds; guest path works.
- Visiting `/checkout` or `/orders` as a guest redirects to sign-in.
- `npx tsc --noEmit` clean.

## Hard rules
- **Never import from `@react-navigation/*`** in app code — use `expo-router` (`useRouter`, `<Link>`, `<Stack>`, `<Tabs>`, `Redirect`).
- Typed routes ON — use the generated `Href` types; no untyped string pathnames.
- The auth gate runs INSIDE the route (useEffect + redirect), not in `_layout.tsx`, so deep links still resolve to the right screen post-sign-in.
- Don't collect real auth — `sign-in` only validates *shape* of email/phone and stores a fake session.
