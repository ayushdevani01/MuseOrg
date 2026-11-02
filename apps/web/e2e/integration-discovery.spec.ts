import { expect, test } from "@playwright/test";
import { captureScreenshot, completeOnboarding, signup } from "./helpers";

test.use({ colorScheme: "dark" });

test("searches all related connection methods in MuseOrg without a directory handoff", async ({
  page,
}, testInfo) => {
  await signup(page, `directory-${Date.now()}@rakazo.test`, "password12", "Directory demo");
  await completeOnboarding(page);
  const results = Array.from({ length: 30 }, (_, index) => ({
    domain: `mail${index}.example.test`,
    name: `Mail ${index}`,
    description: "Related email integration",
    pageUrl: null,
    surfaces: [
      {
        kind: "openapi",
        slug: `mail-${index}-api`,
        source: `https://mail${index}.example.test/openapi.json`,
        auth: null,
      },
      {
        kind: "mcp",
        slug: `mail-${index}-mcp`,
        source: `https://mail${index}.example.test/mcp`,
        auth: null,
      },
      { kind: "cli", slug: `mail-${index}-cli`, source: null, auth: null },
    ],
  }));
  await page.route("**/rpc/capabilities/catalogSearch", (route) =>
    route.fulfill({ json: { json: { enabled: true, results } } }),
  );
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("mail");
  const directory = page.getByTestId("integration-search-results");
  await expect(directory.getByTestId("integration-search-result")).toHaveCount(24);
  await expect(directory.getByTestId("integration-method")).toHaveCount(72);
  await expect(
    page.getByRole("button", { name: "Search integrations.sh", exact: true }),
  ).toHaveCount(0);
  await captureScreenshot(page, testInfo, "integration-directory-methods");
  await directory.getByRole("button", { name: "Show more", exact: true }).click();
  await expect(directory.getByTestId("integration-search-result")).toHaveCount(30);
  await expect(directory.getByTestId("integration-method")).toHaveCount(90);
  await directory
    .getByTestId("integration-search-result")
    .first()
    .getByRole("button", { name: "Set up", exact: true })
    .click();
  await expect(
    page.getByPlaceholder("https://example.com/openapi.json", { exact: true }),
  ).toHaveValue("https://mail0.example.test/openapi.json");
  await expect(page.getByPlaceholder("Display name", { exact: true })).toHaveValue("Mail 0");
  await captureScreenshot(page, testInfo, "integration-directory-api-setup");
});
