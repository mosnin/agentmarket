"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarClock,
  Coins,
  FileOutput,
  Loader2,
  Send,
  Sparkles,
  Target,
  Wallet,
  Workflow,
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { createTaskSchema, type CreateTaskInput } from "@/lib/schemas";
import { createTask } from "@/lib/actions";
import { buildStructuredContract } from "@/lib/contract";
import {
  CATEGORIES,
  CATEGORY_META,
  OUTPUT_FORMATS,
  PAYMENT_MODES,
  PAYMENT_MODE_META,
  VISIBILITY_OPTIONS,
  VISIBILITY_META,
  type Category,
} from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryIcon } from "@/components/shared/category-icon";
import {
  TaskContractPreview,
  type TaskContractLike,
} from "@/components/tasks/task-contract-preview";

/**
 * The form's *input* field shape. `createTaskSchema` coerces `budget` to a
 * number, so the values flowing through the inputs (and `form.watch()`) match
 * the schema's input type, while the validated submit payload is
 * `CreateTaskInput` (the output type).
 */
type TaskFormInput = z.input<typeof createTaskSchema>;

/** Minimal agent shape returned by `getAgentsForSelect`. */
type SelectAgent = {
  id: string;
  name: string;
  slug: string;
  category: string;
  startingPrice: number;
  currency: string;
  pricingModel: string;
  reputationScore: number;
  verified: boolean;
};

