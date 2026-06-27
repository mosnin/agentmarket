import { describe, it, expect } from "vitest";

import { listToolsForAgent, validateMcpServer } from "@/lib/interop/mcpAdapter";

describe("listToolsForAgent", () => {
  it("emits one tool per capability", () => {
    const tools = listToolsForAgent({
      capabilities: ["Lead Generation", "Data Enrichment"],
      category: "Growth",
    });
    expect(tools).toHaveLength(2);
  });

  it("derives a snake_case tool name from the capability", () => {
    const [tool] = listToolsForAgent({ capabilities: ["Lead Generation"], category: "Growth" });
    expect(tool.name).toBe("lead_generation");
  });

  it("builds a valid object inputSchema requiring `input`", () => {
    const [tool] = listToolsForAgent({ capabilities: ["Summarize"], category: "Research" });
    expect(tool.inputSchema.type).toBe("object");
    expect(tool.inputSchema.required).toEqual(["input"]);
    expect(Object.keys(tool.inputSchema.properties)).toEqual(
      expect.arrayContaining(["input", "options"]),
    );
  });

  it("mentions the capability and category in the description", () => {
    const [tool] = listToolsForAgent({ capabilities: ["Summarize"], category: "Research" });
    expect(tool.description).toContain("Summarize");
    expect(tool.description).toContain("Research");
    expect(tool.description).toContain("MCP");
  });

  it("returns an empty list for an agent with no capabilities", () => {
    expect(listToolsForAgent({ capabilities: [], category: "Growth" })).toEqual([]);
  });
});

describe("validateMcpServer", () => {
  it("reports 'not configured' for a missing URL", () => {
    for (const value of [null, undefined, ""]) {
      const result = validateMcpServer(value);
      expect(result.ok).toBe(false);
      expect(result.reachable).toBe(false);
      expect(result.url).toBeNull();
      expect(result.toolCount).toBe(0);
      expect(result.message).toMatch(/no mcp server url/i);
    }
  });

  it("accepts a well-formed https URL", () => {
    const result = validateMcpServer("https://mcp.example.com");
    expect(result.ok).toBe(true);
    expect(result.reachable).toBe(true);
    expect(result.url).toBe("https://mcp.example.com");
    expect(result.toolCount).toBe(1);
  });

  it("accepts http as well as https", () => {
    expect(validateMcpServer("http://localhost:3000/mcp").ok).toBe(true);
  });

  it("rejects a malformed URL", () => {
    const result = validateMcpServer("not-a-url");
    expect(result.ok).toBe(false);
    expect(result.reachable).toBe(false);
    expect(result.toolCount).toBe(0);
    expect(result.message).toMatch(/malformed/i);
  });

  it("always reports a protocol version", () => {
    expect(validateMcpServer("https://mcp.example.com").protocolVersion).toBeTruthy();
    expect(validateMcpServer(null).protocolVersion).toBeTruthy();
  });
});
