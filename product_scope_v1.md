# Agent Market — Project Scope v1

> Canonical product specification and source of truth for the Agent Market MVP.
> Audits and reviews validate the implementation **exactly** against this document.
> (Also mirrored as `product_scope_v1.md`.)

---

## 1. Product Overview

**Agent Market** is a marketplace where AI agents can **discover, hire, rate, pay, and sell work to each other**. Think App Store + Upwork + AWS Marketplace, but designed for autonomous agents instead of only humans.

The goal is a polished, production-quality **Next.js** application that proves the core loop:

1. A buyer can discover agents
2. A seller can list an agent
3. A buyer can create a task
4. A seller agent can accept the task
5. The system can track task execution
6. The buyer can review the output
7. The task can be marked complete
8. Reputation updates on the agent profile

This must be a **real working application, not a static mockup**.

### Core positioning
> The marketplace where AI agents discover, hire, pay, and verify other agents.

---

## 2. Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Clerk **or local mock auth** if Clerk is not configured
- React Hook Form
- Zod
- Lucide icons
- Recharts (where charts are useful)
- Framer Motion (if available)
- **Dark mode first**
- **Responsive design**

If any external service is not configured, create **clean mock adapters with the same interface** so they can be replaced later.

Do not overcomplicate the first version. Build a strong MVP with clean architecture, excellent UI, and extensible backend models.

---

## 3. Visual Style

- Premium technical marketplace
- Dark mode first
- Clean SaaS dashboard
- High contrast
- Apple-level spacing
- Vercel-style polish
- Linear-style data density
- Subtle gradients
- Subtle glass panels
- **No** cheap crypto design
- **No** cartoonish AI robot aesthetic

---

## 4. Primary Users

1. Human operators who own agents
2. Buyer agents looking for specialized agents
3. Seller agents offering tasks, tools, or skills
4. Organizations managing multiple agents

---

## 5. Main Objects

1. Agent
2. Capability
3. Marketplace listing
4. Task
5. Task contract
6. Artifact
7. Payment record
8. Review
9. Reputation event
10. Organization

### Core concept

An agent is **not just a profile**. It is a machine-readable service with capabilities, schemas, pricing, endpoint metadata, trust scores, task history, and reviews.

A task is **not just a message**. It is a structured work contract with objective, inputs, outputs, price, validation rules, status, artifacts, and payment state.

### Lifecycle

Discover agent → View agent profile → Create task contract → Assign task to agent → Track task execution → Submit artifact → Validate artifact → Complete task → Release mock payment → Leave review → Update reputation.

---

## 6. Pages

### 6.1 Landing page — `/`
Sections: Hero, Search bar, Featured agents, How it works, Marketplace categories, Trust and verification section, For buyers, For sellers, Developer API teaser, CTA.

Hero copy:
> The marketplace for autonomous agent labor
> Discover, hire, pay, and verify specialized AI agents through one programmable marketplace.

CTA buttons: **Explore agents**, **List your agent**.

Should feel like a serious infrastructure company. Strong visual hierarchy and a polished hero.

### 6.2 Marketplace page — `/marketplace`
Browse all listed agents.

Features: search by name/capability/category; filter by category, pricing model, rating, verification status; sort by reputation, price, completion rate, newest.

Agent cards show: name, short description, category, capabilities, rating, reputation score, completion rate, starting price, average latency, verified badge, owner organization, CTA to view profile.

Categories: Growth, Research, Coding, Data, Design, Operations, Finance, Security, Customer Support, Infrastructure.

### 6.3 Agent profile page — `/agents/[id]`
Sections: Header (name, category, verification badge, reputation score), Description, Capabilities, Pricing, Input schema preview, Output schema preview, Performance metrics, Recent tasks, Reviews, Artifacts examples, Endpoint metadata, CTA to hire agent.

Important metrics: completion rate, average rating, total tasks completed, average response time, dispute rate, schema compliance score.

Include a **machine-readable tab** showing an Agent Card, e.g.:
```json
{
  "agent_id": "agent_growth_researcher",
  "name": "Growth Research Agent",
  "capabilities": ["lead_research", "competitor_mapping", "market_scan"],
  "pricing": { "model": "per_task", "starting_price": 25 },
  "input_schema": {},
  "output_schema": {},
  "trust": { "verified": true, "reputation_score": 94 }
}
```

### 6.4 Create task page — `/tasks/new`
Create a structured task contract for an agent.

Form fields: Task title, Objective, Category, Target agent, Input instructions, Input data URL (optional), Expected output format, Budget, Deadline, Validation rules, Payment mode, Visibility.

Payment modes: Mock escrow, Pay per task, Subscription access, Bounty.

On submit: create task → create task contract → set status to `pending` → redirect to task detail page.

Include **AI-assisted task structuring** as a mock feature: a **Generate structured contract** button that transforms the objective into a structured contract preview using a deterministic local mock function.

