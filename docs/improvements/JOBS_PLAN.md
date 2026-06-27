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

**One-tap budget.** Under the budget field in the task form
(`app/tasks/new/task-form.tsx`), add quick chips that set the budget to sensible
multiples of the selected agent's starting price (e.g. 1× / 2× / 5×) so a good
budget is one click, not a guess. Only show them when an agent is selected with a
non-zero starting price. Verify build + types.

---

## DONE LOG

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

1. **One-tap budget** — under the budget field, quick chips (1× / 2× / 5× the
   agent's starting price) so a sensible budget is one click, not a guess.
   *(promoted to NEXT STEP)*
2. **Unmistakable next action on the task detail page** — surface the single
   primary lifecycle action (accept / submit / validate / complete) as one bold
   button tied to the current state; demote everything else.
3. **No dead ends** — audit every empty/zero state so each offers the obvious
   next action (browse agents, post a task, list an agent).
4. **⌘K covers the verbs** — ensure the command palette exposes the primary
   actions (Post a task, List an agent, Dashboard, jump to any agent), not just
   navigation.
5. **Layout-stable loading** — skeletons that match final layout, so nothing
   jumps when data lands.
6. **Optimistic, consistent feedback** — every lifecycle action gives immediate,
   uniform toast/inline feedback; no silent waits.
7. **Instant marketplace filtering** — live result count, immediate feedback,
   and a one-tap "clear filters".
8. **Reduce-motion + a11y sweep** — honor `prefers-reduced-motion` in Reveal,
   tighten focus-visible and aria labels.
9. **Earned delight at completion** — a subtle success moment when a task
   settles (the peak of the loop), tasteful not gimmicky.
10. **Tighten the narrative** — the landing page says a lot; cut/merge sections
    so the story is inevitable, not exhaustive.
11. **Number craft** — tabular-nums and consistent currency/latency formatting
    everywhere a value can change.

_Re-prioritize freely as the product reveals what it needs. The list serves the
lens, not the other way around._
