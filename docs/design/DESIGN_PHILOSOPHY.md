# Agent Market — Design Philosophy

This is the north star. Every visual decision references it. If a change can't be
justified against a principle here, it doesn't ship. The brand defines how
components are used — never the reverse.

---

## 1. What the product is

Agent Market is **financial-grade infrastructure for autonomous labor.** A buyer
posts a signed task contract, an agent executes, the output is validated, and
escrow settles. The feeling we are selling is **trust in an outcome you did not
personally supervise.**

So the interface must feel like **Stripe's ledger, not a SaaS dashboard**:
precise, quiet, exact, and confident. Technical, but not cold. Premium, but not
decorated.

## 2. The feeling (the brand instinct)

Apple's restraint · Stripe's polish · Linear's clarity · Vercel's engineering
taste · and a Kanye-grade sense of **contrast, silence, and confidence.**

That last one is the differentiator and the hardest to fake. It means:

- **Silence is a feature.** Negative space is not emptiness to fill. The most
  confident thing on a screen is the space around the one thing that matters.
- **One focal point per view.** If everything is emphasized, nothing is. Each
  screen has a single, obvious protagonist; everything else recedes.
- **Contrast, not decoration.** Drama comes from scale and weight jumps (a huge
  headline over small quiet meta), not from gradients, borders, or color.
- **Say it once.** No element repeats the job of another. Two eyebrows, two
  CTAs of equal weight, an icon that restates its label — all cut.

## 3. Visual language

### Brand mark
The logomark is the letter **A** built from a three-node connected graph — the
same node/edge motif as the product's task-flow visualization. Brand and product
are one idea. The apex node carries the single brand accent; everything else is
monochrome. Defined once in `components/brand/logomark.tsx`; the mark + wordmark
lockup lives in `components/brand/brand-lockup.tsx` and is the **only** approved
brand element. Never reintroduce a stock icon as the logo.

### Color & accent discipline
- **Monochrome foundation.** The system is a neutral OKLCH grayscale
  (`background`/`foreground`/`muted`/`card`/`border`). This carries ~95% of every
  screen.
- **One accent: brand violet** (`--brand`). It marks exactly one thing — the
  primary action, the active nav item, the live signal, the apex node. When
  everything is violet, nothing is. Treat brand as expensive.
- **Semantic color is functional only.** `success`/`warning`/`destructive` and
  the `chart-*` palette communicate state or data — never decoration.
- **Primary buttons are monochrome** (`--primary`: near-black in light, near-white
  in dark), not brand. High-contrast, Vercel-style. Brand is reserved for accent.
- Must feel equally intentional in light and dark. Dark is the default.

### Typography carries the experience
Type does the design work; ornament doesn't.
- **Display/headings:** large, `font-semibold`, `tracking-tight`, tight leading
  (`leading-[1.03]`). Balance with `text-wrap: balance`.
- **Body:** `text-muted-foreground`, relaxed leading, `max-w-2xl` measure. Never
  full-bleed paragraphs.
- **Meta/labels:** small, `tabular-nums` for numbers, occasional
  `uppercase tracking-[0.18em]` eyebrow — used at most once per section.
- Hierarchy is built from **size + weight + color**, in that order. Reach for a
  border or a background only when grouping genuinely requires it.

### Spacing & rhythm
- Section vertical rhythm on marketing: `py-20 sm:py-24`. Inside a section,
  content steps in a consistent `mt-` scale (6/8/10/14).
- Alignment is sacred. Everything sits on the shared `max-w-7xl` grid with
  `px-4 sm:px-6 lg:px-8`. No orphan margins.

### Surfaces & elevation
Three tiers, no more:
1. **Page** — `bg-background`.
2. **Surface** — `bg-card` (or `bg-card/30` for a quiet zone), separated by a
   hairline `border-border`. This is a *panel*, not a *box* — prefer one framing
   element, not a border **and** a heavy shadow **and** a fill.
3. **Floating** — popovers/dialogs/command: `bg-popover` + a real shadow.
Shadows are for genuine elevation (floating UI, the one hero visual). A resting
card does not need a drop shadow to exist.

### Borders & radius (deliberate nesting — do not flatten)
Containers `rounded-2xl`/`3xl` → nested cards `rounded-xl` → controls
`rounded-lg`. Radius encodes containment depth. Documented in
`DESIGN_SYSTEM.md`; keep it.

### Motion (functional only)
Tokens in `globals.css` (`--ease-out-quart`, `--ease-spring`,
`--duration-fast/base/slow`). Motion clarifies a state change or reveals
hierarchy on enter. It never loops for decoration in the reader's peripheral
vision. Everything settles under `prefers-reduced-motion`.

### Iconography discipline
Icons are **structural, not decorative.** An icon may mark a nav destination, a
control's action, or a genuine status. It may **not** sit beside a stat, a list
bullet, or a heading just to fill space. When in doubt, delete the icon and let
the type stand. No emoji, ever.

## 4. The bar (apply to every screen)

- Would Jobs call it inevitable? Would Stripe ship it?
- Is there exactly one focal point, and does the spacing make it obvious?
- Does type carry the hierarchy, or is it leaning on boxes and icons?
- Does every element earn its place, or is it here because the library made it
  easy? If the latter — cut it.
- Premium in **both** themes, excellent at 375px, keyboard-navigable, all states
  (empty/loading/error/success) designed on purpose.

## 5. Anti-patterns (never ship)

Default shadcn fingerprints · component-library dumping · decorative icons or
gradients · meaningless motion · two competing focal points · a border **and** a
shadow **and** a fill on the same resting card · brand color used as decoration ·
fabricated logos/testimonials · anything that reads as "vibe-coded" or "UI-kit
demo." If it looks assembled rather than designed, it isn't done.
