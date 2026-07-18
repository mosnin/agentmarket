import { prisma } from "@/lib/prisma";
import { DEFAULT_ORG, DEFAULT_USER } from "@/lib/constants";
import { slugify, mockHash } from "@/lib/utils";

/**
 * Seed data for Agent Market. Idempotent: wipes marketplace rows and recreates
 * a realistic dataset (12 agents, multiple orgs/owners, 10 tasks spanning every
 * lifecycle status, artifacts, payments, reviews and reputation history).
 */

const daysAgo = (n: number, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

interface AgentSeed {
  name: string;
  category: string;
  capabilities: string[];
  startingPrice: number;
  reputationScore: number;
  shortDescription: string;
  longDescription: string;
  pricingModel: "per_task" | "subscription" | "bounty" | "free";
  verified: boolean;
  averageRating: number;
  completionRate: number;
  totalTasksCompleted: number;
  averageLatencyMinutes: number;
  disputeRate: number;
  schemaComplianceScore: number;
  org: string;
  owner: string; // "default" or seller key
}

const ORG_SEEDS = [
  { name: "Nimbus Systems", slug: "nimbus-systems", description: "Reliability and infrastructure agents." },
  { name: "Foundry Labs", slug: "foundry-labs", description: "Applied research and synthesis agents." },
  { name: "Sentinel Security", slug: "sentinel-security", description: "Security and compliance automation." },
  { name: "Northwind Data", slug: "northwind-data", description: "Data engineering and enrichment agents." },
];

const SELLER_SEEDS = [
  { key: "nimbus", email: "ops@nimbus.dev", name: "Nimbus Ops", org: "nimbus-systems" },
  { key: "foundry", email: "research@foundry.dev", name: "Foundry Research", org: "foundry-labs" },
  { key: "sentinel", email: "soc@sentinel.dev", name: "Sentinel SOC", org: "sentinel-security" },
  { key: "northwind", email: "data@northwind.dev", name: "Northwind Data", org: "northwind-data" },
];

const AGENT_SEEDS: AgentSeed[] = [
  {
    name: "Growth Research Agent",
    category: "Growth",
    capabilities: ["Lead research", "Competitor mapping", "Market scan"],
    startingPrice: 25,
    reputationScore: 94,
    shortDescription: "Finds, enriches and qualifies high-intent leads at scale.",
    longDescription:
      "The Growth Research Agent runs end-to-end prospect research: it builds target lists from your ICP, enriches each account with firmographics and founder contacts, maps the competitive landscape, and returns a ranked, deduplicated dataset ready for outreach. Every record ships with a confidence score and source trail.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.9,
    completionRate: 98.2,
    totalTasksCompleted: 412,
    averageLatencyMinutes: 7,
    disputeRate: 0.4,
    schemaComplianceScore: 97,
    org: "foundry-labs",
    owner: "default",
  },
  {
    name: "Code Review Agent",
    category: "Coding",
    capabilities: ["Code review", "Test generation", "Bug detection"],
    startingPrice: 15,
    reputationScore: 91,
    shortDescription: "Reviews diffs, finds bugs and writes the missing tests.",
    longDescription:
      "Point the Code Review Agent at a pull request and it returns a prioritized review: correctness bugs, security smells, and reuse/simplification opportunities, each with a concrete patch. It generates the missing unit tests and reports coverage deltas so you can merge with confidence.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.7,
    completionRate: 96.5,
    totalTasksCompleted: 318,
    averageLatencyMinutes: 5,
    disputeRate: 0.8,
    schemaComplianceScore: 95,
    org: "nimbus-systems",
    owner: "default",
  },
  {
    name: "SEO Audit Agent",
    category: "Growth",
    capabilities: ["Technical SEO", "Content gap analysis", "Metadata generation"],
    startingPrice: 20,
    reputationScore: 88,
    shortDescription: "Technical SEO audits with prioritized, shippable fixes.",
    longDescription:
      "The SEO Audit Agent crawls your site, surfaces technical issues (crawlability, Core Web Vitals, schema markup), runs a content gap analysis against competitors, and generates optimized metadata. Output is a prioritized backlog with estimated impact for each fix.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.5,
    completionRate: 94.1,
    totalTasksCompleted: 205,
    averageLatencyMinutes: 12,
    disputeRate: 1.2,
    schemaComplianceScore: 92,
    org: "foundry-labs",
    owner: "foundry",
  },
  {
    name: "Data Cleaning Agent",
    category: "Data",
    capabilities: ["CSV cleanup", "Deduplication", "Schema mapping"],
    startingPrice: 10,
    reputationScore: 86,
    shortDescription: "Turns messy CSVs into clean, mapped, deduplicated data.",
    longDescription:
      "Upload a messy export and the Data Cleaning Agent normalizes columns, fixes encodings, removes duplicates with fuzzy matching, and maps everything to your target schema. It returns the cleaned file plus a transformation report detailing every change.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.4,
    completionRate: 95.8,
    totalTasksCompleted: 540,
    averageLatencyMinutes: 4,
    disputeRate: 0.6,
    schemaComplianceScore: 94,
    org: "northwind-data",
    owner: "northwind",
  },
  {
    name: "Security Scan Agent",
    category: "Security",
    capabilities: ["Dependency audit", "Secret detection", "Vulnerability report"],
    startingPrice: 35,
    reputationScore: 92,
    shortDescription: "Audits dependencies and secrets, ships a remediation plan.",
    longDescription:
      "The Security Scan Agent runs a full software-composition analysis: it flags vulnerable dependencies with CVSS context, detects leaked secrets across your history, and produces a remediation plan ranked by exploitability. Output integrates with your CI as a gating check.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.8,
    completionRate: 97.3,
    totalTasksCompleted: 276,
    averageLatencyMinutes: 9,
    disputeRate: 0.3,
    schemaComplianceScore: 96,
    org: "sentinel-security",
    owner: "sentinel",
  },
  {
    name: "Research Synthesis Agent",
    category: "Research",
    capabilities: ["Source gathering", "Citations", "Executive brief"],
    startingPrice: 30,
    reputationScore: 90,
    shortDescription: "Gathers sources and writes citation-grade executive briefs.",
    longDescription:
      "Give the Research Synthesis Agent a question and it gathers credible sources, cross-checks claims, and writes a structured executive brief with inline citations and a confidence assessment. Ideal for market scans, due diligence and literature reviews.",
    pricingModel: "subscription",
    verified: true,
    averageRating: 4.8,
    completionRate: 96.9,
    totalTasksCompleted: 188,
    averageLatencyMinutes: 18,
    disputeRate: 0.5,
    schemaComplianceScore: 95,
    org: "foundry-labs",
    owner: "default",
  },
  {
    name: "Landing Page Critique Agent",
    category: "Design",
    capabilities: ["UX audit", "Conversion review", "Copy critique"],
    startingPrice: 18,
    reputationScore: 84,
    shortDescription: "Audits landing pages for UX, conversion and copy.",
    longDescription:
      "The Landing Page Critique Agent reviews a URL across UX heuristics, conversion best-practices and message clarity. It returns a scored teardown with annotated screenshots, prioritized recommendations and rewritten copy for the highest-impact sections.",
    pricingModel: "per_task",
    verified: false,
    averageRating: 4.2,
    completionRate: 91.4,
    totalTasksCompleted: 132,
    averageLatencyMinutes: 11,
    disputeRate: 2.1,
    schemaComplianceScore: 89,
    org: "foundry-labs",
    owner: "foundry",
  },
  {
    name: "CRM Update Agent",
    category: "Operations",
    capabilities: ["CRM sync", "Lead routing", "Data entry"],
    startingPrice: 8,
    reputationScore: 82,
    shortDescription: "Keeps your CRM clean, routed and up to date.",
    longDescription:
      "The CRM Update Agent syncs records across tools, routes inbound leads by your rules, and handles the tedious data entry that humans skip. It logs every change and flags conflicts for review, keeping your pipeline trustworthy.",
    pricingModel: "subscription",
    verified: false,
    averageRating: 4.1,
    completionRate: 90.2,
    totalTasksCompleted: 622,
    averageLatencyMinutes: 3,
    disputeRate: 2.8,
    schemaComplianceScore: 88,
    org: "nimbus-systems",
    owner: "nimbus",
  },
  {
    name: "Support Triage Agent",
    category: "Customer Support",
    capabilities: ["Ticket classification", "Response drafting", "Sentiment tagging"],
    startingPrice: 12,
    reputationScore: 87,
    shortDescription: "Classifies tickets, tags sentiment and drafts replies.",
    longDescription:
      "The Support Triage Agent reads each incoming ticket, classifies it by topic and urgency, tags customer sentiment, and drafts an on-brand reply for human approval. It cuts first-response time dramatically while keeping a human in the loop.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.6,
    completionRate: 95.0,
    totalTasksCompleted: 489,
    averageLatencyMinutes: 2,
    disputeRate: 1.0,
    schemaComplianceScore: 93,
    org: "nimbus-systems",
    owner: "nimbus",
  },
  {
    name: "Financial Analysis Agent",
    category: "Finance",
    capabilities: ["Transaction categorization", "Cash flow report", "Variance analysis"],
    startingPrice: 28,
    reputationScore: 89,
    shortDescription: "Categorizes transactions and builds cash-flow reports.",
    longDescription:
      "The Financial Analysis Agent ingests transactions, categorizes them with high accuracy, builds cash-flow and runway reports, and runs variance analysis against budget. Output is an investor-ready summary plus the underlying structured data.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.7,
    completionRate: 96.1,
    totalTasksCompleted: 241,
    averageLatencyMinutes: 14,
    disputeRate: 0.7,
    schemaComplianceScore: 95,
    org: "northwind-data",
    owner: "northwind",
  },
  {
    name: "Infra Monitor Agent",
    category: "Infrastructure",
    capabilities: ["Uptime checks", "Log summary", "Incident report"],
    startingPrice: 22,
    reputationScore: 85,
    shortDescription: "Watches uptime, summarizes logs, writes incident reports.",
    longDescription:
      "The Infra Monitor Agent runs synthetic uptime checks, summarizes noisy logs into signal, and—when something breaks—drafts a clear incident report with timeline, impact and likely root cause. It turns 2am chaos into a clean postmortem.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.4,
    completionRate: 93.7,
    totalTasksCompleted: 357,
    averageLatencyMinutes: 6,
    disputeRate: 1.4,
    schemaComplianceScore: 91,
    org: "nimbus-systems",
    owner: "nimbus",
  },
  {
    name: "Outbound Personalization Agent",
    category: "Growth",
    capabilities: ["Cold email personalization", "Prospect research", "Sequence generation"],
    startingPrice: 16,
    reputationScore: 93,
    shortDescription: "Researches prospects and writes personalized sequences.",
    longDescription:
      "The Outbound Personalization Agent researches each prospect, finds a genuine hook, and writes a multi-step email sequence tailored to them—not a mail-merge token. It returns ready-to-send copy with per-prospect rationale and A/B variants.",
    pricingModel: "per_task",
    verified: true,
    averageRating: 4.8,
    completionRate: 97.6,
    totalTasksCompleted: 298,
    averageLatencyMinutes: 8,
    disputeRate: 0.5,
    schemaComplianceScore: 96,
    org: "foundry-labs",
    owner: "default",
  },
];

const CATEGORY_SCHEMAS: Record<string, { input: Record<string, string>; output: Record<string, string> }> = {
  Growth: { input: { icp: "string", count: "number" }, output: { company: "string", domain: "string", founder_email: "string", confidence: "number" } },
  Coding: { input: { repo_url: "string", pr_number: "number" }, output: { findings: "string[]", patch: "string", tests_added: "number" } },
  Data: { input: { file_url: "string", target_schema: "object" }, output: { rows_processed: "number", duplicates_removed: "number", report_url: "string" } },
  Security: { input: { repo_url: "string" }, output: { vulnerabilities: "string[]", severity: "string", remediation: "string[]" } },
  Research: { input: { question: "string", depth: "string" }, output: { summary: "string", sources: "string[]", confidence: "number" } },
  Design: { input: { url: "string" }, output: { score: "number", issues: "string[]", recommendations: "string[]" } },
  Operations: { input: { source: "string", destination: "string" }, output: { records_updated: "number", status: "string" } },
  Finance: { input: { transactions_url: "string" }, output: { categories: "object", total: "number", variance: "number" } },
  "Customer Support": { input: { ticket: "string" }, output: { category: "string", draft_reply: "string", sentiment: "string" } },
  Infrastructure: { input: { targets: "string[]" }, output: { uptime: "number", incidents: "string[]", summary: "string" } },
};

interface TaskSeed {
  title: string;
  objective: string;
  category: string;
  agent: string; // agent name
  status: "pending" | "accepted" | "running" | "submitted" | "validating" | "completed" | "disputed" | "cancelled";
  budget: number;
  paymentMode: "mock_escrow" | "pay_per_task" | "subscription" | "bounty";
  createdDaysAgo: number;
  artifact?: { title: string; type: "json" | "report" | "file" | "text" | "url"; content?: string; url?: string; validation?: "passed" | "failed" | "pending"; score?: number };
  review?: { rating: number; comment: string };
  dispute?: { reason: string };
}

const TASK_SEEDS: TaskSeed[] = [
  {
    title: "Enrich 500 Shopify leads with founder emails",
    objective: "Build and enrich a list of 500 Shopify store founders with verified emails, company size, and a confidence score for each record.",
    category: "Growth",
    agent: "Growth Research Agent",
    status: "completed",
    budget: 25,
    paymentMode: "mock_escrow",
    createdDaysAgo: 12,
    artifact: { title: "enriched_leads.json", type: "json", content: '{"records": 500, "verified": 487, "avg_confidence": 0.91}', validation: "passed", score: 96 },
    review: { rating: 5, comment: "Outstanding accuracy. 487/500 emails verified and the confidence scores were spot on." },
  },
  {
    title: "Review authentication refactor PR #482",
    objective: "Review the authentication refactor pull request for correctness bugs and security issues, and generate the missing tests.",
    category: "Coding",
    agent: "Code Review Agent",
    status: "completed",
    budget: 15,
    paymentMode: "mock_escrow",
    createdDaysAgo: 9,
    artifact: { title: "review_report.md", type: "report", content: "Found 3 correctness bugs, 1 medium security issue. Added 12 unit tests (coverage +8%).", validation: "passed", score: 92 },
    review: { rating: 5, comment: "Caught a session-fixation bug we completely missed. Worth every cent." },
  },
  {
    title: "Quarterly dependency + secret audit",
    objective: "Run a full dependency and secret-scanning audit across the monorepo and produce a prioritized remediation plan.",
    category: "Security",
    agent: "Security Scan Agent",
    status: "completed",
    budget: 35,
    paymentMode: "mock_escrow",
    createdDaysAgo: 7,
    artifact: { title: "security_audit.json", type: "json", content: '{"vulns": {"critical": 1, "high": 4, "medium": 9}, "secrets_found": 2}', validation: "passed", score: 94 },
    review: { rating: 4, comment: "Thorough report. Would love faster turnaround on the critical findings." },
  },
  {
    title: "Clean and dedupe the 2024 customer export",
    objective: "Normalize columns, remove duplicates with fuzzy matching, and map the export to our warehouse schema.",
    category: "Data",
    agent: "Data Cleaning Agent",
    status: "running",
    budget: 10,
    paymentMode: "mock_escrow",
    createdDaysAgo: 2,
  },
  {
    title: "Technical SEO audit for the marketing site",
    objective: "Crawl the marketing site, surface technical SEO issues, run a content gap analysis, and generate optimized metadata.",
    category: "Growth",
    agent: "SEO Audit Agent",
    status: "submitted",
    budget: 20,
    paymentMode: "mock_escrow",
    createdDaysAgo: 3,
    artifact: { title: "seo_audit.json", type: "json", content: '{"issues": 23, "content_gaps": 11, "pages_crawled": 142}', validation: "pending" },
  },
  {
    title: "Synthesize the agent-infrastructure market",
    objective: "Gather credible sources and write a citation-grade executive brief on the autonomous agent infrastructure market.",
    category: "Research",
    agent: "Research Synthesis Agent",
    status: "validating",
    budget: 30,
    paymentMode: "mock_escrow",
    createdDaysAgo: 4,
    artifact: { title: "market_brief.md", type: "report", content: "12-page brief, 38 cited sources, confidence: high.", validation: "passed", score: 90 },
  },
  {
    title: "Categorize Q2 transactions and build cash-flow report",
    objective: "Ingest Q2 transactions, categorize them, and produce a cash-flow and runway report with variance against budget.",
    category: "Finance",
    agent: "Financial Analysis Agent",
    status: "pending",
    budget: 28,
    paymentMode: "mock_escrow",
    createdDaysAgo: 1,
  },
  {
    title: "Triage the weekend support backlog",
    objective: "Classify and tag the weekend ticket backlog by topic, urgency and sentiment, and draft first responses.",
    category: "Customer Support",
    agent: "Support Triage Agent",
    status: "accepted",
    budget: 12,
    paymentMode: "pay_per_task",
    createdDaysAgo: 1,
  },
  {
    title: "Conversion teardown of the new pricing page",
    objective: "Audit the new pricing page for UX and conversion issues and rewrite the highest-impact copy.",
    category: "Design",
    agent: "Landing Page Critique Agent",
    status: "disputed",
    budget: 18,
    paymentMode: "mock_escrow",
    createdDaysAgo: 6,
    artifact: { title: "pricing_teardown.md", type: "report", content: "Conversion score 62/100. 9 recommendations.", validation: "failed", score: 74 },
    dispute: { reason: "The teardown missed the mobile checkout flow entirely, which was the core of the brief." },
  },
  {
    title: "Sync and route inbound demo requests",
    objective: "Sync inbound demo requests into the CRM and route them to the right reps by territory.",
    category: "Operations",
    agent: "CRM Update Agent",
    status: "cancelled",
    budget: 8,
    paymentMode: "mock_escrow",
    createdDaysAgo: 5,
  },
];

export async function seedDatabase() {
  // Wipe marketplace rows (preserve nothing — fully reproducible).
  await prisma.reputationEvent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.taskContract.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agentCapability.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.capability.deleteMany();

  // Organizations.
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG.slug },
    update: { name: DEFAULT_ORG.name, description: DEFAULT_ORG.description },
    create: { name: DEFAULT_ORG.name, slug: DEFAULT_ORG.slug, description: DEFAULT_ORG.description },
  });
  const orgBySlug = new Map<string, string>([[DEFAULT_ORG.slug, defaultOrg.id]]);
  for (const o of ORG_SEEDS) {
    const org = await prisma.organization.upsert({
      where: { slug: o.slug },
      update: { name: o.name, description: o.description },
      create: o,
    });
    orgBySlug.set(o.slug, org.id);
  }

  // Users.
  const defaultUser = await prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    // Demo operator is the admin (runs the moderation console). Seller seeds
    // below stay as regular users so the authorization boundary is exercised.
    update: { name: DEFAULT_USER.name, organizationId: defaultOrg.id, role: "admin" },
    create: { email: DEFAULT_USER.email, name: DEFAULT_USER.name, organizationId: defaultOrg.id, role: "admin" },
  });
  const userByKey = new Map<string, string>([["default", defaultUser.id]]);
  for (const s of SELLER_SEEDS) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, organizationId: orgBySlug.get(s.org) },
      create: { email: s.email, name: s.name, organizationId: orgBySlug.get(s.org) },
    });
    userByKey.set(s.key, u.id);
  }

  // Capabilities + Agents.
  const agentByName = new Map<string, { id: string; slug: string }>();
  for (const a of AGENT_SEEDS) {
    const schemas = CATEGORY_SCHEMAS[a.category];
    const agent = await prisma.agent.create({
      data: {
        name: a.name,
        slug: slugify(a.name),
        shortDescription: a.shortDescription,
        longDescription: a.longDescription,
        category: a.category,
        status: "active",
        verified: a.verified,
        endpointUrl: `https://api.agentmarket.dev/v1/agents/${slugify(a.name)}`,
        mcpServerUrl: a.verified ? `https://mcp.agentmarket.dev/${slugify(a.name)}` : null,
        inputSchema: schemas?.input ?? {},
        outputSchema: schemas?.output ?? {},
        pricingModel: a.pricingModel,
        startingPrice: a.startingPrice,
        currency: "USD",
        averageRating: a.averageRating,
        reputationScore: a.reputationScore,
        completionRate: a.completionRate,
        averageLatencyMinutes: a.averageLatencyMinutes,
        schemaComplianceScore: a.schemaComplianceScore,
        disputeRate: a.disputeRate,
        totalTasksCompleted: a.totalTasksCompleted,
        ownerId: userByKey.get(a.owner) ?? defaultUser.id,
        organizationId: orgBySlug.get(a.org),
        createdAt: daysAgo(40 - AGENT_SEEDS.indexOf(a)),
      },
    });
    agentByName.set(a.name, { id: agent.id, slug: agent.slug });

    for (const capName of a.capabilities) {
      const capability = await prisma.capability.upsert({
        where: { slug: slugify(capName) },
        update: {},
        create: { name: capName, slug: slugify(capName), category: a.category, description: `${capName} capability.` },
      });
      await prisma.agentCapability.create({
        data: { agentId: agent.id, capabilityId: capability.id },
      });
    }
  }

  // Tasks + children.
  let taskCount = 0;
  for (const t of TASK_SEEDS) {
    const agent = agentByName.get(t.agent);
    if (!agent) continue;
    const created = daysAgo(t.createdDaysAgo);

    const paymentStatus =
      t.status === "completed"
        ? "released"
        : t.status === "cancelled"
          ? "refunded"
          : t.paymentMode === "mock_escrow"
            ? "escrowed"
            : "pending";

    const task = await prisma.task.create({
      data: {
        title: t.title,
        objective: t.objective,
        category: t.category,
        status: t.status,
        visibility: "public",
        budget: t.budget,
        currency: "USD",
        deadline: daysAgo(t.createdDaysAgo - 7),
        buyerId: defaultUser.id,
        sellerAgentId: agent.id,
        createdAt: created,
        updatedAt: created,
        contract: {
          create: {
            inputPayload: { instructions: t.objective, dataUrl: "" },
            outputSchema: CATEGORY_SCHEMAS[t.category]?.output ?? { result: "string" },
            validationRules: { rules: ["Conform to output schema", "Score >= 80"] },
            paymentMode: t.paymentMode,
            successCriteria: "Deliver an artifact matching the output schema with a validation score of at least 80.",
            contractHash: mockHash("0x", `${t.title}:${t.budget}`),
            createdAt: created,
          },
        },
        payment: {
          create: {
            amount: t.budget,
            currency: "USD",
            status: paymentStatus,
            mode: t.paymentMode,
            provider: "mock_x402",
            transactionHash: paymentStatus === "released" ? mockHash("0x", `release:${t.title}`) : null,
            createdAt: created,
          },
        },
      },
    });
    taskCount++;

    if (t.artifact) {
      await prisma.artifact.create({
        data: {
          taskId: task.id,
          title: t.artifact.title,
          type: t.artifact.type,
          content: t.artifact.content ?? null,
          url: t.artifact.url ?? null,
          validationStatus: t.artifact.validation ?? "pending",
          validationScore: t.artifact.score ?? null,
          createdAt: daysAgo(t.createdDaysAgo - 1),
        },
      });
    }

    if (t.review) {
      await prisma.review.create({
        data: {
          taskId: task.id,
          agentId: agent.id,
          userId: defaultUser.id,
          rating: t.review.rating,
          comment: t.review.comment,
          createdAt: daysAgo(t.createdDaysAgo - 2),
        },
      });
    }

    if (t.dispute) {
      await prisma.dispute.create({
        data: {
          taskId: task.id,
          openedById: defaultUser.id,
          reason: t.dispute.reason,
          status: "open",
          createdAt: daysAgo(t.createdDaysAgo - 1),
        },
      });
    }

    // Reputation history for completed / validated / disputed tasks.
    if (t.status === "completed") {
      await prisma.reputationEvent.create({
        data: { agentId: agent.id, taskId: task.id, type: "task_completed", scoreDelta: 2, reason: "Task completed and payment released.", createdAt: daysAgo(t.createdDaysAgo - 2) },
      });
      if (t.review) {
        await prisma.reputationEvent.create({
          data: { agentId: agent.id, taskId: task.id, type: "review_received", scoreDelta: t.review.rating - 2, reason: `Received a ${t.review.rating}-star review.`, createdAt: daysAgo(t.createdDaysAgo - 2) },
        });
      }
    }
    if (t.artifact?.validation === "passed") {
      await prisma.reputationEvent.create({
        data: { agentId: agent.id, taskId: task.id, type: "validation_passed", scoreDelta: 1, reason: `Validation passed with score ${t.artifact.score}.`, createdAt: daysAgo(t.createdDaysAgo - 1) },
      });
    }
    if (t.dispute) {
      await prisma.reputationEvent.create({
        data: { agentId: agent.id, taskId: task.id, type: "dispute_opened", scoreDelta: -5, reason: "A dispute was opened on a deliverable.", createdAt: daysAgo(t.createdDaysAgo - 1) },
      });
    }
  }

  // A little extra reputation history on default-owned agents for the trend chart.
  const defaultAgents = AGENT_SEEDS.filter((a) => a.owner === "default");
  for (const a of defaultAgents) {
    const agent = agentByName.get(a.name)!;
    for (let i = 0; i < 5; i++) {
      await prisma.reputationEvent.create({
        data: {
          agentId: agent.id,
          type: i % 2 === 0 ? "task_completed" : "validation_passed",
          scoreDelta: i % 2 === 0 ? 2 : 1,
          reason: i % 2 === 0 ? "Task completed." : "Validation passed.",
          createdAt: daysAgo(13 - i * 2),
        },
      });
    }
  }

  return {
    organizations: orgBySlug.size,
    users: userByKey.size,
    agents: AGENT_SEEDS.length,
    tasks: taskCount,
  };
}
