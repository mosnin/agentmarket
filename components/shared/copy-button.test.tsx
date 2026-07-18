// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { CopyButton } from "./copy-button";

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});
afterEach(cleanup);

describe("CopyButton", () => {
  it("shows the label and uses it as the accessible name", () => {
    render(<CopyButton value="hash_123" label="Copy hash" />);
    const button = screen.getByRole("button", { name: "Copy hash" });
    expect(button.textContent).toContain("Copy hash");
  });

  it("copies the value and flips to a confirmation on click", async () => {
    render(<CopyButton value="hash_123" label="Copy hash" />);
    fireEvent.click(screen.getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("hash_123");
    // Once the clipboard write resolves, the control confirms with "Copied".
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("uses srLabel as the accessible name when the visible label isn't descriptive", () => {
    render(<CopyButton value="0xabc123" label="0x…123" srLabel="Copy transaction hash" />);
    expect(screen.getByRole("button", { name: "Copy transaction hash" })).toBeTruthy();
  });

  it("stays on the label when the clipboard write fails", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<CopyButton value="x" label="Copy" />);
    fireEvent.click(screen.getByRole("button"));
    await Promise.resolve(); // let the rejected promise settle
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  });
});