### 6.5 Task detail page — `/tasks/[id]`
Show: title, status, buyer, seller agent, objective, input payload, output requirements, budget, payment state, validation rules, timeline, artifacts, actions based on state.

Task statuses: `draft`, `pending`, `accepted`, `running`, `submitted`, `validating`, `completed`, `disputed`, `cancelled`.

Actions: Accept task, Start task, Submit artifact, Run validation, Complete task, Open dispute, Leave review. Driven by server actions or API routes.

### 6.6 Dashboard page — `/dashboard`
Show: Overview cards, Active tasks, Recent payments, Agent performance, Marketplace activity, Reputation changes.

Cards: Total spend, Total earnings, Active tasks, Agents owned, Average reputation, Tasks completed.

Charts: Task volume by day, Revenue by category, Agent reputation trend.

### 6.7 Seller dashboard — `/seller`
Let agent owners manage listings.

Features: View owned agents, Create new listing, Edit listing, See inbound tasks, See earnings, See reviews, See performance metrics.

### 6.8 Create agent page — `/agents/new`
Form fields: Agent name, Short description, Long description, Category, Capabilities, Pricing model, Starting price, Endpoint URL, MCP server URL (optional), Input schema JSON, Output schema JSON, Owner organization, Verification status (default false).

After submit: create listing → redirect to agent profile.

### 6.9 Developer API docs page — `/developers`
Docs for the programmable API. Endpoints:
```
GET  /api/agents
GET  /api/agents/:id
POST /api/tasks
GET  /api/tasks/:id
POST /api/tasks/:id/accept
POST /api/tasks/:id/artifacts
POST /api/tasks/:id/validate
POST /api/tasks/:id/complete
```
Example request:
```json
{
  "objective": "Enrich 500 Shopify leads with founder emails",
  "category": "Growth",
  "budget": 25,
  "output_schema": {
    "company": "string",
    "domain": "string",
    "founder_email": "string",
    "confidence": "number"
  }
}
```

### 6.10 Admin page — `/admin`
Moderate the marketplace. Features: View agents, Verify agents, View disputes, View suspicious tasks, View payments, View reputation events.

---

## 7. Database Schema (Prisma)

Models: `User`, `Organization`, `Agent`, `Capability`, `AgentCapability`, `Task`, `TaskContract`, `Artifact`, `Payment`, `Review`, `ReputationEvent`, `Dispute`.

**User:** id, email, name, image, createdAt, updatedAt
**Organization:** id, name, slug, description, createdAt, updatedAt
**Agent:** id, name, slug, shortDescription, longDescription, category, status, verified, endpointUrl, mcpServerUrl, pricingModel, startingPrice, currency, averageRating, reputationScore, completionRate, averageLatencyMinutes, schemaComplianceScore, disputeRate, totalTasksCompleted, ownerId, organizationId, createdAt, updatedAt
**Capability:** id, name, slug, description, category, createdAt, updatedAt
**AgentCapability:** id, agentId, capabilityId
**Task:** id, title, objective, category, status, visibility, budget, currency, deadline, buyerId, sellerAgentId, createdAt, updatedAt
**TaskContract:** id, taskId, inputPayload, outputSchema, validationRules, paymentMode, successCriteria, contractHash, createdAt, updatedAt
**Artifact:** id, taskId, title, type, url, content, validationStatus, validationScore, createdAt, updatedAt
**Payment:** id, taskId, amount, currency, status, mode, provider, transactionHash, createdAt, updatedAt
**Review:** id, taskId, agentId, userId, rating, comment, createdAt, updatedAt
**ReputationEvent:** id, agentId, taskId, type, scoreDelta, reason, createdAt
**Dispute:** id, taskId, openedById, reason, status, resolution, createdAt, updatedAt

---

## 8. Seed Data

At least **12 agents**:

| Agent | Category | Capabilities | Price | Reputation |
|---|---|---|---|---|
| Growth Research Agent | Growth | lead research, competitor mapping, market scan | 25 | 94 |
| Code Review Agent | Coding | code review, test generation, bug detection | 15 | 91 |
| SEO Audit Agent | Growth | technical SEO, content gap analysis, metadata generation | 20 | 88 |
| Data Cleaning Agent | Data | CSV cleanup, deduplication, schema mapping | 10 | 86 |
| Security Scan Agent | Security | dependency audit, secret detection, vulnerability report | 35 | 92 |
| Research Synthesis Agent | Research | source gathering, citations, executive brief | 30 | 90 |
| Landing Page Critique Agent | Design | UX audit, conversion review, copy critique | 18 | 84 |
| CRM Update Agent | Operations | CRM sync, lead routing, data entry | 8 | 82 |
| Support Triage Agent | Customer Support | ticket classification, response drafting, sentiment tagging | 12 | 87 |
| Financial Analysis Agent | Finance | transaction categorization, cash flow report, variance analysis | 28 | 89 |
| Infra Monitor Agent | Infrastructure | uptime checks, log summary, incident report | 22 | 85 |
| Outbound Personalization Agent | Growth | cold email personalization, prospect research, sequence generation | 16 | 93 |

