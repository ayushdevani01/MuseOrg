import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { captureScreenshot, rpc, signup } from "./helpers";

// Fake credentials must never reach a running provider or automatic intro run.
test.skip(
  process.env.AGENT_RUNTIME !== "scripted",
  "Meta onboarding browser fixtures require the isolated scripted runtime.",
);

/** The API's scripted fixture stubs inference; auth, storage and bot creation remain real. */
async function metaSetup(page: Page) {
  let connected = false;
  const attempts: Array<Record<string, unknown>> = [];
  await page.route("**/rpc/me", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { json: Record<string, unknown> };
    await route.fulfill({
      response,
      json: {
        json: {
          ...body.json,
          requiredPersonalModelProvider: "meta",
          needsModel: !connected,
          needsSignupSurvey: false,
        },
      },
    });
  });
  await page.route("**/rpc/models/list", (route) =>
    route.fulfill({
      json: {
        json: [
          { provider: "meta", id: "muse-spark-1.3", label: "Muse Spark 1.3", providerName: "Meta" },
          {
            provider: "meta",
            id: "muse-wonder-1.0",
            label: "Muse Wonder 1.0",
            providerName: "Meta",
          },
        ],
      },
    }),
  );
  await page.route("**/rpc/models/connect", async (route) => {
    const input = route.request().postDataJSON().json as Record<string, unknown>;
    attempts.push(input);
    if (input.apiKey !== "fake-accepted-meta-key") {
      await route.fulfill({
        status: 400,
        json: {
          json: { defined: false, code: "BAD_REQUEST", status: 400, message: "Invalid fake key" },
        },
      });
      return;
    }
    const response = await route.fetch();
    if (response.ok()) connected = true;
    await route.fulfill({ response });
  });
  return {
    attempts,
    revoke: () => {
      connected = false;
    },
  };
}

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});

test("Meta setup rejects an invalid key, hires selected coworkers and survives reload", async ({
  page,
}, testInfo) => {
  const setup = await metaSetup(page);
  await signup(page, `meta-onboarding-${Date.now()}@rakazo.test`, "password12", "Demo founder");
  await expect(page.getByRole("heading", { name: "Connect Meta" })).toBeVisible();
  const key = page.getByLabel("Meta API key", { exact: true });
  const connect = page.getByRole("button", { name: "Connect", exact: true });
  await expect(key).toHaveAttribute("type", "password");
  await expect(connect).toBeDisabled();
  await captureScreenshot(page, testInfo, "museorg-meta-key-setup");

  await key.fill("fake-rejected-meta-key");
  await connect.click();
  await expect(page.getByRole("alert")).toHaveText(
    "Could not connect to Meta. Check your key and try again.",
  );
  expect(await rpc<unknown[]>(page, "bots/list", {})).toHaveLength(0);
  await expect(page.getByRole("heading", { name: "Hire your coworkers" })).toHaveCount(0);

  await key.fill("fake-accepted-meta-key");
  await connect.click();
  await expect(page.getByRole("heading", { name: "Hire your coworkers" })).toBeVisible();
  await expect(page.getByLabel("Meta API key", { exact: true })).toHaveCount(0);
  await captureScreenshot(page, testInfo, "museorg-coworker-selection");
  await page.getByRole("checkbox", { name: /Creative Director/ }).uncheck();
  await page.getByRole("checkbox", { name: /Meta Growth Operator/ }).uncheck();
  await page.getByRole("button", { name: "Hire coworkers", exact: true }).click();
  await page.waitForURL(/\/app\//);
  const bots = await rpc<Array<{ name: string; modelProvider: string; modelId: string }>>(
    page,
    "bots/list",
    {},
  );
  expect(bots.map((bot) => bot.name).sort()).toEqual(["Chief", "Engineer"]);
  expect(bots.find((bot) => bot.name === "Engineer")).toMatchObject({
    modelProvider: "meta",
    modelId: "muse-wonder-1.0",
  });
  expect(setup.attempts[1]).toMatchObject({
    provider: "meta",
    modelId: "muse-spark-1.3",
    scope: "account",
  });

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Message Chief" })).toBeVisible();
  await expect(page.getByLabel("Meta API key", { exact: true })).toHaveCount(0);
  const stored = await page.evaluate(() =>
    JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
  );
  expect(stored).not.toContain("fake-accepted-meta-key");
  expect(await rpc<unknown[]>(page, "bots/list", {})).toHaveLength(2);

  setup.revoke();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Connect Meta" })).toBeVisible();
  await expect(key).toHaveValue("");
});

test("a second authenticated account has its own setup and empty organization", async ({
  page,
  browser,
}) => {
  await metaSetup(page);
  const stamp = Date.now();
  await signup(page, `meta-first-${stamp}@rakazo.test`, "password12", "First founder");
  await page.getByLabel("Meta API key", { exact: true }).fill("fake-accepted-meta-key");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.getByRole("button", { name: "Hire coworkers", exact: true }).click();
  await page.waitForURL(/\/app\//);
  const first = await rpc<{ userId: string; spaceId: string }>(page, "me", {});

  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const secondPage = await context.newPage();
    await metaSetup(secondPage);
    await signup(secondPage, `meta-second-${stamp}@rakazo.test`, "password12", "Second founder");
    await expect(secondPage.getByRole("heading", { name: "Connect Meta" })).toBeVisible();
    await expect(secondPage.getByLabel("Meta API key", { exact: true })).toHaveValue("");
    const second = await rpc<{ userId: string; spaceId: string }>(secondPage, "me", {});
    expect(second.userId).not.toBe(first.userId);
    expect(second.spaceId).not.toBe(first.spaceId);
    expect(await rpc<unknown[]>(secondPage, "bots/list", {})).toHaveLength(0);
    await secondPage.unrouteAll({ behavior: "wait" });
  } finally {
    await context.close();
  }
});

test("setup fetch failures offer retry without creating a coworker", async ({ page }) => {
  const setup = await metaSetup(page);
  await page.route("**/rpc/models/list", (route) => route.abort());
  await signup(page, `meta-unavailable-${Date.now()}@rakazo.test`, "password12", "Demo founder");
  await expect(page.getByRole("alert")).toHaveText("Could not load setup.");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  expect(setup.attempts).toHaveLength(0);
  expect(await rpc<unknown[]>(page, "bots/list", {})).toHaveLength(0);
});
