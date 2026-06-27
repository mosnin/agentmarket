"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BadgeCheck,
  CheckCircle2,
  Gavel,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { verifyAgent, setAgentStatus, resolveDispute } from "@/lib/actions";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/* --------------------------------- Verify agent --------------------------------- */

/**
 * Marks an unverified agent as verified via the `verifyAgent` server action.
 * Uses a transition for pending UI, then toasts + refreshes the route so the
 * table re-reads from the database. Compact `sm` button to sit inside a row.
 */
export function VerifyAgentButton({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleVerify = () => {
    startTransition(async () => {
      const result = await verifyAgent(agentId);
      if (result.ok) {
        toast.success(`${agentName} is now verified.`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Couldn't verify the agent.");
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleVerify}
      disabled={isPending}
      className="text-brand hover:text-brand"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BadgeCheck className="size-3.5" />
      )}
      Verify
    </Button>
  );
}

/* ------------------------------ Suspend / Activate ------------------------------ */

/**
 * Toggles an agent between `active` and `suspended` via `setAgentStatus`.
 * Suspend is the destructive direction; reactivating uses a neutral ghost
 * button. Archived / draft agents fall back to a "Reactivate" affordance.
 */
export function AgentStatusToggle({
  agentId,
  agentName,
  status,
}: {
  agentId: string;
  agentName: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const isActive = status === "active";
  const next = isActive ? "suspended" : "active";

  const apply = () => {
    startTransition(async () => {
      const result = await setAgentStatus(agentId, next);
      if (result.ok) {
        toast.success(
          isActive
            ? `${agentName} has been suspended.`
            : `${agentName} is active again.`,
        );
        router.refresh();
      } else {
        toast.error(result.error ?? "Couldn't update the agent's status.");
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "destructive" : "ghost"}
      onClick={apply}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isActive ? (
        <PauseCircle className="size-3.5" />
      ) : (
        <PlayCircle className="size-3.5" />
      )}
      {isActive ? "Suspend" : "Activate"}
    </Button>
  );
}

/* --------------------------------- Resolve dispute --------------------------------- */

const resolveDisputeSchema = z.object({
  resolution: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters explaining the outcome.")
    .max(1000, "Keep the resolution under 1000 characters."),
});

type ResolveDisputeForm = z.infer<typeof resolveDisputeSchema>;

/**
 * Opens a small dialog to record a resolution note, then resolves the dispute
 * via `resolveDispute(id, resolution, "resolved")`. The trigger is a compact
 * row-level button. On success it toasts and refreshes the admin route.
 */
export function ResolveDisputeButton({
  disputeId,
  taskTitle,
}: {
  disputeId: string;
  taskTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ResolveDisputeForm>({
    resolver: zodResolver(resolveDisputeSchema),
    mode: "onBlur",
    defaultValues: { resolution: "" },
  });

  // Both outcomes record the same resolution note; only "resolved" credits the
  // agent's reputation (handled in the action). Returns a submit handler so the
  // textarea is validated before either decision is recorded.
  const submit = (outcome: "resolved" | "rejected") =>
    form.handleSubmit((data) => {
      startTransition(async () => {
        const result = await resolveDispute(disputeId, data.resolution, outcome);
        if (result.ok) {
          toast.success(
            outcome === "resolved" ? "Dispute resolved." : "Dispute rejected.",
          );
          form.reset();
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error ?? "Couldn't update the dispute.");
        }
      });
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" size="sm" variant="outline">
            <Gavel className="size-3.5" />
            Resolve
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve dispute</DialogTitle>
          <DialogDescription>
            Record how this dispute on{" "}
            <span className="font-medium text-foreground">{taskTitle}</span> was
            settled. The note is shared with both parties. Resolving credits the
            agent&apos;s reputation; rejecting the claim leaves it unchanged.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={submit("resolved")} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Summarize the decision — what was reviewed, the outcome, and any payout or refund applied."
                      className="min-h-28 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shared with both parties. Minimum 10 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" type="button" />}>
                Cancel
              </DialogClose>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={submit("rejected")}
              >
                <XCircle className="size-4" />
                Reject claim
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Mark resolved
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

/* ---------------------------- Verified state indicator ---------------------------- */

/**
 * Inline verified / unverified marker for the agents table. A green check chip
 * when verified, otherwise a muted "Unverified" pill. Pure presentational —
 * lives here so the agents table can stay a server component elsewhere.
 */
export function VerifiedIndicator({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
      <ShieldCheck className="size-3.5" aria-hidden />
      Verified
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
      Unverified
    </span>
  );
}
