# Agent Market — Engineering Hardening Plan (the `/goal`)

> Mandate: think like Archimedes (find the load-bearing lever) × Elon Musk (delete,
> simplify, then optimize). Make the backend high-performance and efficient with
> **enhanced security that does not compromise performance**. Brutal honesty, then
> execute phase by phase, keep the build green, end with an end-to-end audit.

## How this was assessed

- Backend mapped from source: `prisma/schema.prisma`, `lib/{auth,actions,data,prisma,schemas}.ts`,
  `app/api/**`, `app/api/_lib/serializers.ts`, interop adapters, `next.config.ts`.
- No database is reachable in this environment, so the app cannot be run/Playwright'd
  here. UI/UX is assessed from deep familiarity (the prior product-craft loop walked every
  surface). **Verification gate for every phase = `tsc --noEmit` + `next build` + `vitest`**
  (none require a DB; pages are `force-dynamic`). Schema changes are validated with
  `prisma generate`; the actual `prisma db push` is a documented deploy step.

## Architecture map (current)

```
Browser ──▶ Next.js 15 App Router (RSC, force-dynamic everywhere)
            ├─ Server Components ──▶ lib/data.ts        (Prisma reads)
            ├─ Server Actions  ───▶ lib/actions.ts      (Prisma writes, Zod-validated)
            ├─ Route Handlers  ───▶ app/api/**          (JSON agent-to-agent API)
            │                        └─ app/api/_lib/serializers.ts (public shapes)
            ├─ Auth ──────────────▶ lib/auth.ts         (MOCK: always one operator)
            ├─ Interop ───────────▶ lib/interop/{a2a,mcp}Adapter, lib/payments/x402Adapter
            └─ DB ────────────────▶ Prisma 6 ▶ PostgreSQL
```

What's already good (keep it): clean read/write/serialize separation; Prisma singleton;
`React.cache` on the session; Zod on every form action; JSON-LD is correctly escaped;
secrets hygiene is clean (`.env` gitignored, only `.env.example` tracked); 190 passing tests.

---

## Brutal findings

### Security (OWASP-aligned)

| # | Sev | Finding | Evidence | OWASP |
|---|-----|---------|----------|-------|
| S1 | **Critical** | **No real authentication.** `getCurrentUser()` always returns the mock operator; `isRealAuthConfigured` is computed but never consulted. Every visitor *is* the operator. | `lib/auth.ts:21-57` | A07 |
| S2 | **Critical** | **Broken access control on admin actions.** `verifyAgent`, `setAgentStatus`, `resolveDispute` perform privileged mutations with **no role/authz check**. `User` has **no role field** — there is no admin concept. | `lib/actions.ts:138-162, 392+` | A01 |
| S3 | **Critical** | **Unauthenticated, unthrottled state-mutating API.** `POST /api/tasks`, `/accept`, `/validate`, `/complete`, `/artifacts` mutate state with no authn/authz/rate-limit. Anyone can drive any task and release payments. | `app/api/tasks/**` | A01/A07 |
| S4 | **High** | **No authorization in the task lifecycle.** `acceptTask/startTask/submitArtifact/runValidation/completeTask/cancelTask` enforce no buyer/seller boundary — any caller can transition any task. | `lib/actions.ts:228-350` | A01 |
| S5 | **High** | **No rate limiting** anywhere (API or actions). Abuse/DoS/brute-force surface. | all of `app/api/**` | A04 |
| S6 | **High** | **No security headers / CSP.** `next.config.ts` is empty; no middleware. Missing CSP, frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy, HSTS. | `next.config.ts:1-7` | A05 |
| S7 | **Medium** | **SSRF surface.** User-supplied `endpointUrl`/`mcpServerUrl`/`inputDataUrl` are stored and the interop adapters can go "live" against env-configured gateways. No block on private/loopback/link-local hosts. | adapters + schemas | A10 |
| S8 | **Medium** | **No task state-machine.** Transitions set status unconditionally → illegal transitions, double payment release/refund possible. | `lib/actions.ts:228+` | A04 |
| S9 | **Low** | API exposes internal `endpoint.url`/`mcp_server` publicly (by-design for A2A, but should be a conscious, documented choice + gateable). | `serializers.ts:83-86` | A01 |
| S10 | **Low** | API route handlers parse JSON bodies with no size cap before validation. | `app/api/**` POST | A04 |

### Performance / efficiency

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| P1 | **High** | Missing indexes on hot filter columns: `Agent.status` (every listing filters it) and `Agent.ownerId` (Seller Studio). | `schema.prisma:125-167` | add `@@index` |
| P2 | **High** | **Unbounded reads.** `listAgents` has no `take`/pagination — returns every matching row; search runs 4 `ILIKE %x%` scans. | `lib/data.ts:88-128` | paginate + cap; trigram/FTS-ready |
| P3 | **Med** | `getCurrentUser` does **two upserts (writes) on every request**. Read-heavy pages pay 2 writes/request. | `lib/auth.ts:21-44` | findUnique-first, upsert only if missing |
| P4 | **Med** | Sorts on `averageRating/completionRate/startingPrice/createdAt` are unindexed filesorts. | `lib/data.ts:116-125` | targeted/compound indexes |
| P5 | **Med** | `force-dynamic` on public, cacheable pages (landing/marketplace/agent profile) — no caching/ISR. | every `page.tsx` | tag-based caching where safe |
| P6 | **Low** | `createAgent` upserts capabilities one-by-one in sequence (N round-trips). | `lib/actions.ts:75-90` | batch |

