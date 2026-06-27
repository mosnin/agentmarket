// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { RelativeTime } from "./relative-time";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

afterEach(cleanup);

describe("RelativeTime", () => {
  it("renders a <time> with dateTime, relative content and an exact-time title", () => {
    const d = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
    const { container } = render(<RelativeTime date={d} />);
    const time = container.querySelector("time");
    expect(time).toBeTruthy();
    expect(time?.getAttribute("datetime")).toBe(d.toISOString());
    expect(time?.textContent).toBe(formatRelativeTime(d));
    expect(time?.textContent).toContain("ago");
    expect(time?.getAttribute("title")).toBe(formatDateTime(d));
  });

  it("accepts a string date and still emits an ISO dateTime", () => {
    const iso = "2026-06-01T00:00:00.000Z";
    const { container } = render(<RelativeTime date={iso} />);
    expect(container.querySelector("time")?.getAttribute("datetime")).toBe(
      new Date(iso).toISOString(),
    );
  });

  it("forwards a className to the time element", () => {
    const { container } = render(<RelativeTime date={Date.now()} className="text-xs" />);
    expect(container.querySelector("time")?.className).toContain("text-xs");
  });
});
