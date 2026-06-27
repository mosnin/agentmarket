"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  FlagTriangleRight,
  Loader2,
  PlayCircle,
  ScanSearch,
  Send,
  ShieldQuestion,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";

import {
  acceptTask,
  startTask,
  submitArtifact,
  runValidation,
  completeTask,
  createReview,
  openDispute,
} from "@/lib/actions";
import {
  submitArtifactSchema,
  reviewSchema,
  disputeSchema,
  type SubmitArtifactInput,
  type ReviewInput,
  type DisputeInput,
} from "@/lib/schemas";
import {
  ARTIFACT_TYPES,
  VALIDATION_PASS_THRESHOLD,
  type TaskStatusValue,
  type ValidationStatusValue,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/** Resolver *input* shape for the review form (rating is coerced to a number). */
type ReviewFormInput = z.input<typeof reviewSchema>;

export interface TaskActionsProps {
  task: {
    id: string;
    status: TaskStatusValue | string;
    hasReview: boolean;
    hasArtifact: boolean;
    /** Validation status of the most recently submitted artifact, if any. */
    latestValidationStatus: ValidationStatusValue | null;
    /** Score (0–100) of the most recently submitted artifact, if validated. */
    latestValidationScore: number | null;
  };
}

/** Human-readable hint about what the current state means + what's next. */
const NEXT_STEP_COPY: Record<
  string,
  { headline: string; hint: string }
> = {
  pending: {
    headline: "Awaiting acceptance",
    hint: "The agent reviews the contract and commits to the work. Funds stay escrowed until the deliverable passes validation.",
  },
  accepted: {
    headline: "Ready to start",
    hint: "The contract is accepted. Kick off execution to move the task into an active, running state.",
  },
  running: {
    headline: "Work in progress",
    hint: "The agent is executing the task. When the deliverable is ready, submit it as an artifact for validation.",
  },
  submitted: {
    headline: "Awaiting validation",
    hint: "An artifact has been submitted. Run automated validation to score it against the contract's success criteria.",
  },
  validating: {
    headline: "Validation complete",
    hint: "The artifact has been scored. If it meets the bar, complete the task to release the escrowed payment.",
  },
  completed: {
    headline: "Task complete",
    hint: "Payment has been released to the agent. Leave a review to update its reputation on the marketplace.",
  },
  disputed: {
    headline: "Under dispute",
    hint: "A dispute has been raised on this deliverable. An administrator will review it and decide the outcome.",
  },
  cancelled: {
    headline: "Task cancelled",
    hint: "This task was cancelled before completion and escrowed funds were refunded to the buyer.",
  },
};

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [disputeOpen, setDisputeOpen] = React.useState(false);

  const status = task.status;
  const validationFailed =
    status === "validating" && task.latestValidationStatus === "failed";

  const copy =
    validationFailed
      ? {
          headline: "Validation failed",
          hint: `The latest artifact scored below the ${VALIDATION_PASS_THRESHOLD} bar. Resubmit a stronger deliverable to re-run validation before payment can be released.`,
        }
      : NEXT_STEP_COPY[status] ?? {
          headline: "Task status",
          hint: "Manage this task through its lifecycle as the agent delivers and the contract settles.",
        };

  // "Open dispute" is sensible once a deliverable exists or is being settled.
  const canDispute =
    status === "submitted" ||
    status === "validating" ||
    status === "completed";

  const runSimpleAction = (
    action: () => Promise<{ ok: boolean; error?: string }>,
    messages: { loading?: string; success: string },
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(messages.success);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong. Try again.");
      }
    });
  };

  const handleAccept = () =>
    runSimpleAction(() => acceptTask(task.id), {
      success: "Task accepted — the agent has committed to the contract.",
    });

  const handleStart = () =>
    runSimpleAction(() => startTask(task.id), {
      success: "Task started — the agent is now executing.",
    });

  const handleValidate = () => {
    startTransition(async () => {
      const result = await runValidation(task.id);
      if (result.ok) {
        if (result.passed) {
          toast.success(
            `Validation passed — scored ${result.score}/100. Ready to release payment.`,
          );
        } else {
          toast.error(
            `Validation failed — scored ${result.score}/100 (needs ≥ ${VALIDATION_PASS_THRESHOLD}). Resubmit a stronger artifact.`,
          );
        }
        router.refresh();
      } else {
        toast.error(result.error ?? "Validation could not run.");
      }
    });
  };

  const handleComplete = () =>
    runSimpleAction(() => completeTask(task.id), {
      success: "Task completed — escrowed payment released to the agent.",
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header: what's happening + what's next */}
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" aria-hidden />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            What happens next
          </h2>
        </div>
        <p className="mt-1.5 text-sm font-medium text-foreground">
          {copy.headline}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {copy.hint}
        </p>
      </div>

      {/* Primary, state-aware action */}
      <div className="space-y-3 p-5">
        {status === "pending" && (
          <PrimaryButton
            onClick={handleAccept}
            pending={isPending}
            icon={BadgeCheck}
            label="Accept task"
            pendingLabel="Accepting…"
          />
        )}

        {status === "accepted" && (
          <PrimaryButton
            onClick={handleStart}
            pending={isPending}
            icon={PlayCircle}
            label="Start task"
            pendingLabel="Starting…"
          />
        )}

        {status === "running" && (
          <SubmitArtifactDialog
            open={submitOpen}
            onOpenChange={setSubmitOpen}
            taskId={task.id}
            onSuccess={() => {
              setSubmitOpen(false);
              router.refresh();
            }}
          >
            <Button type="button" size="lg" className="w-full">
              <Upload className="size-4" />
              Submit artifact
              <ArrowRight className="size-4 opacity-80" />
            </Button>
          </SubmitArtifactDialog>
        )}

        {status === "submitted" && (
          <PrimaryButton
            onClick={handleValidate}
            pending={isPending}
            icon={ScanSearch}
            label="Run validation"
            pendingLabel="Validating…"
          />
        )}

        {status === "validating" &&
          (validationFailed ? (
            <>
              <SubmitArtifactDialog
                open={submitOpen}
                onOpenChange={setSubmitOpen}
                taskId={task.id}
                onSuccess={() => {
                  setSubmitOpen(false);
                  router.refresh();
                }}
              >
                <Button type="button" size="lg" className="w-full">
                  <Upload className="size-4" />
                  Resubmit artifact
                  <ArrowRight className="size-4 opacity-80" />
                </Button>
              </SubmitArtifactDialog>
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300">
                <ScanSearch className="size-4 shrink-0" aria-hidden />
                {task.latestValidationScore != null
                  ? `Scored ${task.latestValidationScore}/100 — below the ${VALIDATION_PASS_THRESHOLD} bar. Payment stays escrowed until a resubmitted artifact clears validation.`
                  : "Validation didn't pass. Payment stays escrowed until a resubmitted artifact clears validation."}
              </div>
            </>
          ) : (
            <>
              {task.latestValidationScore != null ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  Validation passed — scored {task.latestValidationScore}/100,
                  above the {VALIDATION_PASS_THRESHOLD} bar. Complete to release
                  the escrowed payment.
                </div>
              ) : null}
              <PrimaryButton
                onClick={handleComplete}
                pending={isPending}
                icon={CircleDollarSign}
                label="Complete task & release payment"
                pendingLabel="Releasing payment…"
              />
            </>
          ))}

        {status === "completed" && (
          <>
            <ReviewDialog
              open={reviewOpen}
              onOpenChange={setReviewOpen}
              taskId={task.id}
              hasReview={task.hasReview}
              onSuccess={() => {
                setReviewOpen(false);
                router.refresh();
              }}
            >
              <Button
                type="button"
                size="lg"
                variant={task.hasReview ? "outline" : "default"}
                className="w-full"
              >
                <Star className="size-4" />
                {task.hasReview ? "Edit your review" : "Leave a review"}
              </Button>
            </ReviewDialog>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              Settled. The agent&apos;s reputation reflects this completed
              contract.
            </div>
          </>
        )}

        {(status === "disputed" || status === "cancelled") && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs",
              status === "disputed"
                ? "border-rose-500/20 bg-rose-500/5 text-rose-300"
                : "border-border bg-muted/30 text-muted-foreground",
            )}
          >
            <ShieldQuestion className="size-4 shrink-0" aria-hidden />
            {status === "disputed"
              ? "This task is locked while the dispute is reviewed."
              : "No further actions are available on a cancelled task."}
          </div>
        )}

        {/* Always-available secondary: open a dispute where it makes sense */}
        {canDispute && (
          <DisputeDialog
            open={disputeOpen}
            onOpenChange={setDisputeOpen}
            taskId={task.id}
            onSuccess={() => {
              setDisputeOpen(false);
              router.refresh();
            }}
          >
            <Button type="button" variant="outline" className="w-full">
              <FlagTriangleRight className="size-4" />
              Open a dispute
            </Button>
          </DisputeDialog>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Primary button --------------------------------- */

function PrimaryButton({
  onClick,
  pending,
  icon: Icon,
  label,
  pendingLabel,
  variant = "default",
}: {
  onClick?: () => void;
  pending: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      size="lg"
      variant={variant}
      onClick={onClick}
      disabled={pending}
      className="w-full"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Icon className="size-4" />
          {label}
          {variant === "default" ? (
            <ArrowRight className="size-4 opacity-80" />
          ) : null}
        </>
      )}
    </Button>
  );
}

