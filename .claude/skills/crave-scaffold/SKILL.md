---
name: crave-scaffold
description: Phase 0 of Crave — scaffold the Expo + React Native app IN PLACE at the root of crave/ (alongside _props/), verify Node/npm/Expo versions against latest stable on the web, install dependencies via expo install, configure TypeScript path alias and app.json (newArchEnabled + typedRoutes), and create the app/ + src/ folder skeleton. Use when starting the build or when CLAUDE.md / _props/ scaffolding is missing.
---

# crave-scaffold

Phase 0 of the Crave build plan. Get a booting Expo Router app on the latest stable stack with the project's folder structure and theme provider stubbed in.

## Preconditions
- CWD is `crave/` (the project root).
- `_props/` exists and contains the planning docs. **Never delete or overwrite `_props/`.**
- `CLAUDE.md` may or may not exist at the root.

## Steps

### 1. Environment check (print before anything else)
```bash
node --version
npm --version
npx expo --version
```

### 2. Verify latest stable versions on the web
The baseline in `_props/TECH-STACK-SETUP.md` is from 2026-06-08 and may be stale. Use WebFetch / WebSearch on these sources:
- `docs.expo.dev` and `expo.dev/changelog` — latest Expo SDK
- `npm` registry for: `expo-router`, `react-native-reanimated`, `react-native-worklets`, `@react-native-async-storage/async-storage`, `zustand`, `@tanstack/react-query`

Present a `package | baseline | latest found | will install` table and **STOP for user confirmation** before installing.

### 3. Scaffold Expo in place
From `crave/`:
```bash
npx create-expo-app@latest . --template default
```
If it refuses on a non-empty dir (because of `_props/`):
```bash
npx create-expo-app@latest .tmp-app --template default
# move .tmp-app/* and .tmp-app/.* up to . — preserve _props/ untouched
rsync -a .tmp-app/ ./ && rm -rf .tmp-app
```
Then:
```bash
cp _props/CLAUDE.md ./CLAUDE.md   # only if root CLAUDE.md doesn't already exist
```

### 4. Install dependencies (prefer `npx expo install`)
```bash
# routing + animation
npx expo install expo-router react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-screens react-native-safe-area-context

# ui / media / system
npx expo install expo-image expo-linear-gradient expo-blur expo-haptics @expo/vector-icons \
  @gorhom/bottom-sheet expo-font @expo-google-fonts/inter expo-splash-screen expo-status-bar

# persistence (default to AsyncStorage; MMKV needs a dev build)
npx expo install @react-native-async-storage/async-storage

# state / validation / utils
npm i zustand zod date-fns
```

### 5. Configure tsconfig + app.json
- `tsconfig.json`: extend `expo/tsconfig.base`, set `"strict": true`, add path alias `"@/*": ["src/*"]`.
- `app.json`: `newArchEnabled: true`, `experiments.typedRoutes: true`, set app name "Crave".

### 6. Folder skeleton (create empty/stub files)
```
app/
  _layout.tsx              # ThemeProvider + Stack root, splash hold
  index.tsx                # placeholder until phase 3 routing replaces it
src/
  theme/                   # populated by crave-theme
  components/              # populated by crave-components
  features/
  services/
    api/
    storage/
  store/
  mocks/
  lib/
  types/
```

### 7. Babel
`babel-preset-expo` already bundles the Reanimated v4 worklets plugin. **Do NOT create `babel.config.js`** unless a warning explicitly asks for the worklets plugin — if so, add it **last** in the plugins array, never the legacy `react-native-reanimated/plugin`.

### 8. Checkpoint
- `npx tsc --noEmit` clean
- `npx expo start` boots to a themed blank screen
- Summarize what changed, give the run command, **wait for "approved"**.

## Hard rules
- Never delete `_props/`.
- Never hand-pin past what `npx expo install` resolves.
- Always confirm the version table with the user before installing.
- Run `npx expo-doctor` after dependency changes; fix anything it flags.
