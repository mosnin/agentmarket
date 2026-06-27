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

**Frictionless "Hire" from the marketplace grid.** Add an accessible primary
"Hire" affordance to `AgentCard` (components/agents/agent-card.tsx) that deep-links
to `/tasks/new?agent=<slug>` so a buyer goes from browsing straight to a
pre-filled contract — without the profile detour. Use the stretched-link pattern
(card body remains the link to the profile; a separate, higher-z "Hire" button
sits on top) so there's no nested-anchor a11y violation. Verify build + types.

---

## DONE LOG

- **2026-06-27 — Smart self-drafting task contract.** The task form now drafts
  itself around the chosen specialist: selecting an agent (or arriving via the
  "Hire this agent" deep link) auto-adopts the agent's **category** and suggests
  its **starting price** as the budget — unless the buyer has already edited
  those fields. Picking an agent now means routing, category, and budget are
  sensible before you type a word. (`app/tasks/new/task-form.tsx`)

---

## BACKLOG (prioritized, each ~one iteration, build-safe)

1. **Hire from the grid** — accessible "Hire" CTA on AgentCard → pre-filled
   contract. *(promoted to NEXT STEP)*
2. **One-tap budget** — under the budget field, quick chips (1× / 2× / 5× the
   agent's starting price) so a sensible budget is one click, not a guess.
3. **Unmistakable next action on the task detail page** — surface the single
   primary lifecycle action (accept / submit / validate / complete) as one bold
   button tied to the current state; demote everything else.
4. **No dead ends** — audit every empty/zero state so each offers the obvious
   next action (browse agents, post a task, list an agent).
5. **⌘K covers the verbs** — ensure the command palette exposes the primary
   actions (Post a task, List an agent, Dashboard, jump to any agent), not just
   navigation.
6. **Layout-stable loading** — skeletons that match final layout, so nothing
   jumps when data lands.
7. **Optimistic, consistent feedback** — every lifecycle action gives immediate,
   uniform toast/inline feedback; no silent waits.
8. **Instant marketplace filtering** — live result count, immediate feedback,
   and a one-tap "clear filters".
9. **Reduce-motion + a11y sweep** — honor `prefers-reduced-motion` in Reveal,
   tighten focus-visible and aria labels.
10. **Earned delight at completion** — a subtle success moment when a task
    settles (the peak of the loop), tasteful not gimmicky.
11. **Tighten the narrative** — the landing page says a lot; cut/merge sections
    so the story is inevitable, not exhaustive.
12. **Number craft** — tabular-nums and consistent currency/latency formatting
    everywhere a value can change.

_Re-prioritize freely as the product reveals what it needs. The list serves the
lens, not the other way around._
