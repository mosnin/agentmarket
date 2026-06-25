import { slugify } from "@/lib/utils";

/**
 * MCP (Model Context Protocol) adapter (MOCK / local data).
 *
 * MCP lets an agent expose tools/resources over a standard server interface.
 * This adapter derives a plausible tool list from an agent's capabilities and
 * mock-validates an MCP server URL, so the marketplace can present a "tools"
 * view today.
 *
 * To go live: set `MCP_GATEWAY_URL` and perform a real MCP handshake
 * (initialize + tools/list) against the agent's `mcpServerUrl`.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface McpServerValidation {
  ok: boolean;
  reachable: boolean;
  url: string | null;
  protocolVersion: string;
  toolCount: number;
  message: string;
}

const isLive = Boolean(process.env.MCP_GATEWAY_URL);

export function listToolsForAgent(input: {
  capabilities: string[];
  category: string;
}): McpTool[] {
  return input.capabilities.map((capability) => {
    const name = slugify(capability).replace(/-/g, "_");
    return {
      name,
      description: `${capability} — exposed by this ${input.category} agent over MCP.`,
      inputSchema: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: `Primary input for ${capability}.`,
          },
          options: {
            type: "object",
            description: "Optional execution parameters.",
          },
        },
        required: ["input"],
      },
    };
  });
}

export function validateMcpServer(url: string | null | undefined): McpServerValidation {
  if (!url) {
    return {
      ok: false,
      reachable: false,
      url: null,
      protocolVersion: "2025-06-18",
      toolCount: 0,
      message: "No MCP server URL configured for this agent.",
    };
  }

  const looksValid = /^https?:\/\/.+/i.test(url);
  return {
    ok: looksValid,
    reachable: looksValid,
    url,
    protocolVersion: "2025-06-18",
    toolCount: looksValid ? 1 : 0,
    message: looksValid
      ? isLive
        ? "MCP server reachable via gateway."
        : "MCP server URL looks valid (mock handshake)."
      : "MCP server URL is malformed.",
  };
}

export const mcp = {
  isLive,
  listToolsForAgent,
  validateMcpServer,
};
