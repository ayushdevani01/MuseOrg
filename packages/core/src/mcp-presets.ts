import { MCP_PRESET_ICONS } from "./mcp-preset-icons.js";
import { POPULAR_INTEGRATION_ICONS } from "./popular-integration-icons.js";

/** Reviewed official endpoints, not an installation or a grant of account access. */
export type McpPreset = {
  id: string;
  name: string;
  endpoint: string;
  docsUrl: string;
  auth: "none" | "bearer" | "oauth";
  supportsBearer?: boolean;
  iconPath: string;
};

export const MCP_PRESETS: readonly McpPreset[] = [
  {
    id: "github",
    name: "GitHub",
    endpoint: "https://api.githubcopilot.com/mcp/",
    docsUrl: "https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md",
    auth: "bearer",
    iconPath: MCP_PRESET_ICONS.github,
  },
  {
    id: "notion",
    name: "Notion",
    endpoint: "https://mcp.notion.com/mcp",
    docsUrl: "https://developers.notion.com/guides/mcp/get-started-with-mcp",
    auth: "oauth",
    iconPath: MCP_PRESET_ICONS.notion,
  },
  {
    id: "linear",
    name: "Linear",
    endpoint: "https://mcp.linear.app/mcp",
    docsUrl: "https://linear.app/docs/mcp",
    auth: "oauth",
    supportsBearer: true,
    iconPath: MCP_PRESET_ICONS.linear,
  },
  {
    id: "stripe",
    name: "Stripe",
    endpoint: "https://mcp.stripe.com/",
    docsUrl: "https://docs.stripe.com/mcp",
    auth: "oauth",
    supportsBearer: true,
    iconPath: MCP_PRESET_ICONS.stripe,
  },
  {
    id: "supabase",
    name: "Supabase",
    endpoint: "https://mcp.supabase.com/mcp",
    docsUrl: "https://supabase.com/docs/guides/ai-tools/mcp",
    auth: "oauth",
    iconPath: POPULAR_INTEGRATION_ICONS.supabase,
  },
  {
    id: "cloudflare-docs",
    name: "Cloudflare Docs",
    endpoint: "https://docs.mcp.cloudflare.com/mcp",
    docsUrl:
      "https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/",
    auth: "none",
    iconPath: MCP_PRESET_ICONS.cloudflare,
  },
  {
    id: "openai-docs",
    name: "OpenAI Docs",
    endpoint: "https://developers.openai.com/mcp",
    docsUrl: "https://developers.openai.com/learn/docs-mcp",
    auth: "none",
    iconPath: MCP_PRESET_ICONS.openai,
  },
];

/** Only the exact reviewed endpoint receives its brand; lookalike hosts do not. */
export function mcpPresetForEndpoint(endpoint: string | null | undefined) {
  if (!endpoint) return undefined;
  try {
    const url = new URL(endpoint);
    if (url.username || url.password || url.search || url.hash) return undefined;
    const normalized = url.href.replace(/\/$/, "");
    return MCP_PRESETS.find((preset) => preset.endpoint.replace(/\/$/, "") === normalized);
  } catch {
    return undefined;
  }
}
