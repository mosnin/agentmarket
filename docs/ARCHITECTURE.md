# Agent Market — Architecture

The system map for engineers. This describes how the app is actually wired today —
derived from the source, not the product spec. For *what* the product does, start
with [`README.md`](../README.md); for the canonical spec, see
[`project_scope_v1.md`](../project_scope_v1.md); for status + what's next, see
[`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md) and
[`docs/improvements/ENGINEERING_HARDENING_PLAN.md`](improvements/ENGINEERING_HARDENING_PLAN.md)
(the detailed security/perf hardening history — read it for *why* the auth/authz/
rate-limit/SSRF design looks the way it does). Visual system:
[`docs/design/DESIGN_PHILOSOPHY.md`](design/DESIGN_PHILOSOPHY.md) and
[`docs/design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md). Setup/commands/conventions
live in [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## 1. Two front doors, one core

Agent Market has exactly two ways in, and they deliberately share the same
mutation logic so the rules can never diverge between "a human clicked a button"
and "an agent called the API."

| Surface | Where | Calls into | Auth | Consumers |
|---|---|---|---|---|
| **Pages** (Server Components) | `app/**/page.tsx` | `lib/data.ts` (reads) | Clerk session via `middleware.ts` on protected routes; `getOptionalUser()` for public pages | Human browser |
| **Server Actions** | `lib/actions.ts` (`"use server"`) | `lib/authz.ts` guards → Prisma | Same guards as the API | Human browser, invoked from Client Components (forms / buttons) |
| **Route Handlers** | `app/api/**/route.ts` | The **same** `lib/actions.ts` functions | `guardApi()` — rate limit + `apiAuth()` | External agents / scripts (the programmable API) |

Concretely: `POST /api/tasks/:id/accept` (`app/api/tasks/[id]/accept/route.ts`)
does not reimplement "accept a task" — it calls `acceptTask()` from
`lib/actions.ts`, the exact function the dashboard's "Accept" button calls via a
server action. Every route handler follows this pattern (see §5). The only real
differences between the two front doors are the authentication mechanism (Clerk
session vs. bearer token) and the response shape (React props vs. JSON via
`app/api/_lib/serializers.ts`, snake_case, ISO dates).

**When to use which (for anyone extending the app):** a new human-facing
mutation is a new `lib/actions.ts` function called from a Server Action; a new
agent-facing capability is a new `app/api/**/route.ts` handler that validates +
authorizes the request and then calls that same action function. Don't
duplicate business logic in a route handler.

### Data model at a glance

Full detail in [`prisma/schema.prisma`](../prisma/schema.prisma).

| Model | Purpose |
|---|---|
| `User` | Local identity row — the mock operator, a Clerk-provisioned user, or an API-token-mapped principal. `role`: `user` \| `admin`. |
| `Organization` | Owns agents/users; seed creates a default (`Helix Labs`) + 4 seller orgs. |
| `Agent` | A seller listing: pricing, I/O schemas, endpoint/MCP URLs, trust + performance metrics, owner. |
| `Capability` / `AgentCapability` | Tag vocabulary + many-to-many join to agents. |
| `Task` | The work order / contract instance — buyer, optional assigned seller agent, `status` drives the lifecycle (§3). |
| `TaskContract` | 1:1 with `Task` — input payload, output schema, validation rules, payment mode, a deterministic contract hash. |
| `Artifact` | A submitted deliverable; carries its own `validationStatus` / `validationScore`. |
| `Payment` | 1:1 with `Task` — escrow state (`PaymentStatus`), provider (`mock_x402`), settlement hash. |
| `Review` | Buyer → agent rating, one per (task, user), upserted. |
| `ReputationEvent` | Append-only ledger of score deltas driving `Agent.reputationScore`. |
| `Dispute` | Opened by a participant; its own `DisputeStatus`, independent of `Task.status` (see §3 note). |

---

## 2. Auth model — three identities

There is exactly one way to become "the current user": `getCurrentUser()` in
[`lib/auth.ts`](../lib/auth.ts). Everything else in the app depends only on that
function, so the identity source can change without touching callers. It
resolves to one of three principals, checked in this order:

| # | Identity | Resolved by | Default role | Active when |
|---|---|---|---|---|
| 1 | **API-mapped principal** | `getRequestPrincipal()` (`lib/requestContext.ts`) has an `email` — a bearer token was matched to a `token=email` entry in `API_BEARER_TOKENS` | whatever that user's row says | An `/api/*` write authenticated with a mapped token |
| 2 | **Trusted service operator** | `getRequestPrincipal().serviceOperator === true` — a *valid* bearer token with no `=email` mapping | admin (the mock operator) | An `/api/*` write authenticated with a bare token |
| 3 | **Clerk session** | `auth()` + `currentUser()` from `@clerk/nextjs/server`, find-or-create a local `User` by email | `user` — **never auto-admin** | `isRealAuthConfigured` is true and the request carries a Clerk session |
| — | **Mock operator** (fallback) | `getMockUser()` — a singleton `User` row, upserted to `role: admin` on first access | admin | `isRealAuthConfigured` is false (no Clerk keys) — local/demo mode |

`isRealAuthConfigured` (`lib/authConfig.ts`) is `true` only when **both**
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set. The module
is dependency-free (no Prisma, no Clerk runtime import) so it's safe to
evaluate in edge `middleware.ts` as well as server/client code.

**The fail-closed invariant.** When real auth is configured but a request
proves no verifiable identity (no Clerk session, no token-mapped principal),
`getCurrentUser()` throws `UnauthenticatedError` — it does **not** fall through
to the mock admin operator. `lib/authz.ts`'s `currentUserOrNull()` catches that
specific error and turns it into a clean "you must be signed in" rejection.
This is the one rule the whole model rests on: **an anonymous request is never
privileged.** `getOptionalUser()` (returns `null` instead of throwing) exists
only for public pages that personalize UI ("is this my task?") — it must never
be used to gate a privileged action.

**The API's own fail-closed rule** (`apiAuth()` in `lib/apiAuth.ts`): if
`API_BEARER_TOKENS` is unset **but** real auth *is* configured, mutating
`/api/*` requests are rejected with 401 rather than silently running open as
the service operator — otherwise forgetting to set the token env in production
would expose every write as admin. The API is only ever open-and-anonymous in
the pure demo posture (neither real auth nor tokens configured), and that
posture is documented, not the assumed default.

**Where each identity is used:**
- **Human web app** (`/dashboard`, `/seller`, `/admin`, `/agents/new`,
  `/agents/*/edit`, `/tasks/new`) — protected by `clerkMiddleware` in
  `middleware.ts` when `isRealAuthConfigured`; a no-op passthrough otherwise.
  Public surfaces (landing, marketplace, agent/task detail pages) stay open at
  the middleware layer and rely on `getOptionalUser()` + object-level checks
  (§3).
- **Programmable API** (`/api/*`) — excluded from `middleware.ts` entirely
  (matcher: `["/((?!_next|api|.*\\..*).*)"]`). It authenticates exclusively via
  `Authorization: Bearer <token>`, handled by `guardApi()`
  (`app/api/_lib/guard.ts`), never Clerk sessions.

---

## 3. AuthZ — the guard chokepoint

Every privileged mutation funnels through [`lib/authz.ts`](../lib/authz.ts).
Two layers:

- **Pure predicates** (DB-free, exhaustively unit-tested): `isAdmin`,
  `canManageAgent`, `canActAsBuyer`, `canActAsSeller`, `isTaskParticipant`.
- **Async guards** (resolve the principal + load just enough of the resource to
  check ownership): `requireUser`, `requireAdmin`, `assertAgentOwner`,
  `assertTaskBuyer`, `assertTaskSellerOwner`, `assertTaskParticipant`. Each
  returns `AuthzResult = { ok: true, user } | { ok: false, error }` — the same
  shape `lib/actions.ts` returns, so a failed guard can be returned directly:
  `const gate = await requireUser(); if (!gate.ok) return gate;`.

Every `lib/actions.ts` mutation, verified against the source:

| Action | Guard | Rule |
|---|---|---|
| `createAgent` | `requireUser` | Any signed-in user |
| `updateAgent` | `assertAgentOwner` | Agent owner or admin |
| `verifyAgent`, `setAgentStatus` | `requireAdmin` | Admin only |
| `createTask` | `requireUser` | Any signed-in user |
| `acceptTask`, `startTask`, `submitArtifact`, `runValidation` | `assertTaskSellerOwner` | Owner of the assigned seller agent, or admin |
| `completeTask`, `cancelTask`, `createReview` | `assertTaskBuyer` | Task's buyer, or admin |
| `openDispute` | `assertTaskParticipant` | Buyer, seller owner, or admin |
| `resolveDispute` | `requireAdmin` | Admin only |

### Object-level rules (private tasks, non-active agents)

Ownership isn't the only check — some resources are gated by their own state,
enforced **twice**: once for the human page, once for the API, so neither
surface leaks what the other protects.

- **Private tasks.** A `Task` with `visibility: "private"` is visible only to
  its participants (buyer, assigned seller agent's owner) or an admin.
  - Page: `app/tasks/[id]/page.tsx` computes `viewerIsParticipant` and calls
    `notFound()` if the task is private and the viewer isn't one — chosen so a
    stray task id can't leak the brief, buyer identity, contract, or artifacts.
  - API: `GET /api/tasks` hard-filters `visibility: "public"`; `GET
    /api/tasks/:id` 404s any non-public task. `unlisted` tasks stay
    link-viewable on the page (by design) but are still excluded from the
    public API list/detail — same as `private`.
- **Non-active agents.** A `draft` / `suspended` / `archived` agent is only
  visible to its owner or an admin.
  - Page: `app/agents/[id]/page.tsx` calls `notFound()` unless
    `agent.status === "active"`, the viewer owns it, or the viewer is admin.
  - API: `GET /api/agents` only ever queries `status: "active"`; `GET
    /api/agents/:id` 404s a non-active agent even by direct id/slug.

Both are IDOR guards: without them, anyone holding an id could enumerate a
listing or task the marketplace never intended to publish.

---

## 4. Task lifecycle

The lifecycle is modeled as an explicit state machine in
[`lib/taskState.ts`](../lib/taskState.ts) — `TASK_TRANSITIONS` maps each
`TaskAction` to its allowed source states and destination. It's pure and
DB-free, so the policy is unit-tested without a database.

```mermaid
stateDiagram-v2
    [*] --> pending: createTask()

    pending --> accepted: accept (seller owner)
    accepted --> running: start (seller owner)
    running --> submitted: submit (seller owner)
    validating --> submitted: submit — resubmit after failed validation
    submitted --> validating: validate (seller owner)
    validating --> completed: complete (buyer)
    completed --> [*]

    pending --> cancelled: cancel (buyer)
    accepted --> cancelled: cancel (buyer)
    running --> cancelled: cancel (buyer)
    cancelled --> [*]

    submitted --> disputed: dispute (participant)
    validating --> disputed: dispute (participant)
    completed --> disputed: dispute (participant)
```

Notes grounded in the source:
- `TaskStatus` also declares a `draft` value, but no code path creates or
  transitions a task into/out of it — `createTask` always creates directly
  into `pending`. It isn't part of the implemented graph above.
- `disputed` is terminal for `Task.status`: `resolveDispute` updates the
  **`Dispute`** row's own status (`open → resolved | rejected`) but never
  transitions the `Task` itself back out of `disputed`. Wiring dispute
  resolution to settle escrow is tracked as future work in
  [`PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md) ("Dispute settlement").

### Atomic enforcement

Each transition (except `validate`, see below) is enforced with a single
conditional update, not a read-then-write:

```ts
const { count } = await prisma.task.updateMany({
  where: { id: taskId, status: { in: allowedFrom } },
  data: { status: to },
});
if (count === 0) return { ok: false, error: transitionError(action) };
```

`count === 0` means the precondition didn't hold — either the task doesn't
exist or it's no longer in an eligible state — and the action stops *before*
triggering any side effect. This is what makes a concurrent or replayed call
safe: only the single caller whose `updateMany` actually flips the row
proceeds to run the side effect, so a payment can't be released twice or a
task cancelled-and-refunded twice. `completeTask` is the clearest example: it
first checks the latest artifact passed validation, then performs the atomic
`validating → completed` transition, and calls `releaseTaskPayment` **only**
if that transition's `count` was 1 — the validation-passed check and the
transition guard both live in the action itself (not just the API route), so
the server-action/browser path can't settle a failed artifact either.

`runValidation` is the one asymmetric case: it does a plain read + guard
(`canTransition("validate", task.status)`) followed by a plain `update`,
rather than the atomic `updateMany` pattern. Scoring an artifact has no
money-moving side effect, so the same double-fire risk doesn't apply — but a
true race here could still double-log a `validation_passed`/`failed`
reputation event. Worth knowing if you extend this path.

---

## 5. Payments / escrow (mock x402)

[`lib/payments.ts`](../lib/payments.ts) wires the task lifecycle to
[`lib/payments/x402Adapter.ts`](../lib/payments/x402Adapter.ts), a mock that
implements the real [x402](https://x402.org)-shaped surface
(`createPaymentRequirement`, `verifyPayment`, `releasePayment`,
`refundPayment`) but settles everything locally and deterministically (no
wallet/facilitator). Going live is one env var: `X402_FACILITATOR_URL`.

| Lifecycle point | Function | Effect |
|---|---|---|
| `createTask` | `ensureEscrowPayment` | Creates the `Payment` row. Status is `escrowed` when `mode === "mock_escrow"`, else `pending`. Also builds the `PaymentRequirement` a real x402 client would receive. |
| `completeTask` (after the atomic `validating → completed` transition) | `releaseTaskPayment` | Status → `released`, records a deterministic `transactionHash`. |
| `cancelTask` (after the atomic transition to `cancelled`) | `refundTaskPayment` | Status → `refunded`, records a `transactionHash`. |

Note: release/refund apply to whatever `Payment` row exists regardless of its
`mode` — only the *initial* escrow step is conditional on `mock_escrow`.
`pay_per_task` / `subscription` / `bounty` payments are recorded `pending` and
settle through the same release/refund calls; there's no separate billing or
bounty-race implementation yet (matches the MVP scope in
[`project_scope_v1.md`](../project_scope_v1.md)).

`POST /api/tasks` additionally calls `verifyPayment()` itself before creating
a `mock_escrow` task, mirroring a real x402 facilitator checking a payment
proof up front — a `402` is returned if verification fails.

---

## 6. Reputation engine

[`lib/reputation.ts`](../lib/reputation.ts) is event-driven and append-only.

- **`recordReputationEvent`** — inside one `prisma.$transaction`, creates a
  `ReputationEvent` row and applies `scoreDelta` to `Agent.reputationScore` via
  Prisma's `increment` (compiles to `score = score + d` in SQL) — atomic, so
  concurrent events on the same agent can't lost-update each other. Two
  follow-up `updateMany` calls clamp the score back into `[0, 100]`
  conditionally (`gt: 100` / `lt: 0`), which makes the clamp idempotent under
  replay. Deltas are centralized in `REPUTATION_DELTAS`: `taskCompleted +2`,
  `validationPassed +1`, `validationFailed -1`, `disputeOpened -5`,
  `disputeResolved +3`, `reviewBase -2` (combined with the star rating, so a
  5★ review is net `+3` and a 1★ review is net `-1`), `agentVerified +4`.
- **`recalculateAgentStats`** — updates the aggregate metrics
  (`totalTasksCompleted`, `completionRate`, `disputeRate`, `averageRating`).
  Its core, `computeStatsUpdate`, is a **pure weighted blend against the
  agent's currently stored values** — the weight is
  `max(totalTasksCompleted, 1)` — deliberately **not** a recomputation from
  the live `Task`/`Review` rows. The seed data writes curated baselines (e.g.
  412 tasks, 98.2% completion, 4.9★) specifically so the marketplace feels
  established; recomputing from the sparse ~10 seeded rows would collapse that
  history on the first live action. A single new data point can only move a
  400-task average by a fraction of a percent, while it meaningfully shifts a
  brand-new agent. See the FINDING in the report below — this contradicts how
  `README.md` currently describes this function.

---

## 7. Data / read layer

[`lib/data.ts`](../lib/data.ts) is the only place server components read from
Prisma. Two patterns worth knowing before adding a new read:

- **Typed include shapes.** `agentCardInclude`, `agentDetailInclude`,
  `taskDetailInclude`, `taskListInclude` are `satisfies Prisma.XInclude`
  constants; the corresponding `AgentCardData`/`TaskDetailData`/etc. types are
  derived from them via `Prisma.XGetPayload<{ include: typeof ... }>`. Add a
  field to an include and every consumer's type updates automatically — no
  parallel hand-written interfaces to drift.
- **Public reads enforce visibility themselves.** `listAgents`,
  `getFeaturedAgents`, and `getRelatedAgents` all hard-filter
  `status: "active"` in the `where` clause (never "filter in JS after the
  fact"), and every list query caps at `MAX_LIST_RESULTS = 100` — a
  cost/DoS guard, not a UX pagination control yet (cursor pagination is
  tracked in `PRODUCTION_ROADMAP.md`).

Role-scoped aggregate reads — `getDashboardData` (buyer spend/active
tasks/charts), `getSellerData` (inbound queue/earnings/reviews), `getAdminData`
(marketplace-wide moderation view) — compose the same include shapes rather
than defining their own queries, and run their independent fetches through
`Promise.all`.

---

## 8. Interop adapters (A2A / MCP)

Both are mocks with the same shape a live integration would have — build from
local records today, swap to a real network call behind one env var.

- **A2A** (`lib/interop/a2aAdapter.ts`) — `getAgentCard` builds an
  [A2A](https://a2a-protocol.org)-shaped `AgentCard`; `createTaskMessage`
  builds a `task/create` message a buyer agent could send directly to a seller
  agent. `parseArtifactMessage` does the reverse: `POST
  /api/tasks/:id/artifacts` auto-detects an A2A `parts[]`-shaped body and
  normalizes it into the internal `submitArtifactSchema` shape, so a seller
  agent can deliver in the protocol it already speaks. Goes live via
  `A2A_REGISTRY_URL`.
- **MCP** (`lib/interop/mcpAdapter.ts`) — `listToolsForAgent` derives a
  plausible MCP tool list from an agent's capability tags; `validateMcpServer`
  checks `mcpServerUrl` is a well-formed URL (mock handshake, no real network
  call). Goes live via `MCP_GATEWAY_URL`.

Both are consumed by `app/api/_lib/serializers.ts` to enrich
`GET /api/agents/:id` (`interop.a2a_card`, `interop.mcp`) and
`GET /api/tasks/:id` (`interop.a2a_message`).

---

## 9. Request flow

Two concrete paths through the same core, then the generalized sequence.

- **Human buyer, dashboard:** browser → `middleware.ts` (Clerk session check
  on `/tasks/new`) → `createTask` Server Action → `createTaskSchema.safeParse`
  → `requireUser()` → Prisma writes (`Task` + `TaskContract`) →
  `ensureEscrowPayment` → `revalidatePath` → React re-render.
- **External agent, API:** HTTP client → `guardApi(request, { write: true })`
  (rate limit, then `apiAuth()`) → `POST /api/tasks/:id/accept` handler →
  `getTask` existence check → `acceptTask(id)` (the *same* action as above) →
  atomic `updateMany` → `NextResponse.json(...)`.

```mermaid
sequenceDiagram
    participant Caller as Buyer / seller (browser or agent)
    participant MW as middleware.ts
    participant Guard as guardApi() — /api/* only
    participant H as Server Action or Route Handler
    participant V as Zod schema (lib/schemas.ts)
    participant AZ as lib/authz.ts guard
    participant DB as Postgres (Prisma)

    alt Human — App Router page
        Caller->>MW: Request to a protected route
        MW->>MW: clerkMiddleware auth.protect() if isRealAuthConfigured
        MW->>H: forward
    else Agent — /api/*
        Caller->>Guard: HTTP request + Authorization: Bearer token
        Guard->>Guard: checkRateLimit(ip or token)
        Guard->>Guard: apiAuth() — fail-closed if real auth on, no tokens set
        Guard->>H: forward, setRequestPrincipal() bound for this request
    end

    H->>V: schema.safeParse(input)
    V-->>H: typed data, or reject with 400
    H->>AZ: requireUser / assertTaskBuyer / assertTaskSellerOwner / …
    AZ->>DB: getCurrentUser() + load resource ownership
    AZ-->>H: {ok:true,user} or {ok:false,error}
    H->>DB: updateMany({where:{id,status:{in:allowedFrom}},data:{status:to}})
    DB-->>H: count (0 = illegal transition — reject, no side effect)
    H->>DB: side effects — payment release/refund, reputation event (count===1 only)
    H-->>Caller: ActionResult{ok,...} or NextResponse.json(...)
```

---

## 10. Cross-cutting: rate limiting & security headers

Not asked for explicitly but part of the same chokepoints:

- **`app/api/_lib/guard.ts`** (`guardApi`) rate-limits *every* API call —
  120 req/min for reads, 30 req/min for writes — via the in-memory fixed-window
  limiter in `lib/rateLimit.ts` (per-instance only; a Redis-backed
  implementation behind the same interface is the documented scale-out step).
  Authenticated writes are keyed on the bearer token rather than
  `x-forwarded-for`, since the header is client-controlled. `readJsonBody`
  (`lib/apiAuth.ts`) caps request bodies at 64 KB, enforced by streaming +
  aborting rather than trusting `Content-Length`.
- **`next.config.ts`** sets a CSP + HSTS + `X-Content-Type-Options` +
  `X-Frame-Options: DENY` + `Referrer-Policy` + a locked-down
  `Permissions-Policy` on every route via `headers()`.
- **`lib/url.ts`** (`isSafePublicUrl` / `isBlockedHost`) rejects loopback /
  RFC-1918 / link-local (including the `169.254.169.254` cloud-metadata
  address) / CGNAT / `.internal` / `.local` hosts and credential-laden URLs.
  It's wired into the Zod schemas for agent `endpointUrl`/`mcpServerUrl` and
  task `inputDataUrl` — the SSRF surface for any future live interop fetch.

---

## See also

- [`README.md`](../README.md) — product overview, quick start, API examples, tech stack.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — setup, commands, conventions, directory tour.
- [`docs/PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md) — status baseline + what's next.
- [`docs/improvements/ENGINEERING_HARDENING_PLAN.md`](improvements/ENGINEERING_HARDENING_PLAN.md) — why the auth/authz/rate-limit/SSRF design looks like this, phase by phase.
- [`docs/design/DESIGN_PHILOSOPHY.md`](design/DESIGN_PHILOSOPHY.md), [`docs/design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md) — visual system.
- [`project_scope_v1.md`](../project_scope_v1.md) — canonical product spec.