/** Section heading: icon chip + title + numbered step, matching the agent form. */
function SectionHeader({
  icon: Icon,
  title,
  description,
  step,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  step: number;
}) {
  return (
    <CardHeader className="gap-0">
      <div className="flex items-start gap-3">
        <span className="bg-brand/10 text-brand ring-brand/20 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2">
            {title}
            <span className="text-muted-foreground/70 text-xs font-normal tabular-nums">
              Step {step} of 5
            </span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

/** Narrow an agent's stored category string to the Category enum. */
function isCategory(value: string | undefined): value is Category {
  return !!value && (CATEGORIES as readonly string[]).includes(value);
}

/** Build the preview contract from current form values (live, always-on draft). */
function draftContractFromValues(
  values: Partial<TaskFormInput>,
): TaskContractLike {
  const instructions = values.inputInstructions?.trim();
  const dataUrl = values.inputDataUrl?.trim();
  const inputPayload: Record<string, unknown> = {};
  if (values.objective?.trim()) inputPayload.objective = values.objective.trim();
  if (instructions) inputPayload.instructions = instructions;
  if (dataUrl) inputPayload.dataUrl = dataUrl;

  const rules = values.validationRules
    ? values.validationRules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  return {
    inputPayload: Object.keys(inputPayload).length ? inputPayload : undefined,
    outputSchema: values.outputFormat ? { format: values.outputFormat } : undefined,
    validationRules: rules.length ? { rules } : undefined,
    paymentMode: values.paymentMode,
    successCriteria:
      values.validationRules?.trim() ||
      (values.objective?.trim()
        ? "Deliver an artifact matching the declared output format."
        : null),
  };
}

type StructuredContract = ReturnType<typeof buildStructuredContract>;

/** Map a generated StructuredContract into the TaskContractPreview shape. */
function structuredToPreview(
  structured: StructuredContract,
  paymentMode: TaskFormInput["paymentMode"],
): TaskContractLike {
  return {
    inputPayload: {
      steps: structured.steps,
      inputs: structured.inputs,
    },
    outputSchema: structured.outputSchema,
    validationRules: { rules: structured.successCriteria },
    successCriteria: structured.successCriteria.join(" "),
    paymentMode,
  };
}

export function TaskForm({
  agents,
  preselectedAgentId,
  defaultObjective,
}: {
  agents: SelectAgent[];
  preselectedAgentId?: string;
  defaultObjective?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // A generated structured contract overrides the live draft. We keep the raw
  // structure (plus the objective it was built from) so payment-mode stays live
  // and so editing the brief re-opens the live draft automatically.
  const [generated, setGenerated] = React.useState<{
    structured: StructuredContract;
    objective: string;
  } | null>(null);

  // The schema coerces `budget` to a number, so the resolver's *input* type
  // differs from its *output* (transformed) type. Type the form with the input
  // shape for fields and the output (CreateTaskInput) for the submit handler.
  const form = useForm<TaskFormInput, unknown, CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      objective: defaultObjective ?? "",
      category: undefined,
      sellerAgentId: preselectedAgentId ?? "",
      inputInstructions: "",
      inputDataUrl: "",
      outputFormat: "JSON",
      budget: 25,
      deadline: "",
      validationRules: "",
      paymentMode: "mock_escrow",
      visibility: "public",
    },
  });

  // Watch the fields the preview depends on.
  const values = form.watch();
  const selectedAgent = React.useMemo(
    () => agents.find((a) => a.id === values.sellerAgentId),
    [agents, values.sellerAgentId],
  );

  const liveDraft = React.useMemo(
    () => draftContractFromValues(values),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      values.objective,
      values.inputInstructions,
      values.inputDataUrl,
      values.outputFormat,
      values.validationRules,
      values.paymentMode,
    ],
  );

  // Editing the brief re-opens the live draft: a generated contract is only
  // valid for the exact objective it was structured from.
  React.useEffect(() => {
    if (generated && values.objective?.trim() !== generated.objective) {
      setGenerated(null);
    }
  }, [values.objective, generated]);

  // Smart defaults — the contract drafts itself around the chosen specialist.
  // When an agent is selected (including via the "Hire this agent" deep link),
  // adopt its category and suggest its starting price as the budget, unless the
  // buyer has already set those fields. "It just works": pick an agent and the
  // routing, category, and budget are sensible before you type a word.
  React.useEffect(() => {
    if (!selectedAgent) return;
    if (!form.getValues("category") && isCategory(selectedAgent.category)) {
      form.setValue("category", selectedAgent.category);
    }
    if (
      !form.formState.dirtyFields.budget &&
      selectedAgent.pricingModel !== "free" &&
      selectedAgent.startingPrice > 0
    ) {
      form.setValue("budget", selectedAgent.startingPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent?.id]);

  // The preview shows the generated contract if present, else the live draft.
  // Payment mode is always read live so it reflects the current selection.
  const previewContract: TaskContractLike = generated
    ? structuredToPreview(generated.structured, values.paymentMode)
    : liveDraft;
  const hasPreviewContent =
    Boolean(values.objective?.trim()) || generated !== null;

  const handleGenerate = () => {
    const objective = form.getValues("objective").trim();
    if (objective.length < 10) {
      form.setError("objective", {
        type: "manual",
        message: "Describe the objective (at least 10 characters) to structure it.",
      });
      toast.error("Add a fuller objective before generating a contract.");
      return;
    }
    const structured = buildStructuredContract({
      objective,
      category: form.getValues("category"),
      budget: Number(form.getValues("budget")) || undefined,
    });
    setGenerated({ structured, objective });

    // Helpful auto-fill: seed the title if the buyer left it empty.
    if (!form.getValues("title").trim()) {
      form.setValue("title", structured.title, { shouldDirty: true });
    }
    toast.success("Structured the brief into a draft contract.");
  };

  const onSubmit = (data: CreateTaskInput) => {
    startTransition(async () => {
      const result = await createTask(data);
      if (result.ok) {
        toast.success("Task posted — funds escrowed and routed to the agent.");
        router.push(`/tasks/${result.taskId}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const budgetNumber = Number(values.budget);
  const paymentMeta = values.paymentMode
    ? PAYMENT_MODE_META[values.paymentMode]
    : undefined;
  const previewCurrency = selectedAgent?.currency ?? "USD";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_28rem]"
      >
        {/* ----------------------------- Form column ----------------------------- */}
        <div className="min-w-0 space-y-6">
          {/* Brief */}
          <Card>
            <SectionHeader
              step={1}
              icon={Target}
              title="The brief"
              description="A clear title and the outcome you want. This is the heart of the contract."
            />
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Enrich 200 inbound leads with firmographics"
                        autoComplete="off"
                        maxLength={140}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between gap-3">
                      <FormDescription>
                        A short, action-oriented summary the agent sees first.
                      </FormDescription>
                      <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                        {field.value?.length ?? 0}/140
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel>Objective</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handleGenerate}
                      >
                        <Sparkles className="size-3" />
                        Generate structured contract
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Describe the outcome in plain language. What should the agent produce, against what inputs, and what does 'done' look like? The more specific, the better the structured contract."
                        className="min-h-36 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between gap-3">
                      <FormDescription>
                        Plain English is fine — the structuring step turns it
                        into steps, a schema and success criteria.
                      </FormDescription>
                      <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                        {field.value?.length ?? 0}/6000
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            <CategoryIcon
                              category={category}
                              className="size-4 text-muted-foreground"
                            />
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value
                        ? CATEGORY_META[field.value].blurb
                        : "Routes the task and shapes the suggested output schema."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Routing */}
          <Card>
            <SectionHeader
              step={2}
              icon={Workflow}
              title="Routing"
              description="Pick the specialist agent that will accept and execute this task."
            />
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="sellerAgentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target agent</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-auto w-full py-2">
                          <SelectValue placeholder="Select an agent to hire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-80">
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="flex w-full items-center gap-2.5">
                              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
                                <CategoryIcon
                                  category={agent.category}
                                  className="size-3.5"
                                />
                              </span>
                              <span className="flex min-w-0 flex-col">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                  <span className="truncate">{agent.name}</span>
                                  {agent.verified ? (
                                    <BadgeCheck className="text-brand size-3.5 shrink-0" />
                                  ) : null}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {agent.category} · rep {agent.reputationScore}
                                </span>
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedAgent ? (
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-foreground font-medium">
                            {selectedAgent.name}
                          </span>
                          <span>·</span>
                          <span>
                            from{" "}
                            {formatCurrency(
                              selectedAgent.startingPrice,
                              selectedAgent.currency,
                            )}
                          </span>
                          {selectedAgent.verified ? (
                            <span className="text-brand inline-flex items-center gap-1">
                              <BadgeCheck className="size-3" />
                              Verified
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        "Only active agents in the marketplace are shown."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card>
            <SectionHeader
              step={3}
              icon={FileOutput}
              title="Inputs"
              description="The context and data the agent needs to start. Both are optional."
            />
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="inputInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Step-by-step guidance, constraints, tone, or edge cases the agent should respect."
                        className="min-h-24 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Anything beyond the objective that scopes how the work is
                      done.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inputDataUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input data URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        inputMode="url"
                        placeholder="https://example.com/leads.csv"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A link to a dataset, document or API the agent should pull
                      from.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Output & budget */}
          <Card>
            <SectionHeader
              step={4}
              icon={Coins}
              title="Deliverable & budget"
              description="The format you expect back, what you'll pay, and when you need it."
            />
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="outputFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output format</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OUTPUT_FORMATS.map((fmt) => (
                            <SelectItem key={fmt} value={fmt}>
                              {fmt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The structure the deliverable must conform to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            className="pl-6"
                            {...field}
                            value={(field.value as number | string | undefined) ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      {selectedAgent && selectedAgent.startingPrice > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {[1, 2, 5].map((mult) => {
                            const amount = selectedAgent.startingPrice * mult;
                            const active = Number(field.value) === amount;
                            return (
                              <button
                                key={mult}
                                type="button"
                                onClick={() => field.onChange(amount)}
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
                                  active
                                    ? "border-brand/40 bg-brand/10 text-foreground"
                                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
                                )}
                              >
                                {mult}× · {formatCurrency(amount, selectedAgent.currency)}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <FormDescription>
                        Held in escrow until the deliverable passes validation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Deadline{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarClock className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                          type="date"
                          className="pl-8 [color-scheme:dark]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      A target completion date. Leave blank for an open
                      timeline.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validationRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Validation rules{" "}
                      <span className="text-muted-foreground font-normal">
                        (one per line)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={
                          "Every record includes a verified work email.\nConfidence score is present for each row.\nNo duplicate company domains."
                        }
                        className="min-h-24 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Automated, line-by-line checks run against the submitted
                      artifact. These become the contract&apos;s success
                      criteria.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Settlement */}
          <Card>
            <SectionHeader
              step={5}
              icon={Wallet}
              title="Settlement & visibility"
              description="How funds move when the contract settles, and who can see this task."
            />
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment mode</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_MODES.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {PAYMENT_MODE_META[mode].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {paymentMeta?.description ??
                          "Determines how and when the agent is paid."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {VISIBILITY_META[option].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {VISIBILITY_META[field.value]?.description ??
                          "Controls who can discover this task."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="border-border bg-card/60 supports-[backdrop-filter]:bg-card/40 sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {Number.isFinite(budgetNumber) && budgetNumber > 0 ? (
                <>
                  {formatCurrency(budgetNumber, previewCurrency)} will be
                  escrowed when you post.
                </>
              ) : (
                "Funds are escrowed when you post and released on validation."
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Post task
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* --------------------------- Preview column ---------------------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="font-heading text-sm font-medium text-foreground">
                  Live contract preview
                </h2>
                <p className="text-muted-foreground text-xs">
                  {generated
                    ? "Generated from your brief — edits below refresh the draft."
                    : "Updates as you type. Generate to expand into steps."}
                </p>
              </div>
              {generated ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setGenerated(null)}
                >
                  Reset
                </Button>
              ) : null}
            </div>

            {hasPreviewContent ? (
              <>
                {/* Summary strip */}
                <div className="border-border bg-card grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border">
                  <PreviewStat
                    label="Budget"
                    value={
                      Number.isFinite(budgetNumber) && budgetNumber > 0
                        ? formatCurrency(budgetNumber, previewCurrency)
                        : "—"
                    }
                  />
                  <PreviewStat label="Format" value={values.outputFormat || "—"} />
                  <PreviewStat
                    label="Agent"
                    value={selectedAgent?.name ?? "Unassigned"}
                  />
                </div>

                <TaskContractPreview contract={previewContract} />

                <p className="text-muted-foreground/80 px-1 text-xs leading-relaxed">
                  This preview mirrors the contract that will be written
                  on-chain-style as a deterministic record when you post. The
                  hash is generated server-side on submit.
                </p>
              </>
            ) : (
              <div className="border-border bg-card/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
                <span className="bg-brand/10 ring-brand/20 mb-3 flex size-11 items-center justify-center rounded-full ring-1">
                  <Sparkles className="text-brand size-5" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  Your contract appears here
                </p>
                <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                  Start writing an objective and the structured contract —
                  inputs, output schema and success criteria — builds in real
                  time.
                </p>
              </div>
            )}
          </div>
        </aside>
      </form>
    </Form>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground truncate text-sm font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
