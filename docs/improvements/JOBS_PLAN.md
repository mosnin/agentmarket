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

**Document testing & CI in the README.** Now that there are 178 tests (Vitest + Testing
Library) and a CI gate, add a concise "Testing" subsection to the README: how to run
`npm test` / `npm run typecheck` / `npm run build`, what's covered (pure logic, the public API
contract, key UI components), and that CI runs them on every PR. Keep it accurate and short —
match what ships. Verify with build (+ tests stay green).

> The loop has pivoted to **test coverage** (the app had none). Each iteration:
> add one focused test file for a pure module, run `npm test`, keep build green.

---

## DONE LOG

- **2026-06-27 — CI workflow.** Added `.github/workflows/ci.yml` (runs on PRs + main):
  `npm ci` → typecheck → lint → `npm test` → `npm run build`, with a dummy `DATABASE_URL`
  (data pages are force-dynamic, so the build never connects) and a concurrency guard.
  Institutionalizes the loop's quality gate — the 178 tests + green build are now enforced
  automatically on every PR (including this loop's PR #2). (`.github/workflows/ci.yml`)
- **2026-06-27 — Test MarketplaceFilters clear-all + active state.** Added
  `marketplace-filters.test.tsx` (mocks `next/navigation` via `vi.hoisted` so the active params
  vary per test): with no params it reads "No filters" and shows no Clear button; with a
  `category` filter it reads "Filters active", shows "Clear", and clicking it routes back to a
  bare `/marketplace`. Covers the filter bar's reset logic on a core surface. 178 tests across
  22 files. (`components/marketplace/marketplace-filters.test.tsx`)
- **2026-06-27 — Test RelativeTime (the `<time>` contract).** Added `relative-time.test.tsx`
  — 3 tests: renders a `<time>` with a machine-readable `dateTime` (ISO), the humane relative
  text as content ("…ago"), and the exact date-time as `title`; accepts a string date; forwards
  a className. Pins the semantic-time + hover-exact-time contract used on every timestamp. 176
  tests across 21 files. (`components/shared/relative-time.test.tsx`)
- **2026-06-27 — Copyable transaction hashes in the admin ledger.** Re-walked `/admin`
  (moderation, disputes, suspicious tasks, payments, reputation — all solid). Closed the one
  gap: the payments ledger showed each tx hash with only a hover `title` (mouse-only, not
  copyable), unlike the task-detail page. Added a reusable `srLabel` to `CopyButton`
  (descriptive accessible name for a truncated visible label) and used it so each ledger hash
  is now one-click copyable + keyboard/touch reachable. 173 tests. (`components/shared/copy-button.tsx`,
  `…/copy-button.test.tsx`, `app/admin/page.tsx`)
- **2026-06-27 — Urgency-sort the Seller Studio inbound.** Mirrored the dashboard:
  `getSellerData` now returns the inbound tasks sorted by `taskUrgencyRank` (overdue →
  due-soon → rest, stable so recency holds within each band), so the deliverer's at-risk work
  leads the inbound table. Counts stay derived from the unsorted list. The urgency thread is
  now complete across both glance surfaces. (`lib/data.ts`)
- **2026-06-27 — Surface urgent tasks first (dashboard).** Added a pure
  `taskUrgencyRank(task, now?)` to `lib/tasks.ts` (overdue 0 / due-soon 1 / else 2) with 3
  tests, and sorted the dashboard's in-flight `activeTasks` by urgency before the 6-item slice
  (stable sort preserves newest-first within each band). Overdue / due-soon tasks now float to
  the top of the operator's glance list instead of being buried by recency. 172 tests across
  20 files. (`lib/tasks.ts`, `lib/tasks.test.ts`, `lib/data.ts`)
- **2026-06-27 — "Due soon" in the task lists.** Added the amber "Due soon" chip next to the
  "Overdue" chip in the dashboard "Active tasks" list and the Seller Studio inbound table
  (overdue takes precedence). The deadline signal (overdue + due-soon) is now consistent
  across all three task surfaces: detail, dashboard, seller. (`app/dashboard/page.tsx`,
  `app/seller/seller-tabs.tsx`)
- **2026-06-27 — "Due soon" deadline signal.** Added a pure `isTaskDueSoon(deadline, status,
  now?)` to `lib/tasks.ts` (deadline within the next 24h, not overdue, in-flight; mutually
  exclusive with `isTaskOverdue`) with 4 tests, and surfaced it on the task detail header —
  an in-flight task due within a day reads amber "Due soon — in N hours" (rose "Overdue" still
  takes precedence). A proactive nudge before the deadline is blown. 169 tests across 20
  files. (`lib/tasks.ts`, `lib/tasks.test.ts`, `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Test the status badges.** Added `components/status-badges.test.tsx` — 6
  tests: `TaskStatusBadge` / `PaymentStatusBadge` / `AgentStatusBadge` each render the correct
  `*_STATUS_META[status].label` (asserted against the source-of-truth META) for representative
  statuses (running, escrowed, suspended, archived) and fall back to "Unknown" for an
  unrecognized status. Pins the status→label contract used across dashboard, seller and task
  detail. 165 tests across 20 files. (`components/status-badges.test.tsx`)
- **2026-06-27 — Test the task form's smart defaults.** Added `app/tasks/new/task-form.test.tsx`
  (mocks `next/navigation`, the `createTask` action, and `sonner`): rendering `TaskForm` with
  `preselectedAgentId` adopts that agent's starting price as the budget ($80, replacing the
  $25 default); without a preselected agent the budget stays at the $25 default. Protects the
  headline "frictionless hiring" flow end-to-end through the form — the most integration-level
  test so far. 159 tests across 19 files. (`app/tasks/new/task-form.test.tsx`)
- **2026-06-27 — Test ReputationScore tier logic.** Added `reputation-score.test.tsx` — 4
  tests: renders the score + a "Reputation N/100" title; clamps/rounds out-of-range +
  fractional scores (150→100, −10→0, 84.6→85); colours the number by tier band (emerald
  ≥90, lime ≥80, amber ≥70, rose below); renders the optional "Reputation / N / 100 rep"
  label. Protects the tier thresholds shown across cards, profiles and dashboards. 157
  tests across 18 files. (`components/agents/reputation-score.test.tsx`)
- **2026-06-27 — Test the TaskTimeline lifecycle view.** Added `task-timeline.test.tsx` —
  6 tests: renders all six happy-path steps (Pending→Completed); flags the current step
  "In progress" (and not once completed); appends a terminal node for cancelled / disputed;
  and renders an unknown status (draft) with no active step. Protects the stepper's
  done/active/upcoming/off-path logic. 153 tests across 17 files.
  (`components/tasks/task-timeline.test.tsx`)
- **2026-06-27 — Extract + test the rating StarPicker.** Pulled the 1–5 star rating input
  out of `task-actions.tsx` into a reusable `components/tasks/star-picker.tsx` (the review
  dialog imports it). Added `star-picker.test.tsx` — 4 tests: five radios + a "Tap to rate"
  prompt when unset; clicking a star calls `onChange` with its value; the active rating is
  `aria-checked` and labelled ("4 · Great"); one star uses the singular ("1 star" / "1 ·
  Poor"). 147 tests across 16 files. (`components/tasks/star-picker.tsx`, `…/star-picker.test.tsx`,
  `app/tasks/[id]/task-actions.tsx`)
- **2026-06-27 — Test AgentCard (marketplace card composition).** Added
  `agent-card.test.tsx` — 5 tests: renders name/category/description and the
  `formatAgentPrice` label ("$25/task"); shows the first three capabilities + a "+1 more"
  overflow (hiding the 4th); the Hire link deep-links to `/tasks/new?agent=<slug>`; the
  card body links to `/agents/<slug>`; a brand-new agent shows "New" instead of a rating.
  Protects the card + the hire deep-link the browse→hire flow depends on. 143 tests across
  15 files. (`components/agents/agent-card.test.tsx`)
- **2026-06-27 — Test CopyButton (first interactive UI test).** Added `copy-button.test.tsx`
  — 3 tests: the label doubles as the accessible name; a click calls
  `navigator.clipboard.writeText(value)` and flips the control to "Copied"; a failed write
  leaves it on the label (silent failure). Mocks the Clipboard API and asserts the async
  confirmation via `findByRole` — proving the component-test path handles events + async.
  138 tests across 14 files. (`components/shared/copy-button.test.tsx`)
- **2026-06-27 — Component-test infrastructure + first UI test.** Wired a DOM testing path
  into Vitest: `@vitejs/plugin-react` (transforms `.tsx`, since Next's tsconfig uses
  `jsx: preserve` which esbuild alone can't consume) + `@testing-library/react` + `jsdom`.
  Component tests opt into jsdom via a `// @vitest-environment jsdom` docblock so the
  pure-logic suites stay on the fast `node` env. First test: `empty-state.test.tsx` (5
  tests — title, optional description present/absent, action node, icon). 135 tests across
  13 files; unlocks testing form + dialog behavior. (`vitest.config.ts`, `package.json`,
  `components/shared/empty-state.test.tsx`)
- **2026-06-27 — Global reduced-motion guard for CSS animation.** `globals.css` had no
  `prefers-reduced-motion` handling, so decorative CSS motion (the pulsing `running`/
  `validating` status dots, hover/scroll transitions) ignored the user's setting despite
  the README's claim. Added a scoped `@media (prefers-reduced-motion: reduce)` block that
  near-instantly settles animations + transitions (essential text feedback like "Saving…"
  is unaffected). With the chart fix, reduced-motion is now honored across JS + CSS.
  (`app/globals.css`)
- **2026-06-27 — Reduced-motion guard on the dashboard charts.** Recharts area/bar/line
  charts animate on mount by default, contradicting the README's `prefers-reduced-motion`
  claim. `DashboardChart` now reads `useReducedMotion()` and passes
  `isAnimationActive={!reduceMotion}` to every series, so motion-sensitive users get a
  static render. (`components/dashboard/dashboard-chart.tsx`)
- **2026-06-27 — README reflects the completed lifecycle.** Updated "What it does" so the
  front door matches what ships: agent profiles note the owner's inline **Edit listing**
  action; the lifecycle line notes buyer-initiated cancellation refunds the escrow; the
  admin console line now reads "verify / suspend / archive agents, resolve or reject
  disputes." (`README.md`)
- **2026-06-27 — A11y sweep: external links announce "opens in a new tab."** Audited
  interactive controls — icon-only buttons (theme toggle, mobile menu), `CopyButton`,
  `StarPicker`, filter selects and labelled external links all already carry accessible
  names. The one gap: `target="_blank"` links gave no notice they open a new context.
  Added an `sr-only` "(opens in a new tab)" hint to the user-facing external links
  (artifact "Open artifact", agent endpoint URL, MCP server).
  (`components/tasks/artifact-card.tsx`, `app/agents/[id]/page.tsx`)
- **2026-06-27 — Test the detail serializers (API contract coverage complete).** Extended
  `serializers.test.ts` with 9 tests for the GET-by-id contracts: `serializeTaskDetail`
  (base + buyer, snake_case contract section, `contract: null` when none, artifacts with
  ISO dates + null url/score, "Operator" buyer-name fallback, x402 `payment_requirement` +
  A2A task message) and `serializeAgentDetail` (long_description/status/organization,
  schemas, metric counts, interop a2a_card + 2 mcp tools, ISO created_at, null org). The
  full public API serializer surface is now pinned. 130 tests. (`app/api/_lib/serializers.test.ts`)
- **2026-06-27 — Test the public API serializers.** Added `app/api/_lib/serializers.test.ts`
  — 7 tests pinning the public response contract: `serializeAgent` (snake_case keys,
  capability names, pricing/trust/endpoint shape, completion→1dp & rating→2dp rounding,
  endpoint pass-through), `serializeTaskListItem` (ISO dates, nested `seller_agent`,
  snake_case payment with `transaction_hash`, null handling), and `apiError` (`{error}`
  alone vs `{error, code}`). 121 tests. (`app/api/_lib/serializers.test.ts`)
- **2026-06-27 — Reachable "archived" agent state (admin).** Agent moderation toggled
  only active↔suspended, so the valid "archived" (retire) state `setAgentStatus`
  supports was unreachable. Added an "Archive" action beside Suspend/Activate (offered
  for any non-archived agent; archived agents can still be reactivated via the toggle).
  `listAgents` already excludes archived agents, so retiring cleanly delists. Completes
  the agent moderation lifecycle. (`app/admin/admin-actions.tsx`)
- **2026-06-27 — Reachable "rejected" dispute outcome.** Dispute resolution was wired
  (admin `ResolveDisputeButton` → `resolveDispute`), but it hardcoded "resolved" — the
  valid "rejected" outcome the action already supports was unreachable. Added a "Reject
  claim" button alongside "Mark resolved" (both validate the resolution note); resolving
  credits the agent's reputation, rejecting leaves it unchanged. The dispute lifecycle's
  rejected state is now reachable. (`app/admin/admin-actions.tsx`)
- **2026-06-27 — Wire up task cancellation.** The lifecycle had a "cancelled" state and
  a complete `cancelTask` action (sets cancelled + refunds escrow), but nothing in the UI
  triggered it — a buyer couldn't cancel a task they posted. Added a "Cancel task"
  affordance to the task detail actions for in-flight tasks (pending/accepted/running),
  with a confirmation dialog explaining the escrow refund. The "cancelled" state is now
  reachable. (`app/tasks/[id]/task-actions.tsx`)
- **2026-06-27 — Enforce ownership on agent edit.** Closed the authorization gap the
  edit flow exposed: `updateAgent` now loads the agent and rejects the update unless
  `ownerId === currentUser.id` ("You can only edit agents you own."), and
  `/agents/[id]/edit` redirects non-owners back to the public profile. Defense at both
  the action and page layers. (`lib/actions.ts`, `app/agents/[id]/edit/page.tsx`)
- **2026-06-27 — Owner-only "Edit" on the agent profile.** The edit flow (built last
  iteration) was only reachable from Seller Studio. Added an "Edit listing" action next
  to "Hire this agent" in the profile header, shown only when the viewer owns the agent
  (`agent.ownerId === currentUser.id`). Edit is now reachable from where you view the
  listing. (`components/agents/agent-profile-header.tsx`, `app/agents/[id]/page.tsx`)
- **2026-06-27 — Build the agent edit flow (fix a dead link).** Seller Studio linked
  every listing to `/agents/[slug]/edit`, but no such route existed — the "Edit" button
  404'd. Built it: extended `AgentForm` to accept optional pre-filled `initial` values
  and branch create vs. update (via the existing `updateAgent` action), with edit-aware
  copy ("Save changes" / "Saving…"). Added `app/agents/[id]/edit/page.tsx` — loads the
  agent via `getAgent`, maps it to the form (capabilities → names, stored JSON schemas →
  pretty strings), and renders the form in edit mode. A real, dead-end-to-working-feature
  fix. (`app/agents/new/agent-form.tsx`, `app/agents/[id]/edit/page.tsx`)
- **2026-06-27 — Fix API doc drift: budget is required.** Cross-checked the
  `/developers` API docs against the real routes + `apiCreateTaskSchema`: the
  create-task `budget` param was documented as "Defaults to 0", but the schema requires
  `.positive()` — a developer omitting it would hit a 400 ("budget is required and must
  be greater than 0"). Marked it `required` and corrected the copy to "Must be greater
  than 0". (Verified category→Growth and payment_mode→mock_escrow defaults are
  accurate.) (`app/developers/page.tsx`)
- **2026-06-27 — Sensible default price on agent creation.** Re-walked `/agents/new`:
  the form is genuinely polished (4 consistent steps, capability tag input +
  suggestions, JSON format + live validity hint, character counters, free auto-zeros
  price). Closed one footgun the pricing unification exposed — the default `per_task`
  model paired with a `$0` default price meant a seller could publish a paid agent that
  read as "Free" everywhere. Default starting price is now $25 (a sensible, editable
  starter matching the task form's budget default); choosing "Free" still zeros it.
  (`app/agents/new/agent-form.tsx`)
- **2026-06-27 — Unify the price/pricing-label logic.** Four hire surfaces each
  re-derived an agent's price string (agent card, profile header, detail page, seller
  studio), and only one treated a $0 price as "Free". Extracted a single
  `formatAgentPrice(agent)` into `lib/pricing.ts` (free model *or* $0 → "Free"; else
  currency + per-model suffix; returns value / suffix / label) and pointed all four at
  it — so price reads identically everywhere, and a $0 agent now shows "Free"
  consistently. +5 tests (114 total). (`lib/pricing.ts`, `lib/pricing.test.ts`,
  `agent-card.tsx`, `agent-profile-header.tsx`, `app/agents/[id]/page.tsx`, `seller-tabs.tsx`)
- **2026-06-27 — Decouple + test the marketplace filter logic.** Re-walked browse →
  hire: the marketplace already nails filter clarity (debounced search, removable
  per-filter chips, "Clear all", result count with `aria-live`, sort label). Extracted
  the page's two pure functions — `parseFilters` (validates + drops unknown
  category/pricing/sort, positive rating only, verified only on "true") and
  `activeFilterChips` (the subtle "remove one filter, keep the rest" omit logic) — into
  a co-located `app/marketplace/filters.ts` and added `filters.test.ts` (11 tests). A
  regression in the omit logic would silently break the chips; now it's pinned. 109
  tests. (`app/marketplace/filters.ts`, `app/marketplace/filters.test.ts`, `app/marketplace/page.tsx`)
- **2026-06-27 — Platform-aware ⌘K hint.** Confirmed the command palette is already
  discoverable: a visible "Search agents… ⌘K" trigger that opens on click, ⌘K/Ctrl+K,
  and "/". Fixed the one imprecision — the hint always showed ⌘K even on Windows/Linux
  where the binding is Ctrl+K; it now shows the correct modifier per platform (⌘ on
  Apple, Ctrl elsewhere), corrected post-mount so there's no hydration mismatch.
  (`components/layout/search-command.tsx`)
- **2026-06-27 — Overdue in Seller Studio (deadline thread complete).** Reused
  `isTaskOverdue` in the Seller Studio inbound-tasks table so the operator who must
  *deliver* sees the same rose "Overdue" chip on in-flight tasks past their deadline.
  The blown-deadline signal is now consistent across the three surfaces a task appears
  on: detail page, dashboard, and seller inbound. (`app/seller/seller-tabs.tsx`)
- **2026-06-27 — Overdue signal in task lists + shared helper.** Extracted a pure,
  client-safe `isTaskOverdue(deadline, status, now?)` into `lib/tasks.ts` (terminal
  tasks never overdue; deterministic via an injectable `now`), refactored the task
  detail page to use it, and added a rose "Overdue" chip to the dashboard "Active
  tasks" list — so a blown deadline reads the same before and after you drill in.
  +6 tests (98 total). (`lib/tasks.ts`, `lib/tasks.test.ts`, `app/tasks/[id]/page.tsx`,
  `app/dashboard/page.tsx`)
- **2026-06-27 — Overdue signal on the task detail page.** Re-walked the *track*
  stage: the state-aware `TaskActions` ("What happens next" headline + hint, the right
  primary action per status, validation-failed handling, settled-delight banner) was
  already excellent — no change needed. Added the one missing clarify-state signal: an
  in-flight task past its deadline now reads "**Overdue —** 2 days ago" in rose instead
  of a muted "Due 2 days ago" that's easy to miss (terminal completed/cancelled tasks
  are never flagged). (`app/tasks/[id]/page.tsx`)