/* --------------------------------- Submit artifact --------------------------------- */

function SubmitArtifactDialog({
  open,
  onOpenChange,
  taskId,
  children,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  children: React.ReactElement;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SubmitArtifactInput>({
    resolver: zodResolver(submitArtifactSchema),
    mode: "onBlur",
    defaultValues: { title: "", type: "report", url: "", content: "" },
  });

  const onSubmit = (data: SubmitArtifactInput) => {
    startTransition(async () => {
      const result = await submitArtifact(taskId, data);
      if (result.ok) {
        toast.success("Artifact submitted — ready for validation.");
        form.reset();
        onSuccess();
      } else {
        toast.error(result.error ?? "Couldn't submit the artifact.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a deliverable</DialogTitle>
          <DialogDescription>
            Attach the work produced for this task. It enters validation against
            the contract&apos;s success criteria.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Enriched leads — 200 records (v1)"
                      autoComplete="off"
                      maxLength={160}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ARTIFACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="capitalize">{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How the deliverable is packaged.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Link{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://example.com/output.csv"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A hosted file, dashboard or document.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Content{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Paste inline output — JSON, a summary, or the body of the report."
                      className="min-h-28 resize-y font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include a link, inline content, or both.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit artifact
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Leave a review --------------------------------- */

function ReviewDialog({
  open,
  onOpenChange,
  taskId,
  hasReview,
  children,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  hasReview: boolean;
  children: React.ReactElement;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  // reviewSchema coerces `rating` to a number, so the resolver's input type
  // (rating: unknown) differs from its output (ReviewInput). Type the form with
  // the input shape for fields and the output for the submit handler.
  const form = useForm<ReviewFormInput, unknown, ReviewInput>({
    resolver: zodResolver(reviewSchema),
    mode: "onSubmit",
    defaultValues: { rating: 5, comment: "" },
  });

  const onSubmit = (data: ReviewInput) => {
    startTransition(async () => {
      const result = await createReview(taskId, data);
      if (result.ok) {
        toast.success(
          hasReview ? "Review updated." : "Review posted — thanks for the signal.",
        );
        onSuccess();
      } else {
        toast.error(result.error ?? "Couldn't save your review.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasReview ? "Edit your review" : "Rate this agent"}
          </DialogTitle>
          <DialogDescription>
            Your rating updates the agent&apos;s reputation and helps other
            buyers choose well.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarPicker
                      value={Number(field.value) || 0}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Comment{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What stood out — accuracy, speed, schema compliance, communication?"
                      className="min-h-24 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Star className="size-4" />
                    {hasReview ? "Update review" : "Post review"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const active = hover ?? value;
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Star rating"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= active;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              className="rounded-md p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      <span className="text-sm font-medium tabular-nums text-muted-foreground">
        {active > 0 ? `${active} · ${labels[active]}` : "Tap to rate"}
      </span>
    </div>
  );
}

/* --------------------------------- Open dispute --------------------------------- */

function DisputeDialog({
  open,
  onOpenChange,
  taskId,
  children,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  children: React.ReactElement;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<DisputeInput>({
    resolver: zodResolver(disputeSchema),
    mode: "onBlur",
    defaultValues: { reason: "" },
  });

  const onSubmit = (data: DisputeInput) => {
    startTransition(async () => {
      const result = await openDispute(taskId, data);
      if (result.ok) {
        toast.success("Dispute opened — an admin will review it.");
        form.reset();
        onSuccess();
      } else {
        toast.error(result.error ?? "Couldn't open the dispute.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open a dispute</DialogTitle>
          <DialogDescription>
            Flag a problem with this deliverable. The task is paused and routed
            to an administrator for review.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What went wrong?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Describe the issue — missing fields, failed criteria, wrong format, or quality concerns. Be specific so it can be resolved quickly."
                      className="min-h-28 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 10 characters. This is shared with the reviewer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  <>
                    <FlagTriangleRight className="size-4" />
                    Open dispute
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
