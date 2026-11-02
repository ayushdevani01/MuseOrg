import type { ConnectionCatalogItem } from "@rakazo/contracts";
import { MCP_PRESETS } from "./mcp-presets.js";
import { POPULAR_INTEGRATION_ICONS } from "./popular-integration-icons.js";

/** Browse metadata only. An entry never registers a connection or grants app access. */
export const POPULAR_INTEGRATIONS = [
  {
    id: "gmail",
    name: "Gmail",
    aliases: ["gmail", "googlemail"],
    iconPath: POPULAR_INTEGRATION_ICONS.gmail,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    aliases: ["googledrive", "gdrive"],
    iconPath: POPULAR_INTEGRATION_ICONS.googledrive,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    aliases: ["googlecalendar", "gcal"],
    iconPath: POPULAR_INTEGRATION_ICONS.googlecalendar,
  },
  {
    id: "slack",
    name: "Slack",
    aliases: ["slack", "slackbot"],
    iconPath: POPULAR_INTEGRATION_ICONS.slack,
  },
  {
    id: "github",
    name: "GitHub",
    aliases: ["github"],
    presetId: "github",
    iconPath: MCP_PRESETS.find((preset) => preset.id === "github")!.iconPath,
  },
  {
    id: "notion",
    name: "Notion",
    aliases: ["notion", "notionso"],
    presetId: "notion",
    iconPath: MCP_PRESETS.find((preset) => preset.id === "notion")!.iconPath,
  },
  {
    id: "linear",
    name: "Linear",
    aliases: ["linear"],
    presetId: "linear",
    iconPath: MCP_PRESETS.find((preset) => preset.id === "linear")!.iconPath,
  },
  {
    id: "outlook",
    name: "Outlook Email",
    aliases: ["outlook", "outlookemail", "microsoftoutlook"],
    iconPath: POPULAR_INTEGRATION_ICONS.microsoftoutlook,
  },
  {
    id: "supabase",
    name: "Supabase",
    aliases: ["supabase"],
    presetId: "supabase",
    iconPath: POPULAR_INTEGRATION_ICONS.supabase,
  },
  {
    id: "instagram",
    name: "Instagram",
    aliases: ["instagram"],
    iconPath: POPULAR_INTEGRATION_ICONS.instagram,
  },
  {
    id: "facebook-ads",
    name: "Meta Ads",
    aliases: ["facebookads", "metaads"],
    iconPath: POPULAR_INTEGRATION_ICONS.facebook,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    aliases: ["whatsapp", "whatsappbusiness"],
    iconPath: POPULAR_INTEGRATION_ICONS.whatsapp,
  },
] as const;

export type PopularIntegration = (typeof POPULAR_INTEGRATIONS)[number];

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function popularIntegrationForCatalogItem(
  item: Pick<ConnectionCatalogItem, "slug" | "name">,
) {
  return POPULAR_INTEGRATIONS.find((app) =>
    [app.id, app.name, ...app.aliases].some((alias) =>
      [item.slug, item.name].some((value) => normalized(value) === normalized(alias)),
    ),
  );
}

export function filterPopularIntegrations(query: string) {
  const needle = normalized(query);
  return POPULAR_INTEGRATIONS.filter((app) =>
    [app.id, app.name, ...app.aliases].some((value) => normalized(value).includes(needle)),
  );
}