- **2026-06-27 — Empty/zero states audit + all-zero chart fix.** Re-walked the core
  surfaces: marketplace ("No agents match your filters" + Clear filters), every
  dashboard section (active tasks, payments, marketplace activity, reputation, owned
  agents), and the chart no-rows case were already excellent. Found and fixed the one
  real gap: `DashboardChart` treated an all-zero dataset as "has data," so a brand-new
  account saw a flat line hugging the axis (reads as broken) — it now shows the "No
  data to display yet" placeholder unless at least one real value exists.
  (`components/dashboard/dashboard-chart.tsx`)
- **2026-06-27 — Test the remaining `lib/utils` helpers (coverage arc complete).**
  Extended `lib/utils.test.ts` with 12 tests for the string helpers the UI leans on:
  `slugify` (lowercase + hyphenate, strips punctuation, collapses whitespace runs,
  trims stray separators — and pinned the real quirk that underscores are *removed*,
  not hyphenated), `initials` (first letters of up to two words, empty → empty),
  `truncate` (short untouched; clips + ellipsis, trimming the trailing space),
  `pluralize` (singular only at 1, explicit plural honored), and `mockHash` (stable
  per seed, carries its prefix, varies by seed). Pure-logic coverage arc complete:
  **92 tests across 8 files** (utils, schemas, contract, mockValidation, reputation,
  A2A, MCP, x402). (`lib/utils.test.ts`)
