# Agent Market — "Think Like Steve Jobs" improvement loop

A self-running improvement loop. Every 18 minutes one focused change ships that
makes the product *simpler, more frictionless, and more delightful* — then this
plan is updated and the next step is chosen. Quality over quantity: one real,
build-green improvement per iteration.

## The lens — how to think like Steve Jobs here

1. **Focus is saying no.** Remove before adding. Every screen earns its weight.
2. **Start from the experience, work back to the tech.** Design how it *feels*,
   then make the code serve that.
3. **It just works.** Sensible defaults, no dead ends, the obvious next action is
   always one tap away. The product anticipates intent.
4. **Craft in the details no one asked for.** Spacing, motion, copy, empty
   states, the cursor's resting place — the 1% that signals the whole.
5. **Make the core loop magical, not the chrome.** Discover → hire → verify →
   pay is the soul of this product. Deepen it before decorating the edges.
6. **Delight & "one more thing."** A small, earned moment of surprise at the
   peak of the journey.

> The product is already visually polished (Linear/Vercel-grade). So the work is
> mostly **functional craft**: reduce clicks, pre-fill intent, clarify state,
> close dead ends — make it *feel inevitable*.

## How the loop operates (read this each iteration)

- Working dir `/home/user/agentmarket`, branch `claude/determined-lovelace-defv8v`.
- Deadline: **stop after epoch 1782585111** (2026-06-27 ~18:31 UTC, 12h window).
- Each firing: `git pull`, read this file, do the single **NEXT STEP**, keep the
  build green (`npm run build` + `npx tsc --noEmit`), move the step to the DONE
  LOG with an outcome, re-prioritize, set a new NEXT STEP, commit, push.
- One focused change per firing. Never push a broken build. Stay on the branch.

---

## NEXT STEP

**Make hiring obvious on the agent profile.** On `app/agents/[id]`, add a concise
"What you can ask" cue near the hire CTA — a couple of example briefs derived from
the agent's capabilities/category — so a buyer immediately grasps what to hire
this agent for (ideally each links into the pre-filled contract). Keep it a
focused, data-driven addition. Verify build + types.

---

## DONE LOG

- **2026-06-27 — Timestamp spread, complete.** Converted the last bare
  `formatRelativeTime` sites (admin disputes + reputation log, seller task table,
  agent profile recent tasks) to `RelativeTime`. Every timestamp in the UI is now
  relative with absolute-on-hover; the only remaining call lives inside the
  component itself. (`app/admin/page.tsx`, `app/seller/seller-tabs.tsx`,
  `app/agents/[id]/page.tsx`)
- **2026-06-27 — Humane timestamps in task cards.** The shared `review-card` and
  `artifact-card` now use `RelativeTime` (absolute-on-hover); dropped their unused
  imports. (`components/tasks/review-card.tsx`, `components/tasks/artifact-card.tsx`)
- **2026-06-27 — Humane timestamps on the dashboard.** The dashboard activity
  feeds (recent payments, marketplace activity, reputation changes) now use
  `RelativeTime` with absolute-on-hover; dropped the unused import.
  (`app/dashboard/page.tsx`)
- **2026-06-27 — Task page timestamps, complete.** Converted the remaining task
  detail dates (dispute "Opened", activity/reputation events) to `RelativeTime`,
  so every timestamp on the page is relative with absolute-on-hover; dropped the
  now-unused import. (`app/tasks/[id]/page.tsx`)
