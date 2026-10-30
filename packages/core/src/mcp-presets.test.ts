import { expect, it } from "vitest";
import { MCP_PRESETS, mcpPresetForEndpoint } from "./mcp-presets.js";

it("matches reviewed endpoints without trusting a lookalike host or URL credentials", () => {
  for (const preset of MCP_PRESETS) {
    expect(mcpPresetForEndpoint(preset.endpoint)?.id).toBe(preset.id);
    expect(mcpPresetForEndpoint(`${preset.endpoint.replace(/\/$/, "")}/`)?.id).toBe(preset.id);
    expect(mcpPresetForEndpoint(`${preset.endpoint}?token=fake`)).toBeUndefined();
    const url = new URL(preset.endpoint);
    url.hostname += ".example.test";
    expect(mcpPresetForEndpoint(url.href)).toBeUndefined();
    url.hostname = new URL(preset.endpoint).hostname;
    url.username = "fake";
    expect(mcpPresetForEndpoint(url.href)).toBeUndefined();
  }
  expect(mcpPresetForEndpoint("not a URL")).toBeUndefined();
  expect(mcpPresetForEndpoint(null)).toBeUndefined();
});