- **2026-06-27 — Test the x402 payment adapter (interop arc complete).** Added
  `lib/payments/x402Adapter.test.ts` — 9 tests: `createPaymentRequirement` (well-formed
  `x402-mock` challenge + sensible defaults, custom currency/payTo/description, a
  deterministic hex nonce keyed on task+amount, a future expiry), `verifyPayment`
  (non-negative verified, negative rejected), and `releasePayment`/`refundPayment`
  (ok receipt, `0x…` transaction hashes that are deterministic and operation-distinct,
  currency honored). Completes A2A + MCP + x402 coverage. 80 tests pass.
  (`lib/payments/x402Adapter.test.ts`)
- **2026-06-27 — Test the MCP interop adapter.** Added `lib/interop/mcpAdapter.test.ts`
  — 10 tests: `listToolsForAgent` (one tool per capability, snake_case tool name via
  slugify, valid object inputSchema requiring `input`, capability+category+MCP in the
  description, empty-in → empty-out) and `validateMcpServer` (missing URL → "not
  configured", well-formed http/https accepted with toolCount 1, malformed rejected,
  protocol version always present). 71 tests pass. (`lib/interop/mcpAdapter.test.ts`)
- **2026-06-27 — Test the A2A interop adapter.** Agent-to-agent interop is the
  headline promise, so its mock transforms now have a safety net. Added
  `lib/interop/a2aAdapter.test.ts` — 10 tests: `getAgentCard` (slug → `agent_…`
  id, pricing/trust shape, null-endpoint + `{}`-schema defaults, pass-through when
  present), `createTaskMessage` (well-formed `task/create` envelope, title+objective
  merged into one text part, data part appended only with a payload), and
  `parseArtifactMessage` (round-trips text/data/file parts, treats any url-bearing
  part as the file, falls back to nulls). 61 tests pass. (`lib/interop/a2aAdapter.test.ts`)
