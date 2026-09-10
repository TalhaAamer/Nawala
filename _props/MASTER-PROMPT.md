You are building Crave, a production‑quality, DoorDash‑inspired food‑delivery mobile
app, using Expo + React Native at the latest stable versions, with a
mock / local‑only backend (no servers, no API keys).
Where you are: you're starting in the expo_build/ workspace root, which holds one
folder per app (aurum/, crave/, …). For THIS build, work in crave/. Your very
first action is cd crave — then do everything inside it.
Read these files before writing any code, and treat them as the source of truth (they live
in crave/\_props/):

crave/\_props/CLAUDE.md — project rules, conventions, and guardrails
crave/\_props/TECH-STACK-SETUP.md — baseline versions, install commands, mock‑data + storage wiring
crave/\_props/DESIGN-SPEC.md — the design system and screen‑by‑screen specs
crave/\_props/BUILD-PLAN.md — the phased plan you will execute

Design reference (you have web access — use it): the visual language is abstracted
from DoorDash's iOS app on Mobbin. Study the reference plus current food‑delivery UI
patterns before building the UI:

https://mobbin.com/apps/door-dash-ios-43cf4b5d-000f-49f8-85cd-8bcb78fcb36b/0162a4a3-d8c9-4f99-bb43-9bc9f11dccc9/screens
(if it's gated, rely on DESIGN-SPEC.md and search for "DoorDash app UI" images instead).

Project location — IMPORTANT
Claude Code starts in the expo_build/ root. First cd crave. That folder
already contains a \_props/ subfolder with all the planning docs/assets for this build.
Build the Expo app in place — at the root of crave/, right alongside \_props/. Do not
build in the expo_build/ root, and do not create another nested app folder.

cd crave — all commands below run from there.
Scaffold into the current directory: run npx create-expo-app . from crave/. The
app files land next to \_props/, which stays untouched.
If it refuses because the directory isn't empty: scaffold into a temp dir
(npx create-expo-app .tmp-app), move its contents up into crave/, then delete the
temp dir. Never delete or overwrite \_props/.
Copy \_props/CLAUDE.md to the project root (crave/CLAUDE.md) so Claude Code
auto‑reads it. Leave the specs in \_props/ and reference them there.

Resulting layout:
expo_build/
aurum/ # the other app (leave it alone for this build)
crave/ # ← work here
\_props/ # planning docs (this kit) — source of truth, keep intact
CLAUDE.md # copied up from \_props so it's auto-read
app/ src/ ... # the Expo app, scaffolded in place
package.json
Use your web access — required
The version numbers in TECH-STACK-SETUP.md are a baseline from 2026‑06‑08 and may
be stale. Before installing anything you MUST:

Look up the current latest stable releases from official sources (docs.expo.dev,
expo.dev/changelog, npm) for Expo SDK, React Native, Expo Router, Reanimated,
react-native-worklets, AsyncStorage/MMKV, Zustand.
Prefer npx expo install for Expo‑managed packages so versions auto‑align to the
SDK; don't hand‑pin past what Expo resolves.
Read the official docs for any API you use and follow the current recommended
pattern; if it differs from the snippets here, tell me what changed and why.

How I want you to work

Confirm the environment first. Print Node/npm/Expo versions, then fetch the
current latest stable versions and present a table
(package | baseline | latest found | will install). Wait for my confirmation.
Follow BUILD-PLAN.md phase by phase. At the end of each phase STOP, summarize,
give the exact run command, and wait for "approved". Never skip a checkpoint.
Match DESIGN-SPEC.md exactly — all colors, spacing, radii, typography come from
theme tokens. No hardcoded design values in components.
Everything runs on seed data from day one. No // TODO screens; every screen
renders from the local mock API with realistic restaurants, menus, and imagery.

Design‑system discipline (non‑negotiable)

Build src/theme (tokens) FIRST, then a small component library in src/components,
then screens. Screens compose components; components read tokens.
Zero hardcoded design values. Every color, spacing, radius, font size, shadow
resolves from the theme. A literal hex/number is a bug.
Keep a /\_kitchen-sink route showing every component in light + dark; audit it each phase.

Hard requirements

Latest stable Expo SDK, RN, Expo Router, Reanimated — web‑verified at install time.
TypeScript, strict mode.
Expo Router (latest), file‑based, typed routes.
Reanimated (latest) for the cart bar, add‑to‑cart fly animation, skeleton loaders,
the order‑tracking progress, and press micro‑interactions. Respect reduce‑motion.
Mock/local backend only: a typed fake API (src/services/api) that returns seeded
data with simulated latency, plus on‑device persistence (AsyncStorage or MMKV) for
cart, session, orders, and favorites. The API layer must be swappable for a real
backend later without touching screens.
Mock auth: a sign‑in screen that accepts any email/phone (or "Continue as guest"),
stores a fake session locally, and gates the checkout/orders area.
Theme provider with light (default) + dark.
Accessibility: every interactive element labeled; 44×44 min hit targets; AA contrast.

What NOT to do

Don't add Firebase/Supabase/any network backend — this build is local‑only by design.
Don't require API keys (no live Maps key): use a styled map placeholder for tracking,
isolated behind a MapView component so a real map can drop in later.
Don't pull in heavyweight UI kits; build the component library in the design spec.
Don't use deprecated @react-navigation/\* imports in app code — use expo-router.
Don't blindly trust a version number in these files — confirm it on the web first.

Start by reading the four files and the design reference, run your web version check,
then give me the environment confirmation and the version table. Wait for my go‑ahead.
