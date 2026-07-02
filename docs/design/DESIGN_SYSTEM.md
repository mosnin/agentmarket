# Agent Market — Design System

The single reference for the visual language. Grounded in the real tokens
(`app/globals.css`) and primitives (`components/ui/*`). Philosophy: Stripe /
Linear / Vercel / Apple / Ramp — **sophisticated, not flashy**. Every element
earns its place; restraint over decoration; premium in both themes.

## Color (OKLCH, semantic, dark-first)

Perceptually-uniform OKLCH; dark is the default (`<html class="dark">`). Never
hard-code hex — always use the semantic token so both themes stay correct.

| Token | Role | Dark | Light |
|---|---|---|---|
| `background` | app canvas | `0.155 0.012 265` | `0.99 0.002 265` |
| `foreground` | primary text | `0.97 0.003 265` | `0.18 0.01 265` |
| `card` | raised surface | `0.195 0.013 265` | `1 0 0` |
| `popover` | overlay surface | `0.2 0.014 265` | `1 0 0` |
| `muted` / `muted-foreground` | subtle fill / secondary text | `0.245` / `0.68` | `0.97` / `0.53` |
| `accent` | hover fill | `0.27 0.018 265` | `0.96 0.005 265` |
| `border` / `input` | hairlines / field borders | `white/9%` / `white/14%` | `0.92` |
| `ring` | focus ring (= brand) | `0.66 0.2 280` | `0.55 0.21 280` |
| `brand` | primary accent (violet) | `0.66 0.2 280` | `0.55 0.21 280` |
| `destructive` / `success` / `warning` | status | see globals.css | |
| `chart-1..5` | data viz | brand→blue→cyan→amber→magenta | |

**Surface hierarchy:** `background` → `card`/`sidebar` → `popover`. Elevation is
communicated by surface + a single hairline (`border-border` or `ring-1
ring-foreground/10`), **not** heavy shadows. Reserve `shadow-glow` for the brand
CTA / hero only.

## Typography

- **Family:** Geist Sans (`--font-sans`, also `--font-heading`), Geist Mono
  (`--font-geist-mono`) for code/hashes/tabular data. A single family is a
  deliberate minimalist choice; headings differ by weight/tracking, not face.
- **Scale (in use):** `text-xs` (11–12 micro-labels, uppercase tracked) · `text-sm`
  (13–14 body — the workhorse) · `text-base` (titles) · `text-lg`–`text-2xl`
  (section/page headings) · `text-3xl`+ (hero, KPI values). Numbers use
  `tabular-nums`; large values add `tracking-tight`.
- **Rule:** body is `text-sm`; secondary text is `text-muted-foreground`; only one
  `text-base`+ title per card. Don't introduce new arbitrary sizes — extend the
  step list here first.

## Spacing

Tailwind 4px base. Rhythm: card padding `p-5`/`p-6` (`--card-spacing` token in the
primitive), section gaps `gap-6`/`space-y-6`/`space-y-8`, inline chip gaps
`gap-1.5`/`gap-2`. Page frame: `max-w-7xl px-4 sm:px-6 lg:px-8`.

## Radius

Derived from `--radius: 0.7rem`: `sm 0.6× · md 0.8× · lg 1× · xl 1.4× · 2xl 1.8× ·
3xl 2.2× · 4xl 2.6×`. **Nesting hierarchy (deliberate — keep it):** primary
content containers `rounded-2xl`; cards *nested inside* a container (e.g. artifact
/ review / contract cards on the task page) step down to `rounded-xl`; controls
(button/input) `rounded-lg`; pills/avatars `rounded-full`. A nested surface should
always be one step tighter than its parent — matching radii flattens the
hierarchy. Don't unify these to a single value.

## Motion

Codified in `globals.css`. Quiet, fast, functional — never decorative.

- **Easing:** `ease-out-quart` (enter/settle), `ease-spring` (earned confirmations
  only, e.g. the settled-payment check). Interactive feedback uses the default ease.
- **Duration:** `--duration-fast 120ms` (hover/press), `--duration-base 200ms`
  (dropdown/modal/tab), `--duration-slow 320ms` (page/section). Reference via
  `duration-[var(--duration-fast)]`.
- **Always** gated by `prefers-reduced-motion` (global reset in globals.css +
  `useReducedMotion()` for framer-motion). Text feedback (“Saving…”) never depends
  on motion.

## Components (inventory)

- **Button** (`ui/button.tsx`): variants `default · outline · secondary · ghost ·
  destructive · link`; sizes `xs · sm · default · lg · icon{,-xs,-sm,-lg}`.
  `focus-visible` ring + `active:translate-y-px`. Icons auto-size to `size-4`.
- **Input / Textarea / Select / Switch / Dialog / Dropdown / Tabs / Table /
  Tooltip / Avatar / Separator / ScrollArea / Sheet / Command** — Base UI +
  shadcn, shared `focus-visible` + `aria-invalid` treatment.
- **Card** (`ui/card.tsx`): container-query aware, `--card-spacing` token,
  `sm`/`default` sizes, header/title/description/action/content/footer slots.
- **Domain:** `MetricCard` (KPI), `AgentCard`, `EmptyState`, `CopyButton`,
  `RelativeTime`, `ReputationScore`, status badges, `TaskTimeline`.

## States (the four that signal quality)

- **Empty:** `EmptyState` — icon, title, one-line guidance, a primary action. Every
  list/section has one.
- **Loading:** route-level `loading.tsx` skeletons that mirror the final layout
  (no layout shift); inline spinners with a text label for actions.
- **Error:** per-segment `error.tsx` — on-brand panel, "Try again" + an escape link.
- **Success:** `sonner` toasts; the settled-payment moment adds one earned
  `ease-spring` flourish.

## Non-negotiables

No decorative icons · no loud gradients (monochrome `text-gradient`; brand glow
reserved) · no over-animation · consistent `focus-visible` on every interactive
element · premium in light **and** dark · mobile-first responsive · never ship an
unfinished visual state.
