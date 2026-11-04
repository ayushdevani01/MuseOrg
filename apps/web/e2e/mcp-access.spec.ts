import { expect, test } from "@playwright/test";
import { captureScreenshot, completeOnboarding, rpc, signup } from "./helpers";

test("new MCP servers include every employee unless excluded", async ({ page }, testInfo) => {
  await signup(page, `mcp-access-${Date.now()}@rakazo.test`, "password12", "MCP Access QA");
  await completeOnboarding(page);
  await rpc(page, "bots/create", {
    name: "Designer",
    title: "Design",
    description: "Prepare visuals",
  });
  const url = new URL(page.url());
  url.search = "?mcp";
  await page.goto(url.href);
  const dialog = page.getByRole("dialog", { name: "MCP servers" });
  const chief = dialog.getByRole("button", { name: "Chief", exact: true });
  const designer = dialog.getByRole("button", { name: "Designer", exact: true });
  await expect(chief).toHaveAttribute("aria-pressed", "true");
  await expect(designer).toHaveAttribute("aria-pressed", "true");
  await designer.click();
  await expect(designer).toHaveAttribute("aria-pressed", "false");
  await expect(chief).toHaveAttribute("aria-pressed", "true");
  await captureScreenshot(page, testInfo, "mcp-default-access-exclusion");
});
