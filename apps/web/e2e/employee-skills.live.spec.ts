import { expect, test } from "@playwright/test";
import { importedSkillDetails } from "@rakazo/core";
import { captureScreenshot, completeOnboarding, rpc, signup } from "./helpers";

test("imports a reviewed public skill through hiring and persists its pinned bundle", async ({
  page,
}, testInfo) => {
  test.skip(process.env.VERIFY_LIVE_SKILLS !== "1", "Explicit public-directory integration check");
  test.setTimeout(180_000);
  await signup(page, `live-skills-${Date.now()}@rakazo.test`, "password12", "Skill fixture");
  await completeOnboarding(page);
  await page.getByTestId("create-menu-trigger").click();
  await page.getByTestId("create-new-bot").click();
  const dialog = page.getByTestId("create-bot-dialog");
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Design Reviewer");
  await dialog.getByRole("radio", { name: "Build software", exact: true }).check();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  const search = dialog.getByRole("button", { name: "Search", exact: true });
  await expect(search).toBeEnabled({ timeout: 40_000 });
  await dialog
    .getByRole("textbox", { name: "Search skills.sh", exact: true })
    .fill("web-design-guidelines");
  await search.click();
  const entry = dialog
    .locator("div.flex.items-center")
    .filter({
      has: page.locator(
        'a[href="https://skills.sh/vercel-labs/agent-skills/web-design-guidelines"]',
      ),
    })
    .last();
  const response = page.waitForResponse(
    (item) =>
      item.url().includes("/rpc/agentSkills/previewCatalog") && item.request().method() === "POST",
  );
  await entry.getByRole("button", { name: "Preview web-design-guidelines", exact: true }).click();
  const reviewed = (await (await response).json()).json as { sha256: string; revision: string };
  const preview = dialog.getByTestId("skill-preview");
  await expect(preview).toBeVisible({ timeout: 60_000 });
  await preview.getByText("Skill instructions", { exact: true }).click();
  await expect(preview.locator("pre")).not.toBeEmpty();
  await captureScreenshot(page, testInfo, "employee-skill-preview");
  await preview.getByRole("button", { name: "Add skill", exact: true }).click();
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(dialog).not.toBeVisible({ timeout: 60_000 });
  const skill = await rpc<{ content: string }>(page, "agentSkills/get", {
    name: "web-design-guidelines",
  });
  expect(importedSkillDetails(skill.content)).toMatchObject({
    sha256: reviewed.sha256,
    revision: reviewed.revision,
    source: "vercel-labs/agent-skills",
  });
  const bots = await rpc<Array<{ name: string; title: string; instructions: string }>>(
    page,
    "bots/list",
    {},
  );
  const employee = bots.find((bot) => bot.name === "Design Reviewer");
  expect(employee?.title).toBe("Staff Engineer");
  expect(employee?.instructions).toContain("web-design-guidelines");
});