### Calibration (the honest part)

This is a **mock-auth demo**. Real auth (Clerk) is scaffolded but unwired, and no auth provider
can be provisioned here. So "world-class secure" is delivered as: **build the rigorous authorization
substrate as a hard chokepoint** (correct-by-construction for when real auth lands), **add a real
admin role**, and **fully harden every non-auth layer** (headers/CSP, rate limiting, SSRF, state
machine, pagination, indexes, body limits). The auth provider becomes a single documented swap point.
We never ship secrets to the browser (verified: zero `NEXT_PUBLIC_` secrets, no `process.env` in
client components beyond a public Clerk publishable key name).

---

## Phased execution (each phase: keep green, commit, push)

- **Phase 1 — Authorization substrate + admin role.** Add `User.role` (`user`/`admin`); seed the
  operator as admin (single-operator demo). New `lib/authz.ts`: `requireUser`, `requireAdmin`,
  `assertAgentOwner`, `assertTaskBuyer`, `assertTaskSellerOwner`, `assertTaskParticipant`. Gate every
  admin action (`verifyAgent`, `setAgentStatus`, `resolveDispute`) and every task-lifecycle action.
  Pure, tested role/guard helpers. (Fixes S2, S4; foundation for S1/S3.)
- **Phase 2 — Task state machine + SSRF/URL hardening.** `lib/taskState.ts` with an allowed-transition
  table; guard every lifecycle action (no illegal transitions, no double settle). `safeUrl` Zod schema
  rejecting private/loopback/link-local hosts; apply to agent endpoint/MCP URLs and task data URL.
  Pure, tested. (Fixes S7, S8.)
- **Phase 3 — API authn + rate limiting + body limits.** `lib/apiAuth.ts` (bearer token → user, mock
  fallback documented) applied to mutating routes; in-memory token-bucket rate limiter
  (`lib/rateLimit.ts`) on all API routes; JSON body size cap. (Fixes S3, S5, S10.)
- **Phase 4 — Security headers + CSP.** `next.config.ts` `headers()` (or `middleware.ts`): HSTS,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`, and a
  pragmatic CSP that doesn't break Tailwind/framer/Next. (Fixes S6.)
- **Phase 5 — Performance.** Add indexes (P1/P4); paginate + cap list reads (P2); findUnique-first
  session (P3); batch capability writes (P6); add safe caching/`revalidate` where it won't break
  correctness (P5). `prisma generate` to keep types green.
- **Phase 6 — End-to-end audit.** Re-verify every phase; run `/security-review`; full
  `tsc + build + vitest`; add coverage for authz/state-machine/URL guards; fix all loose ends; write a
  deploy checklist (DB push, set real auth + API keys).

## Done log

- **Phase 2 — Task state machine + SSRF/URL hardening.** New `lib/taskState.ts` models the lifecycle
  as an explicit transition table (`canTransition`, `allowedFrom`, `transitionError`). Every lifecycle
  action now enforces its transition **atomically** via `updateMany({ where: { id, status: { in:
  allowedFrom } } })` and rejects a `count===0` — so illegal transitions are blocked and a replay can't
  double-release/refund a payment (`completeTask`/`cancelTask`/`submitArtifact`/`accept`/`start`/
  `dispute`; `runValidation` uses a read+`canTransition` guard around its artifact check). New
  `lib/url.ts` (`isBlockedHost`, `isSafePublicUrl`) rejects non-http(s), loopback, RFC-1918,
  link-local incl. `169.254.169.254`, CGNAT, `.internal`/`.local`, IPv6 ULA/link-local and
  credential-laden URLs; wired into the shared `optionalUrl` (agent endpoint/MCP, task data URL,
  artifact URL) and the API `input_data_url`. Fixes **S7, S8**. +17 tests (214 total). tsc + build
  green. Files: `lib/taskState.ts(.test)`, `lib/url.ts(.test)`, `lib/schemas.ts`, `lib/actions.ts`.

- **Phase 1 — Authorization substrate + admin role.** Added `User.role` (`user`/`admin`) +
  `UserRole` enum; the demo operator is seeded/upserted as `admin` (documented as demo-only).
  New `lib/authz.ts` with pure, tested policy predicates (`isAdmin`, `canManageAgent`,
  `canActAsBuyer`, `canActAsSeller`, `isTaskParticipant`) and async guards (`requireUser`,
  `requireAdmin`, `assertAgentOwner`, `assertTaskBuyer`, `assertTaskSellerOwner`,
  `assertTaskParticipant`). Every privileged server action now funnels through a guard: admin
  actions (`verifyAgent`, `setAgentStatus`, `resolveDispute`) require admin; the task lifecycle
  enforces buyer/seller boundaries; `updateAgent` reuses `assertAgentOwner`. Fixes **S2, S4**;
  lays the chokepoint for S1/S3. +7 tests (197 total). tsc + build green. (Deploy step: `prisma db
  push` to add the `role` column.) Files: `prisma/schema.prisma`, `lib/auth.ts`, `lib/authz.ts`,
  `lib/authz.test.ts`, `lib/actions.ts`, `lib/seed.ts`.