At least **8 sample tasks** with different statuses.

---

## 9. UI Requirements

Consistent app shell. Sidebar for dashboard sections. Top nav for marketplace pages. Mobile responsive. Empty states, loading states, error states. Status badges. Cards, tables, tabs, dialogs, dropdowns. Polished visual hierarchy. No default ugly forms. No placeholder lorem ipsum. Every page intentional.

### Core components
`AgentCard`, `AgentProfileHeader`, `CapabilityBadge`, `ReputationScore`, `TaskStatusBadge`, `TaskTimeline`, `PaymentStatusBadge`, `TaskContractPreview`, `ArtifactCard`, `ReviewCard`, `MetricCard`, `DashboardChart`, `MarketplaceFilters`, `JsonViewer`, `EmptyState`, `PageHeader`, `AppShell`, `LandingNav`, `SearchCommand`.

---

## 10. API Routes / Server Actions

Create agent, Update agent, List agents, Get agent, Create task, Update task status, Submit artifact, Run mock validation, Complete task, Create review, Verify agent, Create dispute.

---

## 11. Mock Logic

### Validation
When validation runs: check artifact exists; check output schema exists; generate deterministic validation score between 70 and 99; status `passed` if score >= 80; add reputation event; move task status to `validating`, then `submitted` or `completed` based on action.

### Payment
On task creation: create payment with status `escrowed` if payment mode is mock escrow.
On task completion: set payment status to `released`; create reputation event.

### Reputation
On task completed: increase `totalTasksCompleted`; recalculate `completionRate`; update `averageRating` if a review exists; increase reputation score slightly; decrease score if a dispute is opened.

---

## 12. Architecture

```
app/
  page.tsx
  marketplace/
  agents/
  tasks/
  dashboard/
  seller/
  developers/
  admin/
components/
  ui/
  marketplace/
  agents/
  tasks/
  dashboard/
  layout/
lib/
  prisma.ts
  auth.ts
  seed.ts
  mockValidation.ts
  reputation.ts
  payments.ts
  schemas.ts
  utils.ts
prisma/
  schema.prisma
  seed.ts
```

Zod schemas for form validation. TypeScript types everywhere. No broken imports. No TODO comments (except a dedicated roadmap section).

Mock auth if necessary: create a default local user and organization; use that user for create actions.

Runs locally with `npm install` and `npm run dev`. Include `.env.example` and `README.md`.

README explains: what the product is; how to run locally; how to seed the database; how the mock payment system works; how the mock validation system works; where to plug in real x402; where to plug in A2A; where to plug in MCP; next steps.

---

## 13. Mock Adapters (architecture-ready)

- `lib/payments/x402Adapter.ts` — `createPaymentRequirement`, `verifyPayment`, `releasePayment` (mocked).
- `lib/interop/a2aAdapter.ts` — `getAgentCard`, `createTaskMessage`, `parseArtifactMessage` (local data).
- `lib/interop/mcpAdapter.ts` — `listToolsForAgent`, `validateMcpServer` (local mock data).

The app should make it obvious that future agents can call the marketplace programmatically.

### Developer API design
- `GET /api/agents` returns agent listings with capabilities, pricing, trust metrics, and endpoint metadata.
- `POST /api/tasks` accepts a structured task contract and creates a task. Example response:
```json
{
  "task_id": "task_123",
  "status": "pending",
  "payment": { "mode": "mock_escrow", "status": "escrowed", "amount": 25, "currency": "USD" },
  "seller_agent": { "id": "agent_123", "name": "Growth Research Agent" }
}
```

---

## 14. Acceptance Criteria

1. Browse the marketplace.
2. View an agent profile.
3. Create a new agent listing.
4. Create a task for an agent.
5. View the task detail page.
6. Move a task through accepted → running → submitted → validating → completed.
7. Submit an artifact.
8. Run mock validation.
9. Complete a task and release mock payment.
10. Leave a review.
11. Agent reputation and task counts update.
12. Dashboard reflects marketplace activity.
13. Seed data makes the app feel alive.
14. UI is polished and production-grade.
15. No TypeScript errors.
16. No broken routes.
17. README is clear.

---

## 15. Work Process

Inspect repo → concise plan → implement full MVP → typecheck → lint → fix all errors → seed database → ensure every route renders. Do not stop after scaffolding. Make reasonable assumptions and ship.

### Final deliverables
1. Summary of what was built
2. Files changed
3. How to run it
4. Environment variables needed
5. What is mocked
6. What should be connected next
7. Suggested next build sprint

---

## 16. Guardrails

- Not a toy landing page; not a UI-only mockup.
- Implement the full MVP data model and core flows.
- Prioritize the marketplace loop over exotic protocol integrations.
- Use mock adapters for x402, A2A, and MCP so the architecture is ready but the MVP still works.
