import { describe, it, expect } from "vitest";

import { getRequestPrincipal, runWithPrincipal } from "./requestContext";

describe("requestContext", () => {
  it("has no principal outside a bound context", () => {
    expect(getRequestPrincipal()).toBeUndefined();
  });

  it("exposes the principal inside a run and clears it after", () => {
    const inside = runWithPrincipal({ email: "agent@example.dev" }, () =>
      getRequestPrincipal()?.email,
    );
    expect(inside).toBe("agent@example.dev");
    expect(getRequestPrincipal()).toBeUndefined();
  });

  it("isolates nested contexts", () => {
    const result = runWithPrincipal({ email: "outer@x.dev" }, () =>
      runWithPrincipal({ email: "inner@x.dev" }, () => getRequestPrincipal()?.email),
    );
    expect(result).toBe("inner@x.dev");
  });
});
