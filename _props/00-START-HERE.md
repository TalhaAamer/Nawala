# Crave — Expo Food‑Delivery App Build Kit

A complete prompt + context package for building a polished, DoorDash‑inspired
food‑delivery mobile app with **Expo + React Native** and a **mock / local‑only
backend** (no servers, no keys), designed to be driven by **Claude Code**.

Toolchain baseline verified **June 8, 2026**. Claude Code re‑checks the latest stable
versions on the web at build time.

---

## What's in this kit

| File | Purpose | Where it goes |
|------|---------|---------------|
| `00-START-HERE.md` | This overview | — |
| `MASTER-PROMPT.md` | The copy‑paste kickoff prompt for Claude Code | paste into Claude Code |
| `CLAUDE.md` | Persistent project rules + context | `_props/` (copied up to root) |
| `DESIGN-SPEC.md` | Full design system + screen specs (from Mobbin / DoorDash) | `_props/` |
| `BUILD-PLAN.md` | Phased, checkpointed build plan | `_props/` |
| `TECH-STACK-SETUP.md` | Versions, install commands, mock‑data + local‑storage wiring | `_props/` |

## How to use it (5 steps)

1. **Make a project folder named after the app** — `crave/` — and inside it a **`_props/`**
   subfolder; put all 6 kit files in `crave/_props/`.
2. **Open Claude Code** in the `crave/` folder.
3. **Paste `_props/MASTER-PROMPT.md`** as your first message.
4. Claude Code scaffolds the Expo app **in place at the root of `crave/`** (alongside
   `_props/`), copies `_props/CLAUDE.md` up to the root, then works through
   `BUILD-PLAN.md` phase by phase — pausing at each checkpoint for you to approve.
5. The app runs entirely on seeded local data, so there's nothing to configure — just
   `npx expo start` and open it.

Resulting layout: `crave/{ _props/, CLAUDE.md, app/, src/, package.json, ... }`

## The app, in one line

**Crave** — a food‑delivery app: location‑aware home, cuisine browsing, restaurant and
menu detail, cart & mock checkout, live‑style order tracking, and order history —
all powered by a swappable local mock API and on‑device persistence.

## Why mock / local‑only

No backend to stand up and no API keys, so the whole UI/UX is buildable and demoable
immediately. The data is served through a **typed fake API layer** (`src/services/api`)
that simulates network latency — so later you can swap in a real backend (Supabase,
Firebase, a REST API) by replacing that one module, with zero changes to screens.

## Latest‑version policy

The versions in `TECH-STACK-SETUP.md` are the baseline as of June 2026. Claude Code has
web access and re‑checks the current latest stable releases at build time, installing
whatever is newest, so this kit stays correct as the stack evolves.

> Design reference chosen from Mobbin's Food & Drink category (**DoorDash**, 285 screens).
> It's an *inspiration* — all copy, branding, colors, and assets here are original.
