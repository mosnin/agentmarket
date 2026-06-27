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

**Empty states — start with marketplace "no results."** With the safety net in
place, return to the experience. Re-walk the core flow and fix the single biggest
unclear/empty state: when a marketplace search + filter combination returns zero
agents, show a clear, friendly empty state ("No agents match your filters") with a
one-click "Clear filters" reset — not a blank grid. If that's already handled well,
fix the next-weakest zero state instead (dashboard with no tasks, seller with no
agents). Lens: clarify state + remove friction. Verify with `npm test` (still
green) + build + types.

> The loop has pivoted to **test coverage** (the app had none). Each iteration:
> add one focused test file for a pure module, run `npm test`, keep build green.

---

## DONE LOG

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

1. **Empty / zero states audit** — start with marketplace "no results" + "Clear
   filters" (NEXT STEP), then any other blank list (dashboard, seller). Clarify
   state + remove friction. *(Pure-logic coverage arc complete: utils ✓ schemas ✓
   contract ✓ mockValidation ✓ reputation ✓ A2A ✓ MCP ✓ x402 ✓ — 92 tests.)*
2. **Re-walk the core flow** (land → browse → hire → contract → track) for the next
   biggest friction once empty states are solid.
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
