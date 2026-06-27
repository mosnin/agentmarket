"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Boxes,
  Braces,
  Building2,
  CheckCircle2,
  Code2,
  Loader2,
  Plug,
  Sparkles,
  Tag,
  Wand2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { createAgentSchema, type CreateAgentInput } from "@/lib/schemas";
import type { Category } from "@/lib/constants";
import { createAgent } from "@/lib/actions";
import {
  CATEGORIES,
  CATEGORY_META,
  PRICING_MODELS,
  PRICING_MODEL_META,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const MAX_CAPABILITIES = 16;

/** Suggested capability chips to seed the tag input — real, on-brand examples. */
const CAPABILITY_SUGGESTIONS = [
  "Schema validation",
  "Citation grading",
  "Lead enrichment",
  "Unit test generation",
  "PII redaction",
  "CSV deduplication",
];

const PLACEHOLDER_INPUT_SCHEMA = `{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "max_results": { "type": "integer", "default": 10 }
  },
  "required": ["query"]
}`;

const PLACEHOLDER_OUTPUT_SCHEMA = `{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "sources": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["summary"]
}`;

/** A single section heading: icon chip + title + description, used atop each card. */
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
              Step {step} of 4
            </span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

/** Live JSON validity hint shown beneath the schema editors. */
function JsonHint({ value }: { value: string | undefined }) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return (
      <FormDescription>
        Optional. Paste a JSON Schema object describing the shape buyers should
        send or receive.
      </FormDescription>
    );
  }
  let valid = false;
  try {
    const parsed = JSON.parse(trimmed);
    valid = typeof parsed === "object" && parsed !== null;
  } catch {
    valid = false;
  }
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm",
        valid ? "text-emerald-400" : "text-amber-400",
      )}
    >
      {valid ? (
        <>
          <CheckCircle2 className="size-3.5" />
          Valid JSON object
        </>
      ) : (
        <>
          <Braces className="size-3.5" />
          Not valid JSON yet — finish the object or fix the syntax
        </>
      )}
    </p>
  );
}

/**
 * The values the form holds. We use the schema's *output* type so every field
 * binds to a concrete type (`startingPrice: number`, `verified: boolean`), and
 * cast the resolver to match. zodResolver still coerces/validates the raw input
 * on submit; this only aligns the generics with the shared <FormField> (which
 * threads a single value type) so the components compose cleanly.
 */
type FormValues = CreateAgentInput;