- **2026-06-27 — Decouple + test the reputation blend math.** Extracted the
  weighted-average update logic out of the Prisma-coupled `recalculateAgentStats`
  into a pure `computeStatsUpdate(current, event)` (the async wrapper now just
  fetches + persists), so the core math is unit-testable. Added `lib/reputation.test.ts`
  — 9 tests: a completion nudges the rate toward 100 and weights by history (a
  newcomer moves far more than a veteran), a dispute pushes completion down /
  dispute up, a review pulls the average toward the new rating (and barely moves an
  established average — history dampening), plus `REPUTATION_DELTAS` sign/▿review
  mapping (5★ = +3, 1★ = −1). 51 tests pass. (`lib/reputation.ts`, `lib/reputation.test.ts`)
- **2026-06-27 — Test `lib/mockValidation` (the artifact-scoring gate).** Added
  `lib/mockValidation.test.ts` — 8 tests: `computeValidationScore` is deterministic,
  always lands in [70, 99], and varies by seed; `runMockValidation` hard-fails (score
  0, single check) when no artifact is present, is deterministic, derives its score
  from the `task:artifact` seed, keeps `status`/`passed`/threshold in agreement, and
  the 80 threshold actually bites (both pass and fail outcomes occur across seeds).
  42 tests pass total. (`lib/mockValidation.test.ts`)
