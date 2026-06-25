import {
  Braces,
  FileJson,
  Hash,
  ListChecks,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";

import { JsonViewer } from "@/components/shared/json-viewer";
import {
  PAYMENT_MODE_META,
  type PaymentModeValue,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Shape of a task contract, loose enough to accept both a persisted Prisma
 * `Contract` record (JSON fields typed as `unknown`) and a freshly generated,
 * client-side preview on the create-task page.
 */
export type TaskContractLike = {
  inputPayload?: unknown;
  outputSchema?: unknown;
  validationRules?: unknown;
  paymentMode?: string;
  successCriteria?: string | null;
  contractHash?: string | null;
};

/** True for JSON values that actually carry content worth rendering. */
function hasJsonContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

/**
 * Renders a task's machine contract as a clean, sectioned panel: objective /
 * inputs, output schema, validation rules, payment mode, success criteria and
 * the deterministic contract hash. Used on the task detail page (saved
 * contract) and on the create-task page (generated preview). Server component.
 */
export function TaskContractPreview({
  contract,
  className,
}: {
  contract: TaskContractLike;
  className?: string;
}) {
  const paymentMeta = contract.paymentMode
    ? PAYMENT_MODE_META[contract.paymentMode as PaymentModeValue]
    : undefined;

  const hasInputs = hasJsonContent(contract.inputPayload);
  const hasOutput = hasJsonContent(contract.outputSchema);
  const hasRules = hasJsonContent(contract.validationRules);
  const hasCriteria = Boolean(contract.successCriteria?.trim());

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card/50",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Braces className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">Task contract</p>
            <p className="text-xs text-muted-foreground">
              Machine-readable agreement between buyer and agent
            </p>
          </div>
        </div>
        {paymentMeta && (
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            <Wallet className="size-3.5" />
            {paymentMeta.label}
          </span>
        )}
      </div>

      <div className="divide-y divide-border">
        {/* Objective / Inputs */}
        <Section
          icon={Target}
          title="Objective & inputs"
          subtitle="Parameters supplied to the agent at hire time."
        >
          {hasInputs ? (
            <JsonViewer data={contract.inputPayload} />
          ) : (
            <EmptyValue label="No input payload defined." />
          )}
        </Section>

        {/* Output schema */}
        <Section
          icon={FileJson}
          title="Output schema"
          subtitle="The structure the deliverable must conform to."
        >
          {hasOutput ? (
            <JsonViewer data={contract.outputSchema} />
          ) : (
            <EmptyValue label="No output schema defined." />
          )}
        </Section>

        {/* Validation rules */}
        <Section
          icon={ListChecks}
          title="Validation rules"
          subtitle="Automated checks run against the submitted artifact."
        >
          {hasRules ? (
            <JsonViewer data={contract.validationRules} />
          ) : (
            <EmptyValue label="No validation rules defined." />
          )}
        </Section>

        {/* Success criteria */}
        {hasCriteria && (
          <Section
            icon={ShieldCheck}
            title="Success criteria"
            subtitle="Human-readable definition of done."
          >
            <p className="rounded-lg border border-border bg-muted/20 p-3 text-sm leading-relaxed text-foreground/90">
              {contract.successCriteria}
            </p>
          </Section>
        )}

        {/* Payment mode */}
        {paymentMeta && (
          <Section
            icon={Wallet}
            title="Payment mode"
            subtitle="How funds move when the contract settles."
          >
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {paymentMeta.label}
              </span>
              <p className="text-sm text-muted-foreground">
                {paymentMeta.description}
              </p>
            </div>
          </Section>
        )}

        {/* Contract hash */}
        {contract.contractHash && (
          <Section
            icon={Hash}
            title="Contract hash"
            subtitle="Deterministic fingerprint of the signed terms."
          >
            <code className="block w-full overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground no-scrollbar">
              {contract.contractHash}
            </code>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-2.5 flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="leading-tight">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="pl-6">{children}</div>
    </section>
  );
}

function EmptyValue({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
      {label}
    </p>
  );
}
