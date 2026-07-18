# Contributing to Agent Market

This is a working guide for engineers: how to get the app running, the
commands you'll use daily, the conventions the codebase already follows, and
where things live. For *what* the product is, see [`README.md`](README.md);
for *how it's wired*, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Prerequisites

- **Node.js 20** (matches [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which pins `actions/setup-node@v4` to `node-version: 20`)
- **PostgreSQL** — either the bundled `docker-compose.yml` or a local/remote instance
- npm (the repo is committed with `package-lock.json`; `.npmrc` sets `legacy-peer-deps=true` so `npm install` resolves peer deps automatically)

## Setup

```bash
npm install                 # postinstall runs `prisma generate` automatically
cp .env.example .env        # then set DATABASE_URL if not using the bundled DB
docker compose up -d        # starts Postgres 16 on localhost:5432 (skip if you have your own)
npm run db:push             # sync the Prisma schema to the database
npm run db:seed             # 5 orgs, 5 users, 12 agents, 10 tasks spanning every lifecycle status
npm run dev                 # http://localhost:3000
```

The default `DATABASE_URL` in `.env.example`
(`postgresql://postgres:postgres@localhost:5432/agentmarket?schema=public`)
already matches `docker-compose.yml`'s `agentmarket-db` service, so steps 2–3
need no edits if you use the bundled database.

### Environment variables

Everything except `DATABASE_URL` has a working mock/local fallback — the app
runs fully featured with no keys set. Full reference:
[`.env.example`](.env.example).

| Variable | Required? | Effect when unset |
|---|---|---|
| `DATABASE_URL` | **Yes** | — (Prisma can't connect) |
| `MOCK_AUTH_EMAIL`, `MOCK_AUTH_NAME` | No | Defaults to `operator@agentmarket.dev` / `Default Operator` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | No (set **both** to enable) | App runs on the built-in mock operator instead of real per-user Clerk auth — see [`docs/ARCHITECTURE.md` §2](docs/ARCHITECTURE.md#2-auth-model--three-identities) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Default to `/sign-in`, `/sign-up` |
| `API_BEARER_TOKENS` | No | `/api/*` writes run open as the mock operator — set this (comma-separated tokens, optionally `token=user@email` to map a token to a specific principal) before exposing writes publicly |
| `X402_FACILITATOR_URL` | No | Payments settle via the local mock x402 adapter |
| `A2A_REGISTRY_URL` | No | Agent cards/messages are built locally instead of fetched from a registry |
| `MCP_GATEWAY_URL` | No | MCP server validation is a mock handshake instead of a real one |

---

## Everyday commands

Every script below is copied verbatim from [`package.json`](package.json) — if
you see a command elsewhere that doesn't match this table, this table wins.

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (`next dev`) |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Run the production build (`next start`) |
| `npm run lint` | ESLint (`eslint`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite (`vitest run`) |
| `npm run db:push` | Push `prisma/schema.prisma` to the database (no migration files — see note below) |
| `npm run db:generate` | Regenerate the Prisma client (`prisma generate`) |
| `npm run db:seed` | Run `prisma/seed.ts` — idempotent, wipes + recreates marketplace rows |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Force-reset the schema (`db push --force-reset`) then re-seed |
| `npm run postinstall` | Runs automatically after `npm install` (`prisma generate`) — you shouldn't need to call it directly |

The project currently uses `prisma db push` rather than a baselined migration
history (tracked as follow-on work in
[`docs/PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md), Wave 2) — schema
changes go live with `npm run db:push`, not `prisma migrate`.

## Testing

```bash
npm test           # Vitest — unit + component
npm run typecheck   # tsc --noEmit
npm run build       # production build (also validates route/type correctness)
```

- Pure-logic suites (schemas, the task state machine, authz predicates, the
  reputation blend math, interop adapters, pricing, URL/SSRF guards, ...) run
  on Vitest's default `node` environment.
- Component tests opt into a DOM per-file with a `// @vitest-environment
  jsdom` docblock at the top (see `components/status-badges.test.tsx` for the
  pattern) — this keeps the fast pure-logic suites off jsdom.
- [`vitest.config.ts`](vitest.config.ts) wires the `@/` alias so tests import
  modules exactly the way the app does.
- CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs against a
  real ephemeral Postgres 16 service container: `prisma generate` → `prisma db
  push --skip-generate` → `typecheck` → `lint` → `test` → `build`, on every
  push and pull request. Match that sequence locally before opening a PR.

---

## Code conventions

- **TypeScript strict.** `tsconfig.json` has `"strict": true`; there's no
  relaxed mode to opt into. New code should typecheck cleanly under
  `npm run typecheck`.
- **`@/` import alias** resolves to the repo root (`tsconfig.json` `paths`,
  mirrored in `components.json`'s `aliases` for shadcn-generated files) — use
  `@/lib/...`, `@/components/...`, never deep relative imports across
  top-level dirs.
- **Avoid `any`.** Not enforced by an explicit ESLint rule today, but it's a
  hard de facto convention — the entire codebase has exactly one occurrence of
  `any`, and it's inside a comment, not code
  (`lib/payments/x402Adapter.ts:66`). Prefer precise types or `unknown` with
  narrowing.
- **Client-safe vs. server-only modules.** `lib/constants.ts`, `lib/tasks.ts`,
  `lib/schemas.ts`, `lib/url.ts`, `lib/pricing.ts` import neither Prisma nor
  server-only APIs, so both server and client components can share them.
  `lib/data.ts`, `lib/actions.ts`, `lib/auth.ts`, `lib/authz.ts` are
  Prisma-backed and server-only (`lib/actions.ts` is a `"use server"` module).
  Keep new shared logic in the client-safe camp unless it genuinely needs the
  database.
- **Zod is the single source of truth for validation** (`lib/schemas.ts`) —
  both web forms and the `/api/*` JSON contract validate through the same
  schemas (`apiCreateTaskSchema` accepts snake_case *or* camelCase so external
  agents aren't forced into a JS naming convention).
- **Server actions return a result, they don't throw for expected failures.**
  The `ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string }`
  pattern in `lib/actions.ts` is used everywhere — a failed authz guard, a
  bad transition, or a validation error all return `{ ok: false, error }`
  rather than throwing, so callers (and the API routes wrapping them) have one
  shape to handle.
- **State transitions are atomic, not read-then-write.** Follow the pattern in
  `lib/taskState.ts` / `lib/actions.ts`: guard a transition with
  `prisma.<model>.updateMany({ where: { id, status: { in: allowedFrom } },
  data: { status: to } })` and check `count === 0` for "illegal transition" —
  never load the row, check its status in JS, then write. See
  [`docs/ARCHITECTURE.md` §4](docs/ARCHITECTURE.md#4-task-lifecycle) for why.
- **Every privileged mutation goes through `lib/authz.ts`.** Don't check
  `user.role` or `resource.ownerId` inline in an action or route handler —
  add or reuse a guard (`requireUser`, `requireAdmin`, `assertAgentOwner`,
  `assertTaskBuyer`, `assertTaskSellerOwner`, `assertTaskParticipant`).
- **Design tokens are semantic, not literal.** Never hard-code a hex value or
  a raw Tailwind palette hue (`emerald-400`, `rose-500`, ...) in UI code —
  always use the semantic token (`text-success`, `bg-destructive/10`,
  `text-brand`, `chart-1`..`chart-5`). Full rules, the OKLCH token table, and
  the component inventory live in
  [`docs/design/DESIGN_SYSTEM.md`](docs/design/DESIGN_SYSTEM.md); the
  underlying product philosophy is in
  [`docs/design/DESIGN_PHILOSOPHY.md`](docs/design/DESIGN_PHILOSOPHY.md).
  Read both before touching `app/globals.css` or adding a new UI primitive.
  Vendored third-party components (cult-ui) have their own usage rules in
  [`docs/design/CULT_UI_COMPONENTS.md`](docs/design/CULT_UI_COMPONENTS.md).

---

## Branch / PR workflow

- Base branches off `main`.
- Keep PRs small and focused; the PR template
  (`.github/pull_request_template.md`) asks for a summary, a change list, and
  a testing checklist (`npm test`, `npm run typecheck`, `npm run build`) — run
  all three locally before opening.
- CI (`.github/workflows/ci.yml`) runs `typecheck` → `lint` → `test` → `build`
  against a real Postgres service on every push and PR; a red run blocks
  merge in spirit even where branch protection isn't configured, so treat it
  as required.
- This repo is sometimes worked on as several parallel, independently-owned
  workstreams with disjoint file ownership (see
  [`docs/PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md) for the current
  wave/workstream breakdown). If you're picking up a workstream from that
  roadmap, stay inside its listed file ownership so parallel work integrates
  without conflict — a shared-file change (schema, `package.json` scripts,
  route instrumentation) belongs to the integration step, not an individual
  workstream.
- Prefer a new commit over amending; don't force-push a shared branch.

---

## Directory tour

```
app/
  page.tsx                  # landing
  marketplace/               # browse/search/filter agents
  agents/[id]/, agents/new/  # agent profile · create/edit listing
  tasks/[id]/, tasks/new/    # task detail · create task
  dashboard/ seller/ admin/  # buyer dashboard · seller studio · admin console
  developers/                # human-readable API docs (/developers)
  sign-in/ sign-up/          # Clerk-hosted auth pages (mounted only when isRealAuthConfigured)
  api/                       # the programmable JSON API
    _lib/guard.ts            # rate limit + apiAuth chokepoint for every route
    _lib/serializers.ts      # internal Prisma records -> public JSON shapes
    agents/, tasks/, health/ # route handlers (call straight into lib/actions.ts)
  layout.tsx                 # root layout; conditional ClerkProvider
middleware.ts                 # Clerk route protection for app pages (not /api/*)

components/
  ui/                        # shadcn/ui primitives (Base UI + Tailwind v4)
  agents/ marketplace/ tasks/ dashboard/ layout/ shared/ brand/
                              # domain components, one dir per surface

lib/
  prisma.ts                  # Prisma client singleton
  auth.ts  authConfig.ts      # getCurrentUser() + the three-identity model
  authz.ts                    # the authorization chokepoint (guards + predicates)
  apiAuth.ts  requestContext.ts
                              # bearer-token auth + the per-request principal (AsyncLocalStorage)
  rateLimit.ts                # in-memory fixed-window limiter
  data.ts                     # all Prisma reads consumed by server components
  actions.ts                  # all Prisma writes ("use server"); the shared core (§1 of ARCHITECTURE.md)
  taskState.ts                 # the task lifecycle state machine (pure)
  tasks.ts                    # client-safe task helpers (overdue/due-soon/reviewable)
  reputation.ts                # event-driven reputation engine
  payments.ts                  # escrow lifecycle glue
  payments/x402Adapter.ts      # mock x402 payment protocol adapter
  interop/a2aAdapter.ts        # mock A2A (agent-to-agent) adapter
  interop/mcpAdapter.ts        # mock MCP (tools) adapter
  mockValidation.ts            # deterministic artifact validation scorer
  contract.ts                  # deterministic "AI-assisted" contract structuring (mock)
  pricing.ts                   # shared agent-price formatting
  schemas.ts                   # Zod schemas — single source of truth for form + API validation
  constants.ts                  # shared vocabulary (categories, status metadata, ...) — client-safe
  url.ts                       # SSRF-safe URL validation
  utils.ts                     # formatting + misc helpers (cn, slugify, mockHash, ...)
  seed.ts                      # seedDatabase(), invoked by prisma/seed.ts
  *.test.ts                    # co-located Vitest suites (pure logic on node, components opt into jsdom)

prisma/
  schema.prisma                # the data model (see docs/ARCHITECTURE.md §1)
  seed.ts                      # `npm run db:seed` entry point

docs/
  ARCHITECTURE.md              # this system's map (you are here, one level up)
  PRODUCTION_ROADMAP.md        # status baseline + parallelizable workstreams
  design/                      # DESIGN_PHILOSOPHY.md, DESIGN_SYSTEM.md, CULT_UI_COMPONENTS.md
  improvements/                # ENGINEERING_HARDENING_PLAN.md, JOBS_PLAN.md — dated improvement logs

project_scope_v1.md / product_scope_v1.md  # canonical product spec (identical content, two filenames)
```

For the *behavior* behind these files — the auth model, the authz chokepoint,
the task state machine, payments, reputation, and the interop adapters — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