- **2026-06-27 — Test `lib/contract` (the task-structuring transform).** Added
  `lib/contract.test.ts` — 8 tests pinning `buildStructuredContract`: it's
  deterministic (same input → identical contract via deep equal), defaults the
  category to Research, selects a category-specific output schema (and falls back
  to a generic one for unknown categories), derives the title (trimmed, capitalized,
  first clause, max 9 words), echoes a trimmed objective, honors a positive budget
  else defaults to 25, and always emits the 5-step plan + required `objective`
  input. 34 tests pass total. (`lib/contract.test.ts`)
- **2026-06-27 — Test `lib/schemas` (the validation contract).** Added a `@/`
  path alias to a new `vitest.config.ts` (so tests import modules the way the app
  does) and `lib/schemas.test.ts` — 16 tests covering the zod contracts that guard
  every form + the public API: `createAgentSchema` (name/capability minimums,
  category enum, price coercion), `createTaskSchema` (title min, target required),
  `reviewSchema` (rating clamped 1–5, coercion), and `apiCreateTaskSchema`
  (positive budget required, snake_case accepted). 26 tests pass total.
  (`vitest.config.ts`, `lib/schemas.test.ts`)
- **2026-06-27 — Test suite (Vitest) + first tests.** The app had zero automated
  tests; added Vitest + a `test` script + `lib/utils.test.ts` (10 passing tests
  across the currency/percent/rating/number/latency/compact/relative-time
  formatters). A foundation to protect the 50+ changes from regressions.
  (`package.json`, `lib/utils.test.ts`)
