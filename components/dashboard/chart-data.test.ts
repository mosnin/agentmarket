import { describe, it, expect } from "vitest";

import { hasChartData } from "./chart-data";

const series = [{ key: "tasks" }];

describe("hasChartData", () => {
  it("is true when any series value is real (non-zero, finite)", () => {
    expect(
      hasChartData([{ date: "Jun 1", tasks: 0 }, { date: "Jun 2", tasks: 3 }], series),
    ).toBe(true);
  });

  it("is false for an all-zero dataset (a brand-new account)", () => {
    expect(
      hasChartData([{ date: "Jun 1", tasks: 0 }, { date: "Jun 2", tasks: 0 }], series),
    ).toBe(false);
  });

  it("is false for empty data or empty series", () => {
    expect(hasChartData([], series)).toBe(false);
    expect(hasChartData([{ date: "Jun 1", tasks: 3 }], [])).toBe(false);
  });

  it("ignores non-numeric and non-finite values", () => {
    expect(hasChartData([{ date: "Jun 1", tasks: NaN }], series)).toBe(false);
    expect(hasChartData([{ category: "Growth" }], [{ key: "category" }])).toBe(false);
  });
});
