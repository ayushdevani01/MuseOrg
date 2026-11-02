import { Trans, useLingui } from "@lingui/react/macro";
import type { IntegrationCatalogResult, IntegrationCatalogSurface } from "@rakazo/contracts";
import { humanizeToolName, newClientId, popularIntegrationForCatalogItem } from "@rakazo/core";
import { Badge, Button, Disclosure, Input, Spinner } from "@rakazo/ui-web";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { connectMcpOauth } from "../../lib/mcp-connect";
import { useSpaceQueries } from "../../lib/query";
import { rpc } from "../../lib/rpc";
import { errorText } from "../../lib/user-error";
import { ConnectorIcon } from "./ConnectorIcon";

/** Public metadata is searched on the server; connecting still requires account authorization. */
export function IntegrationSetup({
  onDone,
  botId,
  appName,
  searchQuery,
  onChooseSurface,
  onConnected,
}: {
  onDone?: () => void;
  botId?: string;
  appName?: string;
  searchQuery?: string;
  onChooseSurface?: (result: IntegrationCatalogResult, surface: IntegrationCatalogSurface) => void;
  onConnected?: () => void;
}) {
  const { t } = useLingui();
  const [endpoint, setEndpoint] = useState("");
  const [query, setQuery] = useState(appName ?? "");
  const effectiveQuery = (searchQuery ?? query).trim();
  const [settledQuery, setSettledQuery] = useState(effectiveQuery);
  const [visibleCount, setVisibleCount] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const queries = useSpaceQueries();
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettledQuery(effectiveQuery);
      setVisibleCount(24);
    }, 250);
    return () => clearTimeout(timer);
  }, [effectiveQuery]);
  const catalog = useQuery({
    ...queries.capabilities.catalogSearch.queryOptions({
      input: { query: settledQuery, usePublicCatalog: true },
    }),
    enabled: settledQuery.length >= 2,
  });
  const current = effectiveQuery === settledQuery;
  const searching = effectiveQuery.length >= 2 && (!current || catalog.isFetching);
  const results = current ? (catalog.data?.results ?? []) : [];
  async function connect(name: string, url: string) {
    setBusy(true);
    setError(null);
    try {
      const existing = (await rpc.mcp.servers.list()).find((server) => server.endpoint === url);
      const server =
        existing ??
        (await rpc.mcp.servers.create({
          slug: `integration-${newClientId().slice(0, 8)}`,
          name,
          transport: "streamable_http",
          endpoint: url,
        }));
      const result = await connectMcpOauth(server.id);
      if (result === "cancelled") return;
      if (botId) await rpc.mcp.assignments.approve({ botId, serverId: server.id });
      setConnected((value) => [...value, url]);
      onConnected?.();
    } catch (err) {
      setError(errorText(err, t`Could not connect`));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4" data-testid="integration-search-results">
      {searchQuery === undefined ? (
        <>
          {!appName ? (
            <h1 className="text-[32px] font-medium text-foreground">
              <Trans>Add integration</Trans>
            </h1>
          ) : null}
          <Input
            aria-label={t`Search apps`}
            placeholder={t`Search apps`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </>
      ) : null}
      {searching ? <Spinner aria-label={t`Searching integrations…`} /> : null}
      {current && catalog.error ? (
        <p role="alert" className="text-sm text-destructive">
          <Trans>Could not load integrations</Trans>
        </p>
      ) : null}
      {results.slice(0, visibleCount).map((result) => {
        const app = popularIntegrationForCatalogItem({ slug: result.domain, name: result.name });
        return (
          <section
            key={result.domain}
            className="space-y-3 rounded-xl border border-border p-4"
            data-testid="integration-search-result"
          >
            <div className="flex items-center gap-3">
              <ConnectorIcon
                name={result.name}
                logo={app ? undefined : result.logo}
                iconPath={app?.iconPath}
              />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">{result.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{result.domain}</p>
              </div>
            </div>
            {result.description ? (
              <p className="text-sm text-muted-foreground">{result.description}</p>
            ) : null}
            <div className="space-y-2">
              {result.surfaces.map((surface) => {
                const canConnect = surface.kind === "mcp" && surface.source?.startsWith("https://");
                const canSetup = Boolean(
                  onChooseSurface &&
                    surface.source &&
                    ["mcp", "openapi", "graphql"].includes(surface.kind),
                );
                return (
                  <div
                    key={`${surface.kind}:${surface.slug}:${surface.source ?? ""}`}
                    className="flex items-center gap-3"
                    data-testid="integration-method"
                  >
                    <Badge variant="secondary">{surface.kind.toUpperCase()}</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {humanizeToolName(surface.slug)}
                    </span>
                    {canConnect ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy || connected.includes(surface.source!)}
                        onClick={() => void connect(result.name, surface.source!)}
                      >
                        {connected.includes(surface.source!) ? t`Connected` : t`Connect`}
                      </Button>
                    ) : canSetup ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => onChooseSurface?.(result, surface)}
                      >
                        <Trans>Set up</Trans>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        <Trans>Manual setup</Trans>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {visibleCount < results.length ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setVisibleCount((value) => value + 24)}
        >
          <Trans>Show more</Trans>
        </Button>
      ) : null}
      {!searching &&
      current &&
      catalog.isSuccess &&
      effectiveQuery.length >= 2 &&
      !results.length ? (
        <p className="text-sm text-muted-foreground">
          <Trans>No apps match your search.</Trans>
        </p>
      ) : null}
      {searchQuery === undefined ? (
        <Disclosure
          className="text-sm text-muted-foreground"
          summary={<Trans>Add server URL</Trans>}
        >
          <div className="mt-3 space-y-3">
            <Input
              aria-label={t`Server URL`}
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://example.com/mcp"
            />
            <Button
              disabled={busy || !endpoint.trim()}
              onClick={() => void connect(appName ?? "MCP server", endpoint.trim())}
            >
              <Trans>Connect</Trans>
            </Button>
          </div>
        </Disclosure>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {onDone ? (
        <Button disabled={busy} onClick={onDone}>
          <Trans>Continue</Trans>
        </Button>
      ) : null}
    </div>
  );
}