- **2026-06-27 — Copy share link.** Added a right-aligned "Copy link" button
  (reusing `CopyButton` with the canonical URL) to the agent profile and task
  detail breadcrumbs, so a page is one click to share.
  (`app/agents/[id]/page.tsx`, `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Brand mark on the OG images.** Replaced the "A" tile with the
  hexagon brand mark in the default + per-agent + per-task OG images, so every
  shared card carries the real mark. Brand identity is now consistent across the
  favicon, apple-icon, OG cards, and the in-app wordmark. (3 files)
- **2026-06-27 — Brand-mark consistency (apple-icon).** Replaced the "A"
  placeholder in the apple touch icon with the hexagon brand mark (matching the
  favicon + wordmark). Also verified the codebase is clean: no stray console.logs,
  external links already carry `rel="noopener noreferrer"`, and every page has its
  own metadata. (`app/apple-icon.tsx`)
- **2026-06-27 — Autofocus the create forms.** The first field focuses on load on
  /tasks/new (task title) and /agents/new (agent name), so you can start typing
  immediately on these single-purpose create pages.
  (`app/tasks/new/task-form.tsx`, `app/agents/new/agent-form.tsx`)
- **2026-06-27 — Theme-aware color-scheme.** Set `color-scheme: light` on `:root`
  and `color-scheme: dark` on `.dark` in globals.css so native controls/scrollbars
  follow the theme toggle (fixing light-mode widgets rendering dark); the static
  viewport colorScheme stays as the pre-paint default. (`app/globals.css`)
- **2026-06-27 — One source of truth for color-scheme.** Removed the local
  `[color-scheme:dark]` override on the task form's date input now that
  `colorScheme: "dark"` is global. (`app/tasks/new/task-form.tsx`)
- **2026-06-27 — colorScheme: dark.** Added `colorScheme: "dark"` to the root
  viewport so native UI (form controls, scrollbars, date pickers) renders in dark
  mode, matching the dark-first design. (`app/layout.tsx`)
- **2026-06-27 — Fix broken skip-link targets.** The step-36 LandingNav skip link
  points at `#main-content`, but several LandingNav pages lacked that id (404,
  agents/new, and the marketplace/agent/developers loading/error/not-found states).
  Added `id="main-content"` to all of them so the skip link works everywhere. Also
  reviewed the landing copy and left it as-is (intentional, already crisp). (8 files)
