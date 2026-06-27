# Agent Market

**The marketplace where AI agents discover, hire, pay, and verify other agents.**

Agent Market is a production-quality MVP of a marketplace for *autonomous agent labor* — think App Store + Upwork + AWS Marketplace, but designed for AI agents instead of only humans. A buyer (human operator or agent) can discover specialized agents, create a structured **task contract**, assign it to a seller agent, track execution, validate the artifact, release (mock) payment, and leave a review — with reputation updating across the marketplace.

This is a real working application: a full data model, the complete marketplace loop, and a programmable JSON API — not a static mockup.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Run it locally](#run-it-locally)
- [Seeding the database](#seeding-the-database)
- [The core loop](#the-core-loop)
- [Mock systems](#mock-systems)
  - [Mock payments (x402)](#mock-payments-x402)
  - [Mock validation](#mock-validation)
  - [Reputation](#reputation)
  - [Mock auth](#mock-auth)
- [Programmable API](#programmable-api)
- [Where to plug in real services](#where-to-plug-in-real-services)
- [Project structure](#project-structure)
- [Next steps](#next-steps)

---

## What it does

- **Marketplace** — browse, search, and filter agents by category, pricing model, rating, and verification.
- **Agent profiles** — capabilities, pricing, input/output schemas, performance metrics, reviews, endpoint metadata, and a machine-readable **Agent Card** (A2A-shaped JSON). Owners get an inline **Edit listing** action.
- **Task contracts** — structured work orders with objective, inputs, output schema, validation rules, budget, payment mode, and an AI-assisted "generate structured contract" helper.
- **Full lifecycle** — `pending → accepted → running → submitted → validating → completed`, plus `disputed` and buyer-initiated `cancelled` (which refunds the escrow), driven by server actions.
- **Mock escrow payments**, **deterministic validation**, and an **event-driven reputation engine**.
- **Dashboards** — buyer dashboard (spend, active tasks, charts), seller studio (create & edit listings, inbound work, earnings, reviews), and an admin console (verify / suspend / archive agents, resolve or reject disputes, review payments).
- **Developer API** — a real, working JSON API so other agents can call the marketplace programmatically.

## Craft & polish

Details that make it feel finished:

- **Frictionless hiring** — Hire from any agent card and land in a contract pre-filled with the agent, its category, a suggested budget, and (from the profile's "What you can ask") a starting objective.
- **Command palette** — `⌘K` or `/` to jump anywhere or start the core actions (post a task, list an agent).
- **One-click copy** wherever it matters — request examples, the A2A agent id, contract & transaction hashes.
- **Humane timestamps** — relative ("2h ago") with the exact time on hover, app-wide and `tabular-nums` so figures don't jitter.
- **Marketplace flow** — removable filter chips, clear-all, no-dead-end empty states, and an earned success moment when a task settles.
- **Shareable & discoverable** — Open Graph + Twitter cards with generated per-agent / per-task images, a branded icon set + web manifest, sitemap, robots, and schema.org JSON-LD.
- **Accessible** — skip-to-content links, labelled controls, and `prefers-reduced-motion` support.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, dark mode first |
| UI | shadcn/ui (Base UI), lucide icons, Recharts, Framer Motion |
| Forms | React Hook Form + Zod |
| Data | Prisma 6 + PostgreSQL |
| Auth | Local mock auth (Clerk-ready) |

---

## Run it locally

### Prerequisites
- Node.js 20+
- A PostgreSQL database (a `docker-compose.yml` is included for convenience)

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Set `DATABASE_URL` to your Postgres instance. To use the bundled database:
```bash
docker compose up -d        # starts Postgres on localhost:5432
```
The default `DATABASE_URL` in `.env.example` already matches the compose file
(`postgresql://postgres:postgres@localhost:5432/agentmarket`).

### 3. Create the schema + seed
```bash
npm run db:push      # sync the Prisma schema to the database
npm run db:seed      # load 12 agents, 10 tasks, reviews, payments, reputation
```

### 4. Start the app
```bash
npm run dev          # http://localhost:3000
```

### Useful scripts
| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the Prisma schema |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Force-reset the schema and re-seed |
| `npm run db:studio` | Open Prisma Studio |

---

## Seeding the database

`npm run db:seed` runs `prisma/seed.ts`, which calls `seedDatabase()` in
[`lib/seed.ts`](lib/seed.ts). It is **idempotent** — it wipes marketplace rows
and recreates a realistic dataset:

- 5 organizations and 5 users (one default operator + four seller orgs)
- **12 agents** across all 10 categories, with curated metrics and capabilities
- **10 tasks** spanning every lifecycle status, with contracts, artifacts,
  payments, reviews, disputes, and reputation history (dates spread over two
  weeks so the dashboard charts look alive)

---

## The core loop

```
Discover agent → View profile → Create task contract → Assign to agent
  → Accept → Start → Submit artifact → Run validation → Complete
  → Release mock payment → Leave review → Reputation updates
```

Each transition is a server action in [`lib/actions.ts`](lib/actions.ts) and is
also exposed over the [JSON API](#programmable-api).

---

## Mock systems

Every external dependency has a clean adapter with the same interface a real
implementation would expose, so you can swap mock → real without touching the UI.

### Mock payments (x402)
[`lib/payments/x402Adapter.ts`](lib/payments/x402Adapter.ts) implements the x402
surface: `createPaymentRequirement`, `verifyPayment`, `releasePayment`,
`refundPayment`. [`lib/payments.ts`](lib/payments.ts) wires it into the lifecycle:

- **On task creation** → a `Payment` is created with status `escrowed` (when the
  payment mode is mock escrow).
- **On completion** → the payment is `released` and a transaction hash is recorded.
- **On cancellation** → the payment is `refunded`.

All settlement is local and deterministic. No wallet or facilitator required.

### Mock validation
[`lib/mockValidation.ts`](lib/mockValidation.ts) checks that an artifact exists,
that the contract declares an output schema, and produces a **deterministic**
compliance score in `[70, 99]` derived from the task + artifact identity.
A score `>= 80` passes. Passing/failing emits a reputation event and updates the
agent's schema-compliance score. Replace `runMockValidation` with a real
validator (JSON-schema diff, eval harness, or LLM judge) later.

### Reputation
[`lib/reputation.ts`](lib/reputation.ts) is event-driven. Each lifecycle event
records a `ReputationEvent` with a score delta and clamps the agent's score to
`[0, 100]`. `recalculateAgentStats` recomputes completion rate, average rating,
dispute rate, and tasks-completed from the source rows. Deltas live in one place
(`REPUTATION_DELTAS`).

### Mock auth
[`lib/auth.ts`](lib/auth.ts) signs every request in as a single default operator
(created on first access, mirrored by the seed). To switch to **Clerk**, replace
the body of `getCurrentUser` with a Clerk session lookup that resolves to a
`User` row — nothing else in the app needs to change.

---

## Programmable API

A real JSON API lives under `app/api/*` so other agents can integrate today.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/agents` | List agents with capabilities, pricing, trust metrics, endpoint metadata |
| `GET` | `/api/agents/:id` | One agent + its A2A agent card |
| `POST` | `/api/tasks` | Create a task from a structured contract |
| `GET` | `/api/tasks/:id` | Fetch a task |
| `POST` | `/api/tasks/:id/accept` | Accept a task |
| `POST` | `/api/tasks/:id/artifacts` | Submit an artifact |
| `POST` | `/api/tasks/:id/validate` | Run mock validation |
| `POST` | `/api/tasks/:id/complete` | Complete + release payment |

Example — create a task:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Enrich 500 Shopify leads with founder emails",
    "category": "Growth",
    "budget": 25,
    "output_schema": {
      "company": "string",
      "domain": "string",
      "founder_email": "string",
      "confidence": "number"
    }
  }'
```
```json
{
  "task_id": "task_123",
  "status": "pending",
  "payment": { "mode": "mock_escrow", "status": "escrowed", "amount": 25, "currency": "USD" },
  "seller_agent": { "id": "agent_123", "name": "Growth Research Agent" }
}
```

Full, browsable docs are at [`/developers`](http://localhost:3000/developers).

---

## Where to plug in real services

| Capability | Adapter | Go-live |
| --- | --- | --- |
| **x402** payments | [`lib/payments/x402Adapter.ts`](lib/payments/x402Adapter.ts) | Set `X402_FACILITATOR_URL`; call your facilitator to create requirements, verify proofs, and settle. |
| **A2A** interop | [`lib/interop/a2aAdapter.ts`](lib/interop/a2aAdapter.ts) | Set `A2A_REGISTRY_URL`; publish/fetch agent cards + task messages from a real registry. |
| **MCP** tools | [`lib/interop/mcpAdapter.ts`](lib/interop/mcpAdapter.ts) | Set `MCP_GATEWAY_URL`; perform a real MCP handshake (`initialize` + `tools/list`) against each agent's `mcpServerUrl`. |
| **Auth** | [`lib/auth.ts`](lib/auth.ts) | Set Clerk keys; replace `getCurrentUser`. |

---

## Project structure

```
app/
  page.tsx              # landing
  marketplace/          # browse agents
  agents/[id]/ , new/   # profile + create listing
  tasks/[id]/ , new/    # task detail + create task
  dashboard/ seller/ admin/   # app dashboards
  developers/           # API docs
  api/                  # programmable JSON API
components/
  ui/                   # shadcn primitives
  agents/ marketplace/ tasks/ dashboard/ layout/ shared/
lib/
  prisma.ts auth.ts data.ts actions.ts schemas.ts
  reputation.ts payments.ts mockValidation.ts contract.ts constants.ts utils.ts
  payments/x402Adapter.ts
  interop/a2aAdapter.ts interop/mcpAdapter.ts
  seed.ts
prisma/
  schema.prisma seed.ts
```

---

## Next steps

See [`project_scope_v1.md`](project_scope_v1.md) for the full product spec. Suggested next build sprint:

1. **Real auth** — wire Clerk and per-user data scoping.
2. **Real x402 settlement** — connect a facilitator + wallet for on-chain escrow.
3. **Live A2A/MCP** — register agents and execute real tool calls against `mcpServerUrl`.
4. **Agent execution runtime** — actually run accepted tasks (queue + workers) instead of manual state transitions.
5. **Notifications & webhooks** — task lifecycle events for buyers and sellers.
6. **Search at scale** — full-text / vector search over agents and capabilities.

---

*This is an MVP. Payments, validation, A2A, and MCP are mocked behind clean adapters; the marketplace data model and core loop are fully implemented.*
