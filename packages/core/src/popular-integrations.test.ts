import { describe, expect, it } from "vitest";
import { filterConnectionCatalogItems } from "./featured-connectors.js";
import {
  filterPopularIntegrations,
  POPULAR_INTEGRATIONS,
  popularIntegrationForCatalogItem,
} from "./popular-integrations.js";

describe("popular integration browsing", () => {
  it("browses offline without fabricating catalog accounts or endpoints", () => {
    const apps = filterPopularIntegrations("");
    expect(apps).toHaveLength(12);
    expect(apps.every((app) => app.iconPath.length > 20)).toBe(true);
    expect(
      apps.every((app) => !("connected" in app) && !("endpoint" in app) && !("connectorId" in app)),
    ).toBe(true);
    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length);
  });
  it("searches names and aliases and matches real catalog rows only", () => {
    expect(filterPopularIntegrations("google").map((app) => app.id)).toEqual([
      "gmail",
      "google-drive",
      "google-calendar",
    ]);
    expect(filterPopularIntegrations("Microsoft Outlook")[0]?.id).toBe("outlook");
    expect(popularIntegrationForCatalogItem({ slug: "google_drive", name: "Drive" })?.id).toBe(
      "google-drive",
    );
    expect(popularIntegrationForCatalogItem({ slug: "slackbot", name: "Slack" })?.id).toBe("slack");
    expect(
      popularIntegrationForCatalogItem({ slug: "fake-gmail", name: "Unknown" }),
    ).toBeUndefined();
    expect(filterPopularIntegrations("unlisted-provider")).toEqual([]);
  });
  it("keeps featured connected apps visible in the Added view", () => {
    const catalog = [
      {
        connectorId: "fixture",
        slug: "gmail",
        name: "Gmail",
        logo: null,
        connected: true,
        noAuth: false,
      },
    ];
    expect(filterConnectionCatalogItems(catalog, "", { includeFeatured: true })).toEqual(catalog);
    expect(filterConnectionCatalogItems(catalog, "")).toEqual([]);
    expect(POPULAR_INTEGRATIONS.some((app) => app.id === "gmail")).toBe(true);
  });
});
