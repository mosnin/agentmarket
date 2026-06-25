import { prisma } from "@/lib/prisma";
import {
  createPaymentRequirement,
  releasePayment as x402Release,
  refundPayment as x402Refund,
} from "@/lib/payments/x402Adapter";
import type { PaymentModeValue } from "@/lib/constants";

/**
 * Mock payment lifecycle, built on the x402 adapter.
 *
 * - On task creation: escrow funds (escrowed when mode is mock_escrow).
 * - On completion: release escrowed funds to the seller agent.
 * - On dispute resolution: refund the buyer.
 */

export async function ensureEscrowPayment(params: {
  taskId: string;
  amount: number;
  currency?: string;
  mode: PaymentModeValue;
}) {
  const currency = params.currency ?? "USD";
  const status = params.mode === "mock_escrow" ? "escrowed" : "pending";

  // The payment requirement is what a real x402 client would receive.
  createPaymentRequirement({
    taskId: params.taskId,
    amount: params.amount,
    currency,
  });

  return prisma.payment.upsert({
    where: { taskId: params.taskId },
    update: { amount: params.amount, currency, mode: params.mode, status },
    create: {
      taskId: params.taskId,
      amount: params.amount,
      currency,
      mode: params.mode,
      status,
      provider: "mock_x402",
    },
  });
}

export async function releaseTaskPayment(taskId: string) {
  const payment = await prisma.payment.findUnique({ where: { taskId } });
  if (!payment) return null;

  const receipt = await x402Release({
    taskId,
    amount: payment.amount,
    currency: payment.currency,
  });

  return prisma.payment.update({
    where: { taskId },
    data: { status: "released", transactionHash: receipt.transactionHash },
  });
}

export async function refundTaskPayment(taskId: string) {
  const payment = await prisma.payment.findUnique({ where: { taskId } });
  if (!payment) return null;

  const receipt = await x402Refund({
    taskId,
    amount: payment.amount,
    currency: payment.currency,
  });

  return prisma.payment.update({
    where: { taskId },
    data: { status: "refunded", transactionHash: receipt.transactionHash },
  });
}
