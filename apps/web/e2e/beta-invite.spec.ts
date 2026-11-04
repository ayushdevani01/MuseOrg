import { expect, test } from "@playwright/test";
import { captureScreenshot, signup } from "./helpers";

test("invite entry follows signup and keeps failed redemption on screen", async ({
  page,
}, testInfo) => {
  await page.route("**/api/beta/status", (route) => route.fulfill({ json: { admitted: false } }));
  await page.route("**/api/beta/redeem", (route) =>
    route.fulfill({ status: 400, json: { error: "Invalid invite code" } }),
  );
  await signup(page, `beta-invite-${Date.now()}@example.test`, "password12", "Beta Tester");
  await expect(page.getByRole("heading", { name: "Join the beta" })).toBeVisible();
  await page.getByLabel("Invite code").fill("offline-invalid-invite");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Could not verify invite code");
  await captureScreenshot(page, testInfo, "beta-invite");
});
