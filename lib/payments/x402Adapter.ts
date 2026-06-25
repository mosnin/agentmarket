import { mockHash } from "@/lib/utils";

/**
 * x402 payment adapter (MOCK).
 *
 * x402 is an HTTP-native payment protocol where a server answers `402 Payment
 * Required` with machine-readable payment requirements, the client pays, and
 * retries with a payment proof. This adapter exposes the same surface a real
 * x402 facilitator would, but settles everything locally so the MVP works with
 * no wallet or facilitator configured.
 *
 * To go live: set `X402_FACILITATOR_URL` and replace the bodies below with calls
 * to your facilitator (create requirement, verify proof, settle/release).
 */

export type Currency = "USD" | "USDC" | "EUR";

export interface PaymentRequirement {
  scheme: "x402-mock";
  network: string;
  amount: number;
  currency: Currency | string;
  payTo: string;
  resource: string;
  description: string;
  nonce: string;
  expiresAt: string;
}

export interface PaymentReceipt {
  ok: boolean;
  transactionHash: string;
  amount: number;
  currency: string;
  settledAt: string;
  provider: string;
}

const PROVIDER = "mock_x402";
const isLive = Boolean(process.env.X402_FACILITATOR_URL);

export function createPaymentRequirement(params: {
  taskId: string;
  amount: number;
  currency?: string;
  payTo?: string;
  description?: string;
}): PaymentRequirement {
  return {
    scheme: "x402-mock",
    network: isLive ? "base-mainnet" : "mock-net",
    amount: params.amount,
    currency: params.currency ?? "USD",
    payTo: params.payTo ?? "0xA9ENTMARKET000000000000000000000000ESCROW",
    resource: `/api/tasks/${params.taskId}`,
    description: params.description ?? `Escrow for task ${params.taskId}`,
    nonce: mockHash("", `nonce:${params.taskId}:${params.amount}`),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
}

export async function verifyPayment(params: {
  taskId: string;
  amount: number;
}): Promise<{ verified: boolean; reason?: string }> {
  // Mock: any non-negative amount is considered verified.
  return { verified: params.amount >= 0 };
}

export async function releasePayment(params: {
  taskId: string;
  amount: number;
  currency?: string;
}): Promise<PaymentReceipt> {
  return {
    ok: true,
    transactionHash: mockHash("0x", `release:${params.taskId}:${params.amount}`),
    amount: params.amount,
    currency: params.currency ?? "USD",
    settledAt: new Date().toISOString(),
    provider: PROVIDER,
  };
}

export async function refundPayment(params: {
  taskId: string;
  amount: number;
  currency?: string;
}): Promise<PaymentReceipt> {
  return {
    ok: true,
    transactionHash: mockHash("0x", `refund:${params.taskId}:${params.amount}`),
    amount: params.amount,
    currency: params.currency ?? "USD",
    settledAt: new Date().toISOString(),
    provider: PROVIDER,
  };
}

export const x402 = {
  provider: PROVIDER,
  isLive,
  createPaymentRequirement,
  verifyPayment,
  releasePayment,
  refundPayment,
};
