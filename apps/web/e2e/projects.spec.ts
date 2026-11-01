import { expect, test } from "@playwright/test";
import { captureScreenshot, completeOnboarding, signup } from "./helpers";

test("shared project settings keep edits on the current revision", async ({ page }, testInfo) => {
  await signup(page, `project-settings-${Date.now()}@rakazo.test`, "password12", "Project fixture");
  await completeOnboarding(page);
  await page.locator("aside").first().getByRole("button", { name: "Actions for Personal" }).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  const settings = page.getByTestId("user-settings");
  await settings.getByText("Projects", { exact: true }).click();
  const projects = settings.getByTestId("project-settings");
  await projects.getByRole("button", { name: "New project", exact: true }).click();
  await projects.getByLabel("Name", { exact: true }).fill("Shared brief");
  await projects.getByLabel("Goal", { exact: true }).fill("Prepare a synthetic launch brief");
  await projects.getByRole("checkbox", { name: "Chief", exact: true }).check();
  await projects.getByRole("button", { name: "Save", exact: true }).click();
  await expect(projects.getByText("Revision 1", { exact: true })).toBeVisible();
  await projects
    .getByRole("textbox", { name: "Goal", exact: true })
    .fill("Prepare the corrected synthetic launch brief");
  await projects.getByRole("button", { name: "Save", exact: true }).click();
  await expect(projects.getByText("Revision 2", { exact: true })).toBeVisible();
  await projects.getByText("Action scopes", { exact: true }).click();
  await expect(projects.getByText("Connect an integration first.", { exact: true })).toBeVisible();
  await captureScreenshot(page, testInfo, "project-revision-settings");
});
