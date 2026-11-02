import { expect, test } from "@playwright/test";
import { captureScreenshot, completeOnboarding, rpc, signup } from "./helpers";

test.use({ colorScheme: "dark" });

test("browses popular apps without a hosted catalog and opens honest setup flows", async ({
  page,
}, testInfo) => {
  await signup(page, `popular-apps-${Date.now()}@rakazo.test`, "password12", "Demo workspace");
  await completeOnboarding(page);
  await page.route("**/rpc/connections/catalog", (route) => route.fulfill({ json: { json: [] } }));
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  const popular = page.getByTestId("popular-integrations");
  await expect(popular.getByTestId("connector-logo")).toHaveCount(12);
  for (const name of [
    "Gmail",
    "Google Drive",
    "Slack",
    "GitHub",
    "Instagram",
    "Meta Ads",
    "WhatsApp",
  ])
    await expect(popular.getByRole("button", { name: `Add ${name}`, exact: true })).toBeVisible();
  expect(await rpc(page, "connections/list", {})).toEqual([]);
  expect(await rpc(page, "mcp/servers/list", {})).toEqual([]);
  await captureScreenshot(page, testInfo, "popular-integrations-desktop");
  await popular.getByRole("button", { name: "Add Gmail", exact: true }).click();
  const setup = page.getByTestId("popular-integration-setup");
  await expect(setup.getByRole("textbox", { name: "Search apps", exact: true })).toHaveValue(
    "Gmail",
  );
  await expect(setup.getByRole("textbox", { name: "Server URL", exact: true })).toHaveValue("");
  await expect(setup.getByRole("button", { name: "Connect", exact: true })).toBeDisabled();
  expect(await rpc(page, "mcp/servers/list", {})).toEqual([]);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("google drive");
  await expect(popular.getByTestId("connector-logo")).toHaveCount(1);
  await expect(popular.getByText("Google Drive", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("");
  await page.setViewportSize({ width: 390, height: 844 });
  await captureScreenshot(page, testInfo, "popular-integrations-mobile");
  const dialog = page.getByRole("dialog");
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.getByRole("tab", { name: "Added", exact: true }).click();
  await expect(popular).toBeHidden();
  await expect(page.getByText("No integrations added.", { exact: true })).toBeVisible();
});

test("uses available catalog apps once and keeps connected featured apps in Added", async ({
  page,
}) => {
  await signup(
    page,
    `popular-connected-${Date.now()}@rakazo.test`,
    "password12",
    "Connected app fixture",
  );
  await completeOnboarding(page);
  await page.route("**/rpc/connections/catalog", (route) =>
    route.fulfill({
      json: {
        json: [
          {
            connectorId: "fixture",
            slug: "gmail",
            name: "Gmail",
            description: "Email and inbox",
            logo: "https://assets.example.test/gmail.svg",
            connected: true,
            noAuth: false,
          },
          {
            connectorId: "fixture",
            slug: "google_drive",
            name: "Google Drive",
            logo: null,
            connected: false,
            noAuth: false,
          },
        ],
      },
    }),
  );
  await page.route("https://assets.example.test/gmail.svg", (route) => route.abort());
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  const popular = page.getByTestId("popular-integrations");
  await expect(popular.getByText("Gmail", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Manage Gmail", exact: true })).toBeVisible();
  await expect(popular.getByTestId("connector-logo").locator("path")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Add Google Drive", exact: true })).toHaveCount(1);
  await page.getByRole("tab", { name: "Added", exact: true }).click();
  await expect(page.getByTestId("connection-tile-gmail")).toBeVisible();
  await expect(page.getByText("No integrations added.", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Manage Gmail", exact: true }).click();
  await expect(page.getByTestId("connection-detail")).toBeVisible();
});
