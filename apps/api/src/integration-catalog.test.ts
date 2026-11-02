import { describe, expect, it, vi } from "vitest";
import { searchIntegrationCatalog } from "./integration-catalog.js";

describe("searchIntegrationCatalog", () => {
  it("searches the full cached index and preserves every method and related match", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({
        data: Array.from({ length: 30 }, (_, index) => [
          {
            domain: `mail${index}.example.test`,
            name: `Mail ${index}`,
            description: "Related mail service",
            kind: "mcp",
            slug: `mail-${index}`,
            connectUrl: `https://mail${index}.example.test/mcp`,
          },
          {
            domain: `mail${index}.example.test`,
            name: `Mail ${index}`,
            kind: "openapi",
            slug: `mail-${index}-api`,
            url: `https://mail${index}.example.test/openapi.json`,
          },
          {
            domain: `mail${index}.example.test`,
            name: `Mail ${index}`,
            kind: "cli",
            slug: `mail-${index}-cli`,
          },
        ]).flat(),
      }),
    );
    const input = {
      baseUrl: "https://integrations.sh",
      query: "mail",
      signal: new AbortController().signal,
      fetch,
    };
    const results = await searchIntegrationCatalog(input);
    expect(results).toHaveLength(30);
    expect(results.every((result) => result.surfaces.length === 3)).toBe(true);
    expect(results[0]?.surfaces[0]?.source).toBe("https://mail0.example.test/mcp");
    const related = await searchIntegrationCatalog({ ...input, query: "mail 29" });
    expect(related.map((result) => result.name)).toEqual(["Mail 29"]);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[0]).toBe("https://integrations.sh/api.json");
  });
  it("does not mistake an MCP documentation URL for a connection endpoint", async () => {
    const results = await searchIntegrationCatalog({
      baseUrl: "https://integrations.sh",
      query: "fixture",
      signal: new AbortController().signal,
      fetch: async () =>
        Response.json({
          data: [
            {
              domain: "fixture.example.test",
              name: "Fixture",
              kind: "mcp",
              slug: "fixture",
              url: "https://fixture.example.test/docs",
            },
          ],
        }),
    });
    expect(results[0]?.surfaces[0]?.source).toBeNull();
  });
  it("matches metadata on later methods in the same service", async () => {
    const results = await searchIntegrationCatalog({
      baseUrl: "https://integrations.sh",
      query: "analytics",
      signal: new AbortController().signal,
      fetch: async () =>
        Response.json({
          data: [
            { domain: "fixture.example.test", name: "Fixture", kind: "mcp", slug: "fixture" },
            {
              domain: "fixture.example.test",
              name: "Fixture",
              kind: "openapi",
              slug: "fixture-api",
              description: "Read analytics",
            },
          ],
        }),
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.surfaces).toHaveLength(2);
  });
  it("normalizes an integrations.sh-compatible feed and keeps unsupported surfaces visible", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      expect(url.href).toBe("https://mirror.example/catalog/api/search?q=github.com&limit=100");
      expect(init?.redirect).toBe("manual");
      return Response.json({
        results: [
          {
            domain: "github.com",
            name: "GitHub",
            description: "Developer platform",
            url: "https://mirror.example/github.com/",
            surfaces: [
              {
                kind: "mcp",
                slug: "github-mcp",
                url: "https://api.githubcopilot.com/mcp/",
                auth: {
                  kind: "mixed",
                  header: "Authorization: Bearer {pat}",
                  note: "OAuth or PAT",
                },
              },
              {
                kind: "openapi",
                slug: "github-rest",
                url: "https://example.test/openapi.json",
                auth: { kind: "token", header: "x-api-key: {token}" },
              },
              { kind: "graphql", slug: "github-graphql", url: "javascript:alert(1)" },
              { kind: "cli", slug: "github-cli" },
            ],
          },
        ],
      });
    });

    await expect(
      searchIntegrationCatalog({
        baseUrl: "https://mirror.example/catalog",
        query: "github.com",
        signal: new AbortController().signal,
        fetch,
      }),
    ).resolves.toEqual([
      {
        domain: "github.com",
        name: "GitHub",
        description: "Developer platform",
        pageUrl: "https://mirror.example/github.com/",
        surfaces: [
          {
            kind: "mcp",
            slug: "github-mcp",
            source: "https://api.githubcopilot.com/mcp/",
            auth: { type: "bearer", headerName: null, note: "OAuth or PAT" },
          },
          {
            kind: "openapi",
            slug: "github-rest",
            source: "https://example.test/openapi.json",
            auth: { type: "header", headerName: "x-api-key", note: null },
          },
          {
            kind: "graphql",
            slug: "github-graphql",
            source: null,
            auth: null,
          },
          { kind: "cli", slug: "github-cli", source: null, auth: null },
        ],
      },
    ]);
  });

  it("does not contact the feed for an empty query", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    await expect(
      searchIntegrationCatalog({
        baseUrl: "not a URL",
        query: "  ",
        signal: new AbortController().signal,
        fetch,
      }),
    ).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP feeds and malformed payloads", async () => {
    await expect(
      searchIntegrationCatalog({
        baseUrl: "file:///tmp/catalog",
        query: "github.com",
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow("must use HTTP or HTTPS");

    await expect(
      searchIntegrationCatalog({
        baseUrl: "https://mirror.example/",
        query: "github.com",
        signal: new AbortController().signal,
        fetch: async () => Response.json({ nope: true }),
      }),
    ).rejects.toThrow("invalid response");
  });

  it("rejects oversized responses before reading them", async () => {
    await expect(
      searchIntegrationCatalog({
        baseUrl: "https://mirror.example/",
        query: "github.com",
        signal: new AbortController().signal,
        fetch: async () =>
          new Response("", { headers: { "content-length": String(RESPONSE_SIZE_OVER_LIMIT) } }),
      }),
    ).rejects.toThrow("too large");
  });

  it("rejects redirect responses instead of following them", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
      expect(init?.redirect).toBe("manual");
      return new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data" },
      });
    });

    await expect(
      searchIntegrationCatalog({
        baseUrl: "https://mirror.example/catalog",
        query: "github.com",
        signal: new AbortController().signal,
        fetch,
      }),
    ).rejects.toThrow("redirects are not allowed");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("allows an admin-configured private catalog base", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      expect(url.href).toBe("http://10.0.0.5:8080/catalog/api/search?q=github.com&limit=100");
      expect(init?.redirect).toBe("manual");
      return Response.json({
        results: [
          {
            domain: "github.com",
            name: "GitHub",
            description: "LAN mirror",
            url: "http://10.0.0.5:8080/github.com/",
            surfaces: [],
          },
        ],
      });
    });

    await expect(
      searchIntegrationCatalog({
        baseUrl: "http://10.0.0.5:8080/catalog",
        query: "github.com",
        signal: new AbortController().signal,
        fetch,
      }),
    ).resolves.toEqual([
      {
        domain: "github.com",
        name: "GitHub",
        description: "LAN mirror",
        pageUrl: "http://10.0.0.5:8080/github.com/",
        surfaces: [],
      },
    ]);
  });
});

const RESPONSE_SIZE_OVER_LIMIT = 1_000_001;