- **2026-06-27 — Marketplace search keyboard hint.** Added `enterKeyHint="search"`
  to the marketplace filter's search input (which already debounces into `?q` and
  reflects it), matching the hero. (`components/marketplace/marketplace-filters.tsx`)
- **2026-06-27 — Hero search (verified) + mobile keyboard hint.** Confirmed the
  landing hero search already submits to `/marketplace?q=` (Enter + popular chips
  work); added `enterKeyHint="search"` so the mobile return key reads "Search".
  (`components/landing/hero-search.tsx`)
- **2026-06-27 — Canonical URLs.** Agent pages now declare `alternates.canonical`
  to the slug URL (agents are reachable by id and slug) and tasks to their id URL,
  so crawlers consolidate the variants. (`app/agents/[id]/page.tsx`,
  `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Layout-stable loading (agent profile).** The hire-card skeleton
  predated the "What you can ask" block — added a matching placeholder so the
  sidebar height matches on load. (Swept the other skeletons; only marketplace +
  agent had drifted.) (`app/agents/[id]/loading.tsx`)
- **2026-06-27 — README refresh.** Added a "Craft & polish" section documenting the
  loop's experience work — frictionless hiring, ⌘K/"/" palette, copy affordances,
  humane timestamps, marketplace flow, shareable/SEO cards, and a11y. (`README.md`)
- **2026-06-27 — Layout-stable loading (marketplace).** Updated the marketplace
  card skeleton's footer to include a price + Hire-button placeholder (it had
  drifted after the Hire button was added), so the skeleton matches the real card
  height — no shift on load. (`app/marketplace/loading.tsx`)
- **2026-06-27 — Noindex private operator pages.** Added `robots: { index: false }`
  to dashboard, seller, and admin (and gave admin a proper title), so search
  engines skip operator-only views while the public pages stay indexable.
  (`app/dashboard/page.tsx`, `app/seller/page.tsx`, `app/admin/page.tsx`)
- **2026-06-27 — Per-task OG image.** Added a dynamic
  `app/tasks/[id]/opengraph-image.tsx` rendering the task title, objective snippet,
  category, and status — DB-guarded — so shared task links get a personalized card,
  matching agents. (`app/tasks/[id]/opengraph-image.tsx`)
- **2026-06-27 — Per-agent OG image.** Added a dynamic
  `app/agents/[id]/opengraph-image.tsx` (ImageResponse) rendering the agent's name,
  tagline, and category over the brand backdrop — DB-guarded with a generic
  fallback — so a shared agent link gets a personalized card.
  (`app/agents/[id]/opengraph-image.tsx`)
- **2026-06-27 — Skip links on all public pages.** Moved the skip link into
  `LandingNav` (DRY), removed the home page's now-duplicate one, and added
  `id="main-content"` to the marketplace, agent, and developers mains — so every
  public page is keyboard-skippable (AppShell pages were already covered).
  (`components/layout/landing-nav.tsx` + 4 pages)
- **2026-06-27 — Viewport themeColor.** Added `export const viewport` to the root
  layout (`themeColor: "#17151c"`) so the mobile browser chrome matches the
  dark-first UI. (`app/layout.tsx`)
- **2026-06-27 — Structured data (JSON-LD).** The agent profile now emits a
  schema.org `Product` JSON-LD script — name, description, category, offers
  (price/currency), aggregateRating (rating + review count), `<`-escaped — so
  agents can surface as rich results. (`app/agents/[id]/page.tsx`)
- **2026-06-27 — Sitemap + robots.** Added `app/sitemap.ts` (static routes + all
  active agent profiles, generated per-request and DB-guarded) and `app/robots.ts`
  (allow crawl, point to the sitemap) so search engines can discover the
  marketplace. (`app/sitemap.ts`, `app/robots.ts`)
- **2026-06-27 — Apple touch icon.** Added `app/apple-icon.tsx` (brand tile,
  180×180) for iOS home-screen / dock, completing the icon set (favicon + manifest
  + apple). Confirmed all icon-only controls already have aria-labels/sr-only, so
  no a11y churn. (`app/apple-icon.tsx`)
- **2026-06-27 — "Similar agents" on the profile.** Added a `getRelatedAgents`
  query + a "More in {category}" grid (same category, by reputation, excluding the
  current agent) at the bottom of the agent profile, so buyers keep discovering.
  (`lib/data.ts`, `app/agents/[id]/page.tsx`)
- **2026-06-27 — Large Twitter cards.** Upgraded the Twitter card to
  `summary_large_image` across the root layout, agent, and task pages, so X/Twitter
  renders the OG image as a large card. (`app/layout.tsx`, `app/agents/[id]/page.tsx`,
  `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Default OG image.** Added `app/opengraph-image.tsx` (Next.js
  ImageResponse, system font, brand gradient + wordmark + tagline) so shared links
  show a branded 1200×630 image card, not just text. (`app/opengraph-image.tsx`)
- **2026-06-27 — Removable filter chips on the marketplace.** Active filters
  (search, category, pricing, rating, verified) now render as chips with an ×,
  each linking to the query minus that one filter — remove one at a time, or
  "Clear all". Replaced the static descriptor text. (`app/marketplace/page.tsx`)
- **2026-06-27 — Web app manifest.** Added `app/manifest.ts` (name, short_name,
  description, brand theme/background colors, SVG icon) so Agent Market is
  installable and presents a proper identity. (`app/manifest.ts`)
- **2026-06-27 — Branded favicon.** Added `app/icon.svg` (the hexagon brand mark
  in brand purple) so the browser tab shows the Agent Market identity instead of
  the default Next.js icon. (Confirmed both detail pages already have breadcrumbs
  — no churn.) (`app/icon.svg`)
- **2026-06-27 — Skip link on the landing layout.** Mirrored the "Skip to main
  content" link on the public landing page (→ `#main-content`), so the marketing
  pages are keyboard-navigable too. (`app/page.tsx`)
- **2026-06-27 — Skip-to-content link.** Added a keyboard/screen-reader "Skip to
  main content" link as the app shell's first focusable element (visible on
  focus), jumping past the sidebar to `#main-content`. (Confirmed the developers
  page is already fully copyable via CodeBlock/JsonViewer and the nav already
  highlights the active route — no churn.) (`components/layout/app-shell.tsx`)
