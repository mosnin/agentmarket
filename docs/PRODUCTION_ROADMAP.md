# Agent Market — Production Roadmap

Status baseline (verified against a live Postgres 16 instance in this session):

- App boots; every route (`/`, `/marketplace`, `/developers`, `/dashboard`,
  `/seller`, `/admin`, `/tasks/new`, `/agents/new`) returns 200 on real data.
- Public API returns real data; the **full hire→escrow→deliver→validate→settle
  lifecycle works end-to-end** (create → accept → start → submit → validate →
  complete → payment `released` with a settlement hash; reputation increments
  atomically).
- Security audit fixes shipped: auth-fallback escalation closed, API fails
  closed in prod, trust-badge forgery removed, private-task/non-active-agent
  IDOR gated. `tsc` + `eslint` + `next build` + 244 unit tests green.

This roadmap turns "works in the demo" into "production-grade." It is organized
into independent workstreams with **disjoint file ownership** so they can be
built in parallel and integrated without conflict. Shared-file wiring
(package.json scripts, route instrumentation, schema migrations) is owned by the
integrator.

---

## Wave 1 — Scaffolding & platform hardening (parallelizable)

| # | Workstream | Owns (files) | Outcome |
|---|-----------|--------------|---------|
| W1 | **CI pipeline** | `.github/workflows/ci.yml` | typecheck + lint + build + test on every push/PR |
| W2 | **Local dev infra** | `docker-compose.yml`, `docs/RUNBOOK.md` | one-command Postgres + documented bring-up/seed |
| W3 | **Health/readiness** | `app/api/health/route.ts` | liveness + DB-readiness probe for deploys |
| W4 | **Structured logging** | `lib/logger.ts` (+test) | JSON logs w/ request id + level; replaces ad-hoc console.error |
| W5 | **Idempotency store** | `lib/idempotency.ts` (+test) | idempotency-key primitive for POST /api/tasks (dedupe retries) |
| W6 | **Money in integer cents** | `lib/money.ts` (+test) | precise money helpers; foundation to migrate `Float` → cents |
| W7 | **Public reviews API** | `app/api/agents/[id]/reviews/route.ts` | GET an agent's reviews (paginated, public shape) |
| W8 | **Serializer PII-leak tests** | `app/api/_lib/serializers.pii.test.ts` | regression suite proving no email/PII ever leaves the API |
| W9 | **Architecture & contributor docs** | `docs/ARCHITECTURE.md`, `CONTRIBUTING.md` | system map + how to run/test/contribute |
| W10 | **E2E smoke (Playwright)** | `playwright.config.ts`, `e2e/` | headless lifecycle spec against a running instance |

## Wave 2 — Correctness & completeness (integrator-owned, sequential)

These touch hot shared files (schema, actions, constants), so they are done
carefully after Wave 1 integrates:

- **Prisma migrations** — replace `db push` with a baselined migration history;
  add DB `CHECK` constraints (rating 1–5, budget ≥ 0, score 0–100) and a
  `Payment.status` transition guard.
- **Money migration** — move `budget`/`startingPrice`/`amount` to integer cents
  (or `Decimal`) using the W6 helpers; update reads/serializers/forms.
- **Dispute settlement** — wire `resolveDispute` to settle escrow (release to
  seller vs refund to buyer) per outcome; requires a product decision on what
  "resolved/rejected" means, then a state transition + payment move.
- **Idempotency wiring** — apply the W5 primitive to `POST /api/tasks`.
- **Logging wiring** — replace `console.error` in routes/actions with W4 logger.
- **Rate-limit store** — abstract the in-memory limiter behind an interface with
  a Redis-ready adapter (currently per-instance only).

## Wave 3 — Product surface

- API expansion: disputes endpoint, agent CRUD over API, cursor pagination.
- Real-auth E2E: finish Clerk flows, provisioning tests, per-user dashboards.
- Observability: error tracking hook, request tracing, basic metrics.
- Notifications/webhooks for task status changes (the schema already implies A2A
  webhooks).

## Integration protocol

Wave-1 agents create only their owned files, run no git, and self-verify with
`tsc` + targeted `eslint`/`vitest`. The integrator reviews the aggregate diff,
wires the shared-file hooks (package.json scripts, route instrumentation), runs
the full `tsc` + `lint` + `build` + `vitest` gate, and commits in logical chunks.