- **2026-06-27 — Humane timestamps.** New reusable `RelativeTime` renders "2h
  ago / in 3d" with the absolute date-time on hover (and a machine-readable
  `dateTime`); applied to the task detail "Created" and "Due" headers, with the
  metadata panel keeping the absolute date as a precise complement.
  (`components/shared/relative-time.tsx`, `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Copy the identifiers.** Reused `CopyButton` for the contract
  hash (contract preview) and the transaction hash (task detail), so the values
  people actually grab are one click away.
  (`components/tasks/task-contract-preview.tsx`, `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Copy, in one click.** Added a reusable `CopyButton` and wired it
  into the API example panel — the request (method, path, body) copies with one
  click and confirms inline with a check. (`components/shared/copy-button.tsx`,
  `components/landing/api-code-panel.tsx`)
- **2026-06-27 — Number craft on agent cards.** The marketplace cards' metrics
  (rating, completion, latency) and price now use `tabular-nums`, so digits align
  across the grid instead of jittering. (Dashboard cards already had it.)
  (`components/agents/agent-card.tsx`)
- **2026-06-27 — One-tap "Clear all" in the marketplace.** When filters are
  active and results are showing, a "Clear all" reset now sits beside the result
  summary — not only inside the empty state — so a buyer can start over in one
  tap. (`app/marketplace/page.tsx`)
- **2026-06-27 — Earned delight at completion.** When a task settles, the
  "Settled" confirmation now springs in with a popped check — a small, earned
  moment at the peak of the loop, via Framer Motion and reduced-motion-aware.
  (`app/tasks/[id]/task-actions.tsx`)
- **2026-06-27 — ⌘K speaks in verbs.** The command palette now leads with an
  "Actions" group — "Post a task" and "List an agent" — so the two core
  jobs-to-be-done are a keystroke away, above navigation and agent search.
  (`components/layout/search-command.tsx`)
- **2026-06-27 — No dead ends (verified, no change needed).** Confirmed every
  empty/zero state already routes somewhere: the marketplace's filtered-empty
  state offers "Clear filters", the unlisted state offers "List your agent", and
  `EmptyState` (with an action) is used across dashboard, seller, admin, task,
  and agent pages.
- **2026-06-27 — The task detail page explains its own state.** The action panel
  was already state-aware (one prominent primary action per status), so rather
  than add clutter, surfaced the missing detail: the actual validation **score**
  now appears in the passed/failed states ("scored 86/100, above the 80 bar"), so
  the Complete / Resubmit decision explains itself. (`app/tasks/[id]/*`)
- **2026-06-27 — One-tap budget.** The task form's budget field now offers quick
  chips (1× / 2× / 5× the selected agent's starting price) that set a sensible
  budget in one click, the active multiple highlighted — shown only when an agent
  with a real price is selected. (`app/tasks/new/task-form.tsx`)
- **2026-06-27 — Hire from the grid.** `AgentCard` now carries a one-tap "Hire"
  action that deep-links to a contract pre-filled with that agent
  (`/tasks/new?agent=<slug>`) — browse → hire with no profile detour. Built with
  the stretched-link pattern: the card body still opens the profile, the Hire
  button is raised above it (accessible, no nested anchors).
  (`components/agents/agent-card.tsx`)
- **2026-06-27 — Smart self-drafting task contract.** The task form now drafts
  itself around the chosen specialist: selecting an agent (or arriving via the
  "Hire this agent" deep link) auto-adopts the agent's **category** and suggests
  its **starting price** as the budget — unless the buyer has already edited
  those fields. Picking an agent now means routing, category, and budget are
  sensible before you type a word. (`app/tasks/new/task-form.tsx`)

---

## BACKLOG (prioritized, each ~one iteration, build-safe)

1. **Agent profile "what you can ask"** — a concrete example brief that makes
   hiring obvious. *(promoted to NEXT STEP)*
2. **Keyboard niceties** — Esc/Enter affordances and focus return in dialogs;
   keep the ⌘K hint discoverable.
3. **Layout-stable loading** — verify each route's skeleton matches its final
   layout so nothing shifts when data lands; fix any jumps.
4. **Agent profile "what you can ask"** — a concrete example brief that makes
   hiring obvious.
5. **Tighten the narrative** — the landing page says a lot; cut/merge sections
   so the story is inevitable, not exhaustive.
6. **A11y polish** — extend the reduced-motion guard to any other always-on
   animation; tighten aria labels where thin.

_Re-prioritize freely as the product reveals what it needs. The list serves the
lens, not the other way around._
