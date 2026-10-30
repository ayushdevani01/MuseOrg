import { expect, test } from "@playwright/test";
import { MCP_PRESETS } from "@rakazo/core";
import {
  captureScreenshot,
  completeOnboarding,
  expandAdvancedSection,
  rpc,
  signup,
} from "./helpers";

test("shows directly registered MCP servers in Integrations without catalog connections", async ({
  page,
}, testInfo) => {
  await signup(page, `direct-mcp-list-${Date.now()}@rakazo.test`, "password12", "Direct MCP List");
  await completeOnboarding(page);
  await page.goto("/app");
  await page.waitForURL(/\/app\/[^/]+$/);
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  await page.getByRole("button", { name: "Add integration", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add MCP server", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Server name", exact: true })).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Chief", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close MCP servers", exact: true }).click();
  for (const name of ["Dropbox", "GitHub"])
    await rpc(page, "mcp/servers/create", {
      slug: name.toLowerCase(),
      name,
      transport: "streamable_http",
      endpoint: `https://${name.toLowerCase()}.example.test/mcp`,
      secret: "fake-mcp-credential",
    });
  expect(await rpc(page, "connections/list", undefined)).toEqual([]);
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  const servers = page.getByTestId("registered-mcp-servers");
  await expect(servers.getByText("Dropbox", { exact: true })).toBeVisible();
  await expect(servers.getByText("GitHub", { exact: true })).toBeVisible();
  await expect(servers.getByTestId("registered-mcp-server")).toHaveCount(2);
  await expect(servers.getByTestId("mcp-health")).toHaveCount(2);
  for (const name of ["Dropbox", "GitHub"]) {
    const server = servers.getByTestId("registered-mcp-server").filter({
      has: page.getByText(name, { exact: true }),
    });
    await expect(server.getByText("Credential saved", { exact: true })).toBeVisible();
    await expect(server.getByText(name.charAt(0), { exact: true })).toBeVisible();
    await expect(server.getByRole("button", { name: "Add", exact: true })).toHaveCount(0);
    await expect(server.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);
  }
  await expect(servers).not.toContainText("fake-mcp-credential");
  await captureScreenshot(page, testInfo, "integrations-direct-mcp-servers");
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("github");
  await expect(servers.getByTestId("registered-mcp-server")).toHaveCount(1);
  await expect(servers.getByText("GitHub", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await captureScreenshot(page, testInfo, "integrations-direct-mcp-mobile");
  await expandAdvancedSection(page.getByTestId("integrations-advanced"));
  await expect(page.getByRole("button", { name: "Manage MCP servers", exact: true })).toHaveCount(
    1,
  );
  await servers.getByRole("button", { name: "Manage MCP servers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "MCP servers", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("GitHub", { exact: true })).toBeVisible();
});

test("adds MCP and API integrations without a managed app catalog", async ({ page }, testInfo) => {
  await signup(page, `custom-tools-${Date.now()}@rakazo.test`, "password12", "Custom tools");
  await completeOnboarding(page);
  await page.route("**/rpc/connections/catalog", (route) => route.fulfill({ json: { json: [] } }));
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  await expect(page.getByTestId("featured-connectors")).toBeHidden();
  await expect(page.getByText("Not in the plugin catalog", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Add integration", exact: true }).click();
  await captureScreenshot(page, testInfo, "integrations-add-without-managed-catalog");
  await page.getByRole("menuitem", { name: "Add MCP server", exact: true }).click();
  const manager = page.getByRole("dialog");
  await manager.getByRole("textbox", { name: "Server name", exact: true }).fill("Docs");
  await manager
    .getByRole("textbox", { name: "Server URL", exact: true })
    .fill("https://docs.example.test/mcp");
  await expect(manager.getByRole("button", { name: "Chief", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(manager.getByRole("button", { name: "Chief", exact: true })).toBeEnabled();
  await manager.getByRole("button", { name: "Add server", exact: true }).click();
  await expect(manager.getByRole("textbox", { name: "Server name", exact: true })).toHaveValue("");
  const servers = await rpc<{ id: string; name: string }[]>(page, "mcp/servers/list", {});
  const chief = (await rpc<{ id: string; name: string }[]>(page, "bots/list", {})).find(
    (bot) => bot.name === "Chief",
  )!;
  const assignments = await rpc<{ serverId: string }[]>(page, "mcp/assignments/list", {
    botId: chief.id,
  });
  expect(
    assignments.some(
      (assignment) => assignment.serverId === servers.find((server) => server.name === "Docs")?.id,
    ),
  ).toBe(true);
  await captureScreenshot(page, testInfo, "integrations-mcp-current-coworker");
  await page.getByRole("button", { name: "Close MCP servers", exact: true }).click();
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  await page.getByRole("button", { name: "Add integration", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add OpenAPI", exact: true }).click();
  await expect(page.getByText("Import OpenAPI JSON", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Display name", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Add integration", exact: true }).click();
  await page.getByRole("menuitem", { name: "Add GraphQL", exact: true }).click();
  await expect(page.getByText("Add GraphQL endpoint", { exact: true })).toBeVisible();
  await captureScreenshot(page, testInfo, "integrations-api-form-without-advanced");
});

test("official MCP presets show logos and fill the reviewed setup without granting access", async ({
  page,
}, testInfo) => {
  await signup(page, `mcp-presets-${Date.now()}@rakazo.test`, "password12", "MCP presets");
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  const presets = page.getByTestId("mcp-presets");
  await expect(presets.getByTestId("mcp-preset")).toHaveCount(MCP_PRESETS.length);
  await expect(presets.locator("svg path")).toHaveCount(MCP_PRESETS.length);
  await captureScreenshot(page, testInfo, "integrations-official-mcp-presets");
  for (const preset of MCP_PRESETS) {
    const row = presets
      .getByTestId("mcp-preset")
      .filter({ has: page.getByText(preset.name, { exact: true }) });
    await row.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Server name", exact: true })).toHaveValue(
      preset.name,
    );
    await expect(page.getByRole("textbox", { name: "Server URL", exact: true })).toHaveValue(
      preset.endpoint,
    );
    await expect(page.getByRole("link", { name: "Setup guide", exact: true })).toHaveAttribute(
      "href",
      preset.docsUrl,
    );
    if (preset.auth === "bearer") {
      await expect(page.getByLabel("API token", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Add server", exact: true }).click();
      await expect(page.getByRole("alert")).toHaveText("Add an API token");
    }
    expect(await rpc(page, "mcp/servers/list", {})).toEqual([]);
    await page.getByRole("button", { name: "Close MCP servers", exact: true }).click();
    await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  }
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("Cloudflare");
  await expect(presets.getByTestId("mcp-preset")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await captureScreenshot(page, testInfo, "integrations-official-mcp-presets-narrow");
});
