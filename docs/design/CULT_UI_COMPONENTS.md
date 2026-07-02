# Vendored motion components — usage & guardrails

Third-party registry components are **guests**, not residents. They earn a place
only when they strengthen the product (see `DESIGN_PHILOSOPHY.md` §5:
no component-library dumping). Anything vendored-but-unused is deleted, not
parked "for later" — dead components are how a codebase starts to feel assembled.

## Currently vendored & LIVE

### `ExpandableScreen` — morph a block to fullscreen
From [cult-ui](https://cult-ui.com). Compound API:
`<ExpandableScreen layoutId triggerRadius contentRadius>` wrapping
`<ExpandableScreenTrigger>` + `<ExpandableScreenContent>`. Shared-layout morph,
scroll-locked, dismissable backdrop.
- **In use:** `components/shared/json-viewer.tsx` — opt-in `expandable` prop that
  morphs dense JSON (agent interop schemas, developer request/response blocks,
  task validation rules) to fullscreen. It replaces friction (reading a long
  schema in a tiny scroll box), so it earns its place.

## Adaptation rules (do not regress)

1. **Import from `framer-motion`.** Registry files ship `motion/react` and pull a
   duplicate `motion` package; we standardize on `framer-motion` (our motion lib)
   and remove `motion`. Keep it that way.
2. **Tokens, not hardcoded colors.** Registries ship `bg-neutral-900` / `bg-black`
   / literal `--color-blue-600`. Always override with our semantic tokens
   (`bg-card`, `text-foreground`, `bg-background/70`, `var(--brand)`) so both
   themes render correctly. A component that can't be tokenized doesn't ship.
3. **Respect `prefers-reduced-motion`** via framer-motion's `useReducedMotion`.
4. **Lint-clean:** no `any`, no unused vars — `next build` runs lint and will fail.

## Removed (and why)

`SidePanel`, `DynamicIsland`, `MorphSurface` were vendored during exploration and
**never wired into a real flow.** Per the philosophy, unused imported components
are cut — they were removed along with their orphaned `react-use-measure`
dependency. `ShimmeringText` (`@ncdai`) was likewise removed once its single
usage was cut in the hero redesign. If a real use-case appears, re-vendor
deliberately, tokenized, one at a time, verified in light + dark + at 375px.

## Checklist before adopting anything new

- [ ] It replaces friction or adds clarity — not decoration.
- [ ] Import from `framer-motion`; all colors via semantic tokens (both themes).
- [ ] Respects `prefers-reduced-motion`.
- [ ] Verified in light + dark + at 375px.
- [ ] Keyboard: focusable trigger, `Escape`/outside-click dismiss, focus returns.
- [ ] It does not duplicate a component we already have (e.g. `Sheet`).
