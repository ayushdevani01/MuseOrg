import { expect, test } from "@playwright/test";
import { captureScreenshot, completeOnboarding, rpc, signup } from "./helpers";

test("hires a custom employee with optional skill discovery unavailable", async ({
  page,
}, testInfo) => {
  await signup(page, `hiring-${Date.now()}@rakazo.test`, "password12", "Hiring fixture");
  await completeOnboarding(page);
  // Public discovery is optional; no directory or model network calls in this regression.
  await page.route("**/rpc/agentSkills/searchCatalog*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ json: { message: "Directory unavailable" } }),
    }),
  );
  await page.getByTestId("create-menu-trigger").click();
  await page.getByTestId("create-new-bot").click();
  const dialog = page.getByTestId("create-bot-dialog");
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Researcher");
  await dialog.getByRole("radio", { name: "Something else", exact: true }).check();
  await dialog
    .getByRole("textbox", { name: "Employee responsibilities", exact: true })
    .fill("Review synthetic research briefs");
  await captureScreenshot(page, testInfo, "employee-role");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dialog.getByTestId("hiring-skills")).toBeVisible();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await captureScreenshot(page, testInfo, "employee-skills");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const bots = (await rpc(page, "bots/list", undefined)) as Array<{
    name: string;
    title: string;
    instructions: string;
  }>;
  expect(bots.filter((bot) => bot.name === "Researcher")).toEqual([
    expect.objectContaining({
      title: "Review synthetic research briefs",
      instructions: "Review synthetic research briefs",
    }),
  ]);
});
