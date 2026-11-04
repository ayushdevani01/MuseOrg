import { expect, test } from "@playwright/test";
import { captureScreenshot, rpc, signup } from "./helpers";

test("a model-ready account hires the starter team without a personal model key", async ({
  page,
}, testInfo) => {
  await signup(page, `starter-team-${Date.now()}@example.test`, "password12", "Team Owner");
  await expect(page.getByRole("heading", { name: "Hire your coworkers" })).toBeVisible();
  const roles = ["Chief of Staff", "Staff Engineer", "Creative Director", "Meta Growth Operator"];
  for (const role of roles)
    await expect(page.getByRole("checkbox", { name: new RegExp(role) })).toBeChecked();
  await captureScreenshot(page, testInfo, "starter-team");
  await page.getByRole("button", { name: "Hire coworkers", exact: true }).click();
  await page.waitForURL(/\/app\//);
  const bots = await rpc<Array<{ id: string; title: string; computerId: string | null }>>(
    page,
    "bots/list",
    {},
  );
  expect(bots.map((bot) => bot.title).sort()).toEqual(roles.sort());
  const repeated = await rpc<{ botIds: string[] }>(page, "onboarding/hireCoworkers", {
    templateIds: ["chief", "engineer", "creative", "growth"],
  });
  expect(repeated.botIds.sort()).toEqual(bots.map((bot) => bot.id).sort());
});
