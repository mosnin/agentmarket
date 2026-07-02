# Cult-UI Components — usage & guardrails

Four expressive motion components vendored from the [cult-ui](https://cult-ui.com)
registry. They are **high-motion by nature**, so they're governed by the same
restraint the design system demands (see `DESIGN_SYSTEM.md`): use them where they
*reduce friction or add clarity*, never as decoration. Sophisticated over flashy.

## Provenance & our adaptations (do not regress)

Installed via `shadcn add https://cult-ui.com/r/{name}.json`, then adapted:

1. **Standardized on `framer-motion`.** The registry files import `motion/react`
   and the CLI added a duplicate `motion` package. We swapped every import to
   `framer-motion` (already our motion lib) and removed `motion`. **Keep imports
   as `framer-motion`** — do not reintroduce `motion/react` / the `motion` package.
2. **Dependency:** `side-panel` needs `react-use-measure` (keep it installed).
3. **Lint/build fixes:** `side-panel` forwards its `ref` to the root element;
   `dynamic-island` types `willChange` via the hook return and rest-props as
   `HTMLMotionProps<"div">` (no `any`). Re-adding `any`/unused vars breaks
   `next build` (lint runs in the build).
4. **Tokens, not hardcoded colors.** The registry ships `bg-neutral-900` /
   `bg-black` / `text-primary-foreground`. Always override with our semantic
   tokens (`bg-card`, `text-foreground`, `ring-foreground/10`, `bg-background/70`)
   so both themes render correctly. `ExpandableScreen` was given a token-based,
   dismissable backdrop it shipped without.

## Components

### `ExpandableScreen` — morph a block to fullscreen · **LIVE**
Compound API: `<ExpandableScreen layoutId triggerRadius contentRadius>` wrapping
`<ExpandableScreenTrigger>` (collapsed pill) + `<ExpandableScreenContent>`
(fullscreen panel). Shared-layout morph via `layoutId`; scroll-locked; dismissable
backdrop; close button (pass `closeButtonClassName` with tokens).

- **In use:** `components/shared/json-viewer.tsx` — opt-in `expandable` prop adds
  an "Expand" affordance that morphs dense JSON to fullscreen. Enabled on the
  agent interop schemas (`agent-card.json`, `input_schema`, `output_schema`),
  the developer-docs request/response/example blocks, and task `validation_rules`.
- **Good future uses:** expanding a dashboard chart; a long artifact preview.

### `DynamicIsland` — morphing status surface · vendored, not yet wired
iOS-style island with size presets (`compact`/`default`/`tall`/…) via a provider
(`DynamicIslandProvider`, `useDynamicIslandSize`). **Intended tasteful use:** a
single global async-status surface (top-center) that morphs `idle → "Posting…"
(spinner) → "Posted ✓"` — *functional* motion that augments/*replaces* transient
toasts. **Not** a decorative widget on every page. Deferred until it can be tuned
against a running instance (it must not compete with `sonner` toasts).

### `SidePanel` — sliding detail drawer · vendored, not yet wired
`<SidePanel panelOpen handlePanelOpen renderButton>`. **Intended use:** an agent
*quick-view* on the marketplace (open details without leaving the grid). Must be
retokenized (it ships `bg-neutral-900`, `rounded-r-[44px]`, a `videoUrl` slot) and
reconciled with our existing `Sheet` so we don't ship two drawer systems.

### `MorphSurface` — button-to-surface morph · vendored, not yet wired
A compact trigger that morphs into a small surface. **Intended use:** a contained
inline action (e.g. a quick note/command surface). Only adopt with a real
use-case — do not add a surface without a job to do.

## Integration status & the visual gate

- **Live now:** `ExpandableScreen` (JSON fullscreen) — build/lint/tsc verified.
- **Vendored + ready, deferred:** `DynamicIsland`, `SidePanel`, `MorphSurface` —
  these are high-motion and reshape core flows; wiring them broadly **without
  visual verification** risks the "gimmicky / janky / unfinished" outcome the UI
  brief forbids. They should be wired one at a time against a **running instance**
  (needs a database), tuned, and checked in light + dark + mobile before rollout.

## Checklist before adopting any of these

- [ ] Import from `framer-motion`; colors use semantic tokens (both themes).
- [ ] Motion respects `prefers-reduced-motion` (framer-motion `useReducedMotion`).
- [ ] It replaces friction or adds clarity — not decoration.
- [ ] Verified visually in light + dark + at 375px width.
- [ ] Keyboard: focusable trigger, `Escape`/outside-click to dismiss, focus returns.