export function AgentForm({
  organizationId,
  organizationName,
}: {
  organizationId: string | null;
  organizationName: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [capabilityDraft, setCapabilityDraft] = React.useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(createAgentSchema) as Resolver<FormValues>,
    mode: "onBlur",
    defaultValues: {
      name: "",
      shortDescription: "",
      longDescription: "",
      category: undefined as unknown as Category,
      capabilities: [],
      pricingModel: "per_task",
      // A sensible non-zero starter so a paid model isn't accidentally published
      // at $0 (which now reads as "Free"). Mirrors the task form's budget default.
      startingPrice: 25,
      currency: "USD",
      endpointUrl: "",
      mcpServerUrl: "",
      inputSchema: "",
      outputSchema: "",
      organizationId: organizationId ?? undefined,
      verified: false,
    },
  });

  const capabilities = form.watch("capabilities");
  const inputSchemaValue = form.watch("inputSchema");
  const outputSchemaValue = form.watch("outputSchema");
  const pricingModel = form.watch("pricingModel");
  const isFree = pricingModel === "free";

  // --- Capability tag input helpers ------------------------------------
  const addCapability = React.useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      const current = form.getValues("capabilities") ?? [];
      if (current.length >= MAX_CAPABILITIES) {
        toast.error(`You can list up to ${MAX_CAPABILITIES} capabilities.`);
        return;
      }
      const exists = current.some(
        (c) => c.toLowerCase() === value.toLowerCase(),
      );
      if (exists) {
        setCapabilityDraft("");
        return;
      }
      form.setValue("capabilities", [...current, value], {
        shouldValidate: true,
        shouldDirty: true,
      });
      setCapabilityDraft("");
    },
    [form],
  );

  const removeCapability = React.useCallback(
    (value: string) => {
      const current = form.getValues("capabilities") ?? [];
      form.setValue(
        "capabilities",
        current.filter((c) => c !== value),
        { shouldValidate: true, shouldDirty: true },
      );
    },
    [form],
  );

  const handleCapabilityKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addCapability(capabilityDraft);
    } else if (
      event.key === "Backspace" &&
      capabilityDraft === "" &&
      capabilities.length > 0
    ) {
      removeCapability(capabilities[capabilities.length - 1]);
    }
  };

  const remainingSuggestions = CAPABILITY_SUGGESTIONS.filter(
    (s) => !capabilities.some((c) => c.toLowerCase() === s.toLowerCase()),
  );

  // --- JSON formatting affordance --------------------------------------
  const formatJson = (field: "inputSchema" | "outputSchema") => {
    const raw = (form.getValues(field) ?? "").trim();
    if (!raw) return;
    try {
      const formatted = JSON.stringify(JSON.parse(raw), null, 2);
      form.setValue(field, formatted, { shouldValidate: true });
    } catch {
      toast.error("Could not format — the JSON is not valid yet.");
    }
  };

  // --- Submit -----------------------------------------------------------
  const onSubmit = (values: CreateAgentInput) => {
    startTransition(async () => {
      const result = await createAgent(values);
      if (result.ok) {
        toast.success(`${values.name} is live in the marketplace.`);
        router.push(`/agents/${result.slug}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* ----------------------------- Identity ----------------------------- */}
        <Card>
          <SectionHeader
            step={1}
            icon={Sparkles}
            title="Identity"
            description="How your agent shows up in search, cards and its public profile."
          />
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent name</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="e.g. Atlas Research"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short, memorable name. This becomes the listing&apos;s
                    headline.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="One line on what this agent does best"
                      maxLength={180}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between gap-3">
                    <FormDescription>
                      Shown on marketplace cards and search results.
                    </FormDescription>
                    <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                      {(field.value?.length ?? 0)}/180
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
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
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value
                        ? CATEGORY_META[field.value].blurb
                        : "Determines where your agent surfaces in the marketplace."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verified"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification</FormLabel>
                    <div className="border-border bg-muted/30 flex h-8 items-center justify-between gap-3 rounded-lg border px-3">
                      <span className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4" />
                        Mark as verified
                      </span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Verified agents get a trust badge. Admins review this for
                      production listings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overview</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Describe what this agent does, the inputs it expects, how it produces results, and what makes it reliable. Buyers read this before hiring."
                      className="min-h-36 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between gap-3">
                    <FormDescription>
                      Markdown-friendly. Cover scope, guarantees and limits.
                    </FormDescription>
                    <span className="text-muted-foreground/70 shrink-0 text-xs tabular-nums">
                      {(field.value?.length ?? 0)}/6000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner organization</FormLabel>
                  <input type="hidden" {...field} value={field.value ?? ""} />
                  <div className="border-border bg-muted/30 flex h-9 items-center gap-2 rounded-lg border px-3">
                    <Building2 className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-foreground truncate text-sm">
                      {organizationName ?? "Personal account"}
                    </span>
                  </div>
                  <FormDescription>
                    The agent is listed under your current organization. Team and
                    organization switching is coming soon.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ---------------------- Capabilities & pricing ---------------------- */}
        <Card>
          <SectionHeader
            step={2}
            icon={Boxes}
            title="Capabilities & pricing"
            description="What the agent can do, and what it charges to do it."
          />
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="capabilities"
              render={() => (
                <FormItem>
                  <FormLabel>Capabilities</FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-h-16 w-full flex-wrap items-center gap-1.5 rounded-lg border p-2 transition-colors focus-within:ring-3",
                      )}
                      onClick={(e) => {
                        const input =
                          e.currentTarget.querySelector("input");
                        input?.focus();
                      }}
                    >
                      {capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="border-border bg-card text-foreground inline-flex items-center gap-1 rounded-md border py-0.5 pr-1 pl-2 text-xs font-medium"
                        >
                          {capability}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCapability(capability);
                            }}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50 -mr-0.5 flex size-4 items-center justify-center rounded transition-colors outline-none focus-visible:ring-2"
                            aria-label={`Remove ${capability}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={capabilityDraft}
                        onChange={(e) => setCapabilityDraft(e.target.value)}
                        onKeyDown={handleCapabilityKeyDown}
                        onBlur={() => {
                          if (capabilityDraft.trim())
                            addCapability(capabilityDraft);
                        }}
                        disabled={capabilities.length >= MAX_CAPABILITIES}
                        placeholder={
                          capabilities.length === 0
                            ? "Type a capability and press Enter"
                            : "Add another…"
                        }
                        className="placeholder:text-muted-foreground text-foreground h-6 min-w-40 flex-1 bg-transparent px-1 text-sm outline-none disabled:cursor-not-allowed"
                        aria-label="Add a capability"
                      />
                    </div>
                  </FormControl>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <FormDescription>
                      Press Enter or comma to add. {capabilities.length}/
                      {MAX_CAPABILITIES} used.
                    </FormDescription>
                  </div>
                  {remainingSuggestions.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-muted-foreground/70 inline-flex items-center gap-1 text-xs">
                        <Tag className="size-3" />
                        Try:
                      </span>
                      {remainingSuggestions.slice(0, 5).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addCapability(suggestion)}
                          className="border-border/70 bg-muted/40 text-muted-foreground hover:border-brand/40 hover:text-foreground rounded-md border px-2 py-0.5 text-xs transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing model</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "free") {
                          form.setValue("startingPrice", 0, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICING_MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {PRICING_MODEL_META[model].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How buyers are charged when they hire this agent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Starting price{" "}
                      <span className="text-muted-foreground font-normal">
                        {isFree
                          ? "(free)"
                          : PRICING_MODEL_META[pricingModel].suffix}
                      </span>
                    </FormLabel>
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
                          disabled={isFree}
                          placeholder="0.00"
                          className="pl-6"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {isFree
                        ? "Free agents are listed at no cost to buyers."
                        : "Billed in USD. You can refine tiered pricing later."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* --------------------------- Integration ---------------------------- */}
        <Card>
          <SectionHeader
            step={3}
            icon={Plug}
            title="Integration"
            description="Where Agent Market reaches your agent to dispatch tasks. Both are optional."
          />
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="endpointUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTTP endpoint</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://api.youragent.dev/v1/run"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A POST endpoint that accepts a task contract and returns an
                    artifact.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mcpServerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MCP server URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://mcp.youragent.dev/sse"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Expose tools over the Model Context Protocol for richer,
                    streaming interactions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ----------------------------- Schemas ------------------------------ */}
        <Card>
          <SectionHeader
            step={4}
            icon={Code2}
            title="Schemas"
            description="Declare the contracts buyers should send and the structure you return."
          />
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="inputSchema"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Input schema</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => formatJson("inputSchema")}
                      disabled={!inputSchemaValue?.trim()}
                    >
                      <Wand2 className="size-3" />
                      Format
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      rows={8}
                      spellCheck={false}
                      placeholder={PLACEHOLDER_INPUT_SCHEMA}
                      className="min-h-44 resize-y font-mono text-xs leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <JsonHint value={inputSchemaValue} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outputSchema"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Output schema</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => formatJson("outputSchema")}
                      disabled={!outputSchemaValue?.trim()}
                    >
                      <Wand2 className="size-3" />
                      Format
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      rows={8}
                      spellCheck={false}
                      placeholder={PLACEHOLDER_OUTPUT_SCHEMA}
                      className="min-h-44 resize-y font-mono text-xs leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <JsonHint value={outputSchemaValue} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ----------------------------- Actions ------------------------------ */}
        <div className="border-border bg-card/60 supports-[backdrop-filter]:bg-card/40 sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Your agent goes live immediately and can start accepting tasks.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => router.push("/marketplace")}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Publish agent
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
