import { expect, test } from "@playwright/test";
import type { Connection, ConnectionCatalogItem } from "@rakazo/contracts";
import { captureScreenshot, completeOnboarding, signup } from "./helpers";

test.use({ colorScheme: "dark" });

for (const app of [
  { slug: "GMAIL", name: "Gmail" },
  { slug: "GOOGLEDRIVE", name: "Google Drive" },
  { slug: "GOOGLECALENDAR", name: "Google Calendar" },
]) {
  test(`${app.name} reserves sign-in before a slow request and waits for verified authorization`, async ({
    page,
    context,
  }, testInfo) => {
    await signup(
      page,
      `google-connect-${app.slug}-${Date.now()}@rakazo.test`,
      "password12",
      "Google connection fixture",
    );
    await completeOnboarding(page);
    let authorized = false;
    let started = false;
    let release: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const row = (): Connection => ({
      id: "google-connection-fixture",
      connectorId: "composio",
      provider: app.slug,
      displayName: app.name,
      status: authorized ? "connected" : "pending",
      capabilities: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const catalog = (): ConnectionCatalogItem => ({
      connectorId: "composio",
      slug: app.slug,
      name: app.name,
      logo: null,
      connected: authorized,
      noAuth: false,
    });
    await page.route("**/rpc/connections/catalog", (route) =>
      route.fulfill({ json: { json: [catalog()] } }),
    );
    await page.route("**/rpc/connections/list", (route) =>
      route.fulfill({ json: { json: started ? [row()] : [] } }),
    );
    await page.route("**/rpc/connections/begin", async (route) => {
      expect(route.request().postDataJSON().json).toEqual({
        connectorId: "composio",
        provider: app.slug,
        displayName: app.name,
      });
      started = true;
      await ready;
      await route.fulfill({
        json: {
          json: { connectionId: row().id, authorizationUrl: "https://auth.example.test/google" },
        },
      });
    });
    await page.route("**/rpc/connections/complete", (route) =>
      route.fulfill({ json: { json: row() } }),
    );
    await context.route("https://auth.example.test/google", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Google authorization fixture</title><h1>Google authorization fixture</h1>",
      }),
    );
    await page.getByRole("button", { name: "Connect apps", exact: true }).click();
    const popupOpened = context.waitForEvent("page");
    await page.getByRole("button", { name: `Add ${app.name}`, exact: true }).click();
    const popup = await popupOpened;
    expect(popup.url()).toBe("about:blank");
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    release();
    await expect(
      popup.getByRole("heading", { name: "Google authorization fixture", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Manage ${app.name}`, exact: true }),
    ).toBeHidden();
    await expect(page.getByRole("link", { name: "Open sign-in", exact: true })).toHaveAttribute(
      "href",
      "https://auth.example.test/google",
    );
    authorized = true;
    await popup.goto(new URL("/integrations/callback?status=success", page.url()).href);
    await expect.poll(() => popup.isClosed()).toBe(true);
    await expect(
      page.getByRole("button", { name: `Manage ${app.name}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open sign-in", exact: true })).toBeHidden();
    await page.getByRole("tab", { name: "Added", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Manage ${app.name}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("popular-integration-setup")).toBeHidden();
    await captureScreenshot(page, testInfo, `managed-${app.slug.toLowerCase()}-connected`);
  });
}

test("blocked sign-in explains recovery without starting a connection", async ({
  page,
}, testInfo) => {
  await signup(
    page,
    `google-popup-blocked-${Date.now()}@rakazo.test`,
    "password12",
    "Blocked sign-in fixture",
  );
  await completeOnboarding(page);
  let began = false;
  await page.route("**/rpc/connections/catalog", (route) =>
    route.fulfill({
      json: {
        json: [
          {
            connectorId: "composio",
            slug: "GMAIL",
            name: "Gmail",
            logo: null,
            connected: false,
            noAuth: false,
          },
        ],
      },
    }),
  );
  await page.route("**/rpc/connections/list", (route) => route.fulfill({ json: { json: [] } }));
  await page.route("**/rpc/connections/begin", async (route) => {
    began = true;
    await route.fulfill({ status: 500, json: {} });
  });
  await page.getByRole("button", { name: "Connect apps", exact: true }).click();
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.getByRole("button", { name: "Add Gmail", exact: true }).click();
  await expect(page.getByText("Allow popups to connect this app.", { exact: true })).toBeVisible();
  expect(began).toBe(false);
  await expect(page.getByRole("button", { name: "Manage Gmail", exact: true })).toBeHidden();
  await captureScreenshot(page, testInfo, "managed-google-popup-recovery");
});