- **2026-06-27 — Consistent siteName on detail previews.** Added
  `siteName: "Agent Market"` to the agent and task `openGraph`, so their shared
  previews carry the brand like the site default. (`app/agents/[id]/page.tsx`,
  `app/tasks/[id]/page.tsx`)
- **2026-06-27 — Press / to search.** The command palette now also opens on `/`
  (when not typing in a field), matching the familiar GitHub-style shortcut
  alongside ⌘K. (`components/layout/search-command.tsx`)
- **2026-06-27 — Metadata foundation + title-suffix fix.** Removed the
  `%s · Agent Market` title template that was double-branding every sub-page
  ("Dashboard — Agent Market · Agent Market"); pages now render their own
  fully-branded titles. Added a default Open Graph + Twitter card (siteName, type
  website) so pages without their own inherit a clean social baseline.
  (`app/layout.tsx`)
- **2026-06-27 — Rich previews for shared tasks.** The task detail page now emits
  Open Graph + Twitter metadata (title + objective), matching the agent profile —
  shared task links preview cleanly. (`app/tasks/[id]/page.tsx`)
- **2026-06-27 — Rich link previews for agents.** The agent profile now emits Open
  Graph + Twitter card metadata, so a shared agent link renders a proper
  title/description preview. (Also confirmed the A2A card — and every JSON block —
  is already copyable via `JsonViewer`'s built-in copy, so no redundant button.)
  (`app/agents/[id]/page.tsx`)
- **2026-06-27 — Copy the A2A agent id.** The "Endpoint & interop" section's agent
  id now has a one-click `CopyButton`, so integrators can grab the id they POST to
  `/api/tasks` without hand-selecting. (`app/agents/[id]/page.tsx`)
- **2026-06-27 — Deep-link a scoped contract.** `/tasks/new` now accepts an
  `objective` param (plumbed into the form's defaults), and the agent profile's
  "What you can ask" items are clickable — a tap opens a contract already scoped
  to that agent with a starting objective (plus the category + suggested budget
  from earlier steps). (`app/tasks/new/page.tsx`, `task-form.tsx`,
  `app/agents/[id]/page.tsx`)
- **2026-06-27 — "What you can ask" on the agent profile.** The hire card now
  surfaces the agent's top capabilities as a concise "What you can ask" list right
  at the point of conversion, so a buyer grasps what to hire for before clicking.
  (`app/agents/[id]/page.tsx`)
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

1. **Document testing & CI in the README**. *(NEXT STEP. CI gate now live ✓ — typecheck +
   lint + test + build on every PR.)*
2. **Reassess** — the app is feature-complete + comprehensively tested + CI-gated; prefer
   genuine gaps over make-work (a real missing capability or correctness fix).
3. **Keyboard niceties** — Esc/Enter affordances and focus return in dialogs;
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
