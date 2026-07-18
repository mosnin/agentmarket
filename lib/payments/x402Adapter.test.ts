import { describe, it, expect } from "vitest";

import {
  createPaymentRequirement,
  verifyPayment,
  releasePayment,
  refundPayment,
} from "@/lib/payments/x402Adapter";

describe("createPaymentRequirement", () => {
  it("emits a well-formed x402 challenge with sensible defaults", () => {
    const req = createPaymentRequirement({ taskId: "task_1", amount: 50 });
    expect(req.scheme).toBe("x402-mock");
    expect(req.amount).toBe(50);
    expect(req.currency).toBe("USD");
    expect(req.payTo).toBeTruthy();
    expect(req.resource).toBe("/api/tasks/task_1");
    expect(req.description).toContain("task_1");
  });

  it("honors a custom currency, payTo and description", () => {
    const req = createPaymentRequirement({
      taskId: "task_2",
      amount: 10,
      currency: "USDC",
      payTo: "0xCAFE",
      description: "Bounty payout",
    });
    expect(req.currency).toBe("USDC");
    expect(req.payTo).toBe("0xCAFE");
    expect(req.description).toBe("Bounty payout");
  });

  it("derives a deterministic hex nonce from task + amount", () => {
    const a = createPaymentRequirement({ taskId: "task_1", amount: 50 });
    const b = createPaymentRequirement({ taskId: "task_1", amount: 50 });
    expect(a.nonce).toBe(b.nonce);
    expect(a.nonce).toMatch(/^[0-9a-f]+$/);
    // A different amount yields a different challenge nonce.
    const c = createPaymentRequirement({ taskId: "task_1", amount: 51 });
    expect(c.nonce).not.toBe(a.nonce);
  });

  it("sets an expiry in the future", () => {
    const req = createPaymentRequirement({ taskId: "task_1", amount: 50 });
    expect(new Date(req.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("verifyPayment", () => {
  it("verifies a non-negative amount", async () => {
    expect((await verifyPayment({ taskId: "t", amount: 0 })).verified).toBe(true);
    expect((await verifyPayment({ taskId: "t", amount: 25 })).verified).toBe(true);
  });

  it("rejects a negative amount", async () => {
    expect((await verifyPayment({ taskId: "t", amount: -1 })).verified).toBe(false);
  });
});

describe("releasePayment / refundPayment", () => {
  it("releases with an ok receipt and a 0x transaction hash", async () => {
    const receipt = await releasePayment({ taskId: "task_1", amount: 50 });
    expect(receipt.ok).toBe(true);
    expect(receipt.amount).toBe(50);
    expect(receipt.currency).toBe("USD");
    expect(receipt.transactionHash).toMatch(/^0x[0-9a-f]+$/);
    expect(receipt.provider).toBe("mock_x402");
  });

  it("produces deterministic, operation-distinct transaction hashes", async () => {
    const release = await releasePayment({ taskId: "task_1", amount: 50 });
    const releaseAgain = await releasePayment({ taskId: "task_1", amount: 50 });
    const refund = await refundPayment({ taskId: "task_1", amount: 50 });
    // Same operation + inputs → same hash.
    expect(release.transactionHash).toBe(releaseAgain.transactionHash);
    // A refund of the same task/amount is a different transaction.
    expect(refund.transactionHash).not.toBe(release.transactionHash);
  });

  it("honors the currency on a refund", async () => {
    const receipt = await refundPayment({ taskId: "task_1", amount: 50, currency: "USDC" });
    expect(receipt.ok).toBe(true);
    expect(receipt.currency).toBe("USDC");
  });
});
