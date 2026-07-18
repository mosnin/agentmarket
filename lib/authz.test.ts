import { describe, it, expect } from "vitest";

import {
  isAdmin,
  canManageAgent,
  canActAsBuyer,
  canActAsSeller,
  isTaskParticipant,
} from "./authz";

const admin = { id: "u-admin", role: "admin" };
const alice = { id: "u-alice", role: "user" };
const bob = { id: "u-bob", role: "user" };

describe("isAdmin", () => {
  it("is true only for the admin role", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
    expect(isAdmin({ role: "user" })).toBe(false);
  });
});

describe("canManageAgent", () => {
  it("allows the owner, denies a non-owner, allows an admin", () => {
    expect(canManageAgent(alice, { ownerId: "u-alice" })).toBe(true);
    expect(canManageAgent(bob, { ownerId: "u-alice" })).toBe(false);
    expect(canManageAgent(admin, { ownerId: "u-alice" })).toBe(true);
  });
});

describe("canActAsBuyer", () => {
  it("allows the buyer, denies others, allows admin", () => {
    expect(canActAsBuyer(alice, { buyerId: "u-alice" })).toBe(true);
    expect(canActAsBuyer(bob, { buyerId: "u-alice" })).toBe(false);
    expect(canActAsBuyer(admin, { buyerId: "u-alice" })).toBe(true);
  });
});

describe("canActAsSeller", () => {
  it("allows the seller agent's owner", () => {
    expect(canActAsSeller(alice, { sellerAgent: { ownerId: "u-alice" } })).toBe(true);
  });
  it("denies a non-owner and an unassigned task", () => {
    expect(canActAsSeller(bob, { sellerAgent: { ownerId: "u-alice" } })).toBe(false);
    expect(canActAsSeller(bob, { sellerAgent: null })).toBe(false);
  });
  it("allows an admin even when unassigned", () => {
    expect(canActAsSeller(admin, { sellerAgent: null })).toBe(true);
  });
});

describe("isTaskParticipant", () => {
  const task = { buyerId: "u-alice", sellerAgent: { ownerId: "u-bob" } };
  it("includes both parties and an admin, excludes outsiders", () => {
    expect(isTaskParticipant(alice, task)).toBe(true);
    expect(isTaskParticipant(bob, task)).toBe(true);
    expect(isTaskParticipant(admin, task)).toBe(true);
    expect(isTaskParticipant({ id: "u-carol", role: "user" }, task)).toBe(false);
  });
});
