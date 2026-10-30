// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act, createElement, useEffect, useState } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { Alert } from "react-native";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Integrations from "../app/(settings)/integrations";
import { ConnectorIcon } from "../components/connector-icon";

const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  current: true,
  scope: vi.fn(),
  persisted: vi.fn(),
  focused: true,
}));
vi.mock("./side-insets", () => ({ useSideInsets: () => ({}) }));
vi.mock("expo-router", () => ({
  useFocusEffect: (callback: () => undefined | (() => void)) => {
    useEffect(() => {
      if (state.focused) return callback();
    }, [callback, state.focused]);
  },
}));
vi.mock("./api", () => ({ rpc: state.rpc }));
vi.mock("./integrations-cache", () => ({
  integrationsCacheScope: state.scope,
  persistedIntegrationsCacheScope: state.persisted,
  isIntegrationsScopeCurrent: () => state.current,
  readIntegrationsCache: state.read,
  writeIntegrationsCache: state.write,
}));
vi.mock("./last-bot", () => ({ loadLastBotId: async () => "" }));
vi.mock("./appearance", () => ({ mobileTokens: () => ({ destructive: "red" }) }));
vi.mock("./native", () => ({ native: {}, useThemedStyles: (factory: () => unknown) => factory() }));
vi.mock("./i18n", () => ({
  t: (text: string) => text,
  useI18n: () => ({ t: (text: string) => text }),
}));
vi.mock("../components/row-accessories", () => ({ Chevron: () => null }));
vi.mock("../components/menu-picker", () => ({
  MenuPickerMenu: function MockMenuPickerMenu({
    label,
    choices,
    onChange,
    disabled,
  }: {
    label: string;
    choices: Array<{ key: string; label: string }>;
    onChange: (key: string) => void;
    disabled?: boolean;
  }) {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button type="button" disabled={disabled} onClick={() => setOpen((value) => !value)}>
          {label}
        </button>
        {open
          ? choices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                onClick={() => {
                  onChange(choice.key);
                  setOpen(false);
                }}
              >
                {choice.label}
              </button>
            ))
          : null}
      </div>
    );
  },
}));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/native-action-button", () => ({
  NativeActionButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={onPress}>
      {label}
    </button>
  ),
}));
vi.mock("react-native-svg", () => ({
  default: ({ children }: { children: ReactNode }) => createElement("svg", null, children),
  Path: ({ d }: { d: string }) => createElement("path", { d }),
  SvgUri: ({ uri, onError }: { uri: string; onError: () => void }) =>
    createElement("svg", { "data-uri": uri, onClick: onError }),
}));
vi.mock("react-native", () => {
  const View = ({ children, testID }: { children?: ReactNode; testID?: string }) => (
    <div data-testid={testID}>{children}</div>
  );
  return {
    ActivityIndicator: ({ accessibilityLabel }: { accessibilityLabel?: string }) => (
      <div role="progressbar" aria-label={accessibilityLabel} />
    ),
    View,
    ScrollView: View,
    Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
    Pressable: ({ children, onPress }: { children: ReactNode; onPress: () => void }) => (
      <button type="button" onClick={onPress}>
        {children}
      </button>
    ),
    TextInput: ({
      placeholder,
      value,
      onChangeText,
      onEndEditing,
    }: {
      placeholder?: string;
      value?: string;
      onChangeText?: (value: string) => void;
      onEndEditing?: () => void;
    }) => (
      <input
        onBlur={onEndEditing}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChangeText?.(event.target.value)}
      />
    ),
    Image: ({ source, onError }: { source: { uri: string }; onError: () => void }) =>
      createElement("img", { src: source.uri, onError }),
    StyleSheet: { create: (styles: unknown) => styles },
    useWindowDimensions: () => ({ width: 390 }),
    Alert: { alert: vi.fn() },
    Linking: { openURL: vi.fn() },
  };
});

const item = {
  connectorId: "test",
  slug: "example",
  name: "Example app",
  logo: "https://example.test/logo.svg",
  connected: true,
  noAuth: false,
};
const account = {
  id: "account-a",
  connectorId: "test",
  provider: "example",
  displayName: "Example",
  status: "connected",
  capabilities: [],
  createdAt: "2026-01-01",
};
let root: Root;
let container: HTMLDivElement;
let resolveCatalog: (items: (typeof item)[]) => void;
let rejectCatalog: (error: Error) => void;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.current = true;
  state.focused = true;
  state.scope.mockReset().mockResolvedValue({ userId: "user-a", spaceId: "space-a" });
  state.persisted.mockReset().mockResolvedValue(null);
  state.read.mockReset().mockReturnValue(null);
  state.write.mockReset();
  const pending = new Promise<(typeof item)[]>((resolve, reject) => {
    resolveCatalog = resolve;
    rejectCatalog = reject;
  });
  state.rpc
    .mockReset()
    .mockImplementation((proc: string) =>
      proc === "connections/catalog"
        ? pending
        : Promise.resolve(proc === "connections/list" ? [account] : []),
    );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
async function render(node: ReactNode = <Integrations />) {
  await act(async () => root.render(node));
}

it.each([
  ["Cloudflare Docs", "https://docs.mcp.cloudflare.com/mcp", "none"],
  ["GitHub", "https://api.githubcopilot.com/mcp/", "bearer"],
])("prefills %s and installs with its advertised authentication", async (name, endpoint, auth) => {
  await render();
  await act(async () => resolveCatalog([]));
  const row = [...container.querySelectorAll('[data-testid="mcp-preset"]')].find((entry) =>
    entry.textContent?.startsWith(name),
  )!;
  expect(row.querySelector("svg path")).not.toBeNull();
  await act(async () => row.querySelector("button")?.click());
  expect(
    container.querySelector<HTMLInputElement>('input[placeholder="Display name"]')?.value,
  ).toBe(name);
  expect(
    container.querySelector<HTMLInputElement>('input[placeholder="https://example.com/mcp"]')
      ?.value,
  ).toBe(endpoint);
  expect(state.rpc).not.toHaveBeenCalledWith("capabilities/install", expect.anything());
  await act(async () =>
    [...container.querySelectorAll("button")]
      .find((entry) => entry.textContent === "Verify and add")
      ?.click(),
  );
  expect(state.rpc).toHaveBeenCalledWith(
    "capabilities/install",
    expect.objectContaining({
      kind: "mcp",
      name,
      source: endpoint,
      config: { preset: "custom", auth: { type: auth } },
    }),
  );
});

it("explains the native OAuth limitation only when an OAuth-only preset is selected", async () => {
  vi.mocked(Alert.alert).mockClear();
  await render();
  const row = [...container.querySelectorAll('[data-testid="mcp-preset"]')].find((entry) =>
    entry.textContent?.startsWith("Notion"),
  )!;
  await act(async () => row.querySelector("button")?.click());
  expect(Alert.alert).toHaveBeenCalledWith(
    "Notion",
    "Connect this MCP server in the web app to sign in with OAuth.",
  );
  expect(container.querySelector('input[placeholder="Display name"]')).toBeNull();
  expect(state.rpc).not.toHaveBeenCalledWith("capabilities/install", expect.anything());
});

it.each([
  { label: "MCP server", kind: "mcp", endpoint: "https://example.test/mcp" },
  { label: "OpenAPI", kind: "api", endpoint: "https://example.test/openapi.json" },
  { label: "GraphQL", kind: "graphql", endpoint: "https://example.test/graphql" },
])(
  "adds $label without opening Advanced or configuring a catalog",
  async ({ label, kind, endpoint }) => {
    let installed = false;
    const source = { id: "source-a", name: "Example integration", kind, source: endpoint };
    const fallback = state.rpc.getMockImplementation()!;
    state.rpc.mockImplementation((proc: string) => {
      if (proc === "capabilities/install") {
        installed = true;
        return Promise.resolve(source);
      }
      if (proc === "capabilities/list") return Promise.resolve(installed ? [source] : []);
      return fallback(proc);
    });
    await render();
    await act(async () => resolveCatalog([]));
    expect(container.textContent).not.toContain("Add Treg");
    const button = (name: string) =>
      [...container.querySelectorAll("button")].find((entry) => entry.textContent === name);
    await act(async () => button("Add integration")?.click());
    await act(async () => button(label)?.click());
    expect(container.textContent).not.toContain("Add Treg");
    const inputs = container.querySelectorAll("input");
    const nameInput = [...inputs].find((entry) => entry.placeholder === "Display name")!;
    const endpointInput = [...inputs].find(
      (entry) => entry.placeholder === endpoint.replace(".test", ".com"),
    )!;
    await act(async () => {
      for (const [input, value] of [
        [nameInput, source.name],
        [endpointInput, endpoint],
      ] as const) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          value,
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await act(async () => button("Verify and add")?.click());
    expect(state.rpc).toHaveBeenCalledWith("capabilities/install", {
      kind,
      name: source.name,
      source: endpoint,
      credential: undefined,
      config: {
        ...(kind === "api" ? { openApi: true } : kind === "mcp" ? { preset: "custom" } : {}),
        auth: { type: "none" },
      },
    });
    expect(
      container.querySelector('[data-testid="installed-tool-sources"]')?.textContent,
    ).toContain(source.name);
    expect(container.querySelector('input[placeholder="Display name"]')).toBeNull();
  },
);

it("clears a custom source form on scope change and ignores its late install result", async () => {
  await render();
  await act(async () => resolveCatalog([]));
  const button = (label: string) =>
    [...container.querySelectorAll("button")].find((entry) => entry.textContent === label);
  await act(async () => button("Add integration")?.click());
  await act(async () => button("MCP server")?.click());
  const fallback = state.rpc.getMockImplementation()!;
  let finish!: (value: unknown) => void;
  const installing = new Promise((resolve) => {
    finish = resolve;
  });
  state.rpc.mockImplementation((proc: string) =>
    proc === "capabilities/install" ? installing : fallback(proc),
  );
  await act(async () => button("Verify and add")?.click());
  expect(state.rpc).toHaveBeenCalledWith("capabilities/install", expect.anything());
  state.focused = false;
  await render();
  state.current = false;
  state.scope.mockImplementation(async () => {
    state.current = true;
    return { userId: "user-a", spaceId: "space-b" };
  });
  state.rpc.mockImplementation(() => Promise.resolve([]));
  state.focused = true;
  await render();
  expect(container.querySelector('input[placeholder="Display name"]')).toBeNull();
  const calls = state.rpc.mock.calls.length;
  await act(async () => finish({ id: "old-source" }));
  expect(state.rpc).toHaveBeenCalledTimes(calls);
  expect(container.querySelector('[data-testid="installed-tool-sources"]')).toBeNull();
});

it("keeps Search visible and shows rows on a cold load until the first success", async () => {
  await render();
  expect(container.querySelector('input[placeholder="Search apps"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="integrations-loading"]')?.children).toHaveLength(8);
  await act(async () => resolveCatalog([item]));
  expect(container.querySelector('[data-testid="integrations-loading"]')).toBeNull();
  expect(container.textContent).toContain("Example appAdded");
  expect(state.write).toHaveBeenCalledWith(expect.anything(), {
    catalog: [item],
    connections: [account],
  });
});
it("paints the cached list and Added state before replacing it in the background", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  await render();
  expect(container.textContent).toContain("Example appAdded");
  expect(container.querySelector('[data-testid="integrations-loading"]')).toBeNull();
  await act(async () => resolveCatalog([{ ...item, name: "Refreshed app" }]));
  expect(container.textContent).toContain("Refreshed appAdded");
});
it("keeps cached rows after a refresh failure and offers Retry", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  await render();
  await act(async () => rejectCatalog(new Error("Unavailable")));
  expect(container.textContent).toContain("Example appAdded");
  const retry = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "Retry",
  );
  expect(retry).toBeDefined();
  state.rpc.mockImplementation((proc: string) =>
    Promise.resolve(
      proc === "connections/catalog" ? [item] : proc === "connections/list" ? [account] : [],
    ),
  );
  await act(async () => retry?.click());
  expect(container.textContent).not.toContain("Retry");
});
it("offers Retry on a cold failure without leaving a loading placeholder", async () => {
  await render();
  await act(async () => rejectCatalog(new Error("Unavailable")));
  expect(container.textContent).toContain("Retry");
  expect(container.querySelector('[data-testid="integrations-loading"]')).toBeNull();
});
it("ignores a refresh after its scope changes", async () => {
  await render();
  state.current = false;
  state.scope.mockRejectedValue(new Error("session changed"));
  await act(async () => resolveCatalog([item]));
  expect(container.textContent).not.toContain("Example app");
  expect(state.write).not.toHaveBeenCalled();
});
it.each(["https://example.test/logo.svg?version=1", "https://example.test/logo.SVG#icon"])(
  "renders SVG catalog artwork with SvgUri: %s",
  async (logo) => {
    await render(<ConnectorIcon name="Example" logo={logo} size={32} />);
    expect(container.querySelector("svg")?.getAttribute("data-uri")).toBe(logo);
    expect(container.querySelector("img")).toBeNull();
    await act(async () =>
      container.querySelector("svg")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(container.textContent).toBe("E");
    await render(<ConnectorIcon name="Example" logo="https://example.test/new.svg" />);
    expect(container.querySelector("svg")).not.toBeNull();
  },
);
it("retries extensionless artwork as SVG before falling back", async () => {
  const logo = "https://logos.example.test/api/gmail";
  await render(<ConnectorIcon name="Example" logo={logo} />);
  expect(container.querySelector("img")?.getAttribute("src")).toContain(logo);
  await act(async () => container.querySelector("img")?.dispatchEvent(new Event("error")));
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector("svg")?.getAttribute("data-uri")).toBe(logo);
  await act(async () =>
    container.querySelector("svg")?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
  expect(container.textContent).toBe("E");
});
it("falls back for absent logos and empty names", async () => {
  await render(<ConnectorIcon name=" example" logo={null} />);
  expect(container.textContent).toBe("E");
  await render(<ConnectorIcon name=" " />);
  expect(container.textContent).toBe("?");
});

it("persists a rename before a pending stale refresh can overwrite it", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  await render();
  const added = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "Added",
  );
  await act(async () => added?.click());
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input,
      "Renamed",
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  state.rpc.mockImplementation((proc: string) =>
    proc === "connections/rename"
      ? Promise.resolve({ ...account, displayName: "Renamed" })
      : Promise.resolve([]),
  );
  await act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  expect(state.write).toHaveBeenLastCalledWith(expect.anything(), {
    catalog: [item],
    connections: [{ ...account, displayName: "Renamed" }],
  });
  await act(async () => resolveCatalog([item]));
  expect(container.querySelector("input")?.value).toBe("Renamed");
  expect(state.write).toHaveBeenCalledTimes(1);
});

it.each(["Remove", "Uninstall"])(
  "persists revoked Added state after %s even if the following refresh fails",
  async (action) => {
    state.read.mockReturnValue({ catalog: [item], connections: [account] });
    await render();
    const added = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Added",
    );
    await act(async () => added?.click());
    state.rpc.mockImplementation((proc: string) =>
      proc === "connections/catalog"
        ? Promise.reject(new Error("Unavailable"))
        : Promise.resolve([]),
    );
    const remove = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === action,
    );
    await act(async () => remove?.click());
    expect(state.write).toHaveBeenLastCalledWith(expect.anything(), {
      catalog: [{ ...item, connected: false }],
      connections: [{ ...account, status: "revoked" }],
    });
  },
);

it("persists a completed connection before refreshing", async () => {
  state.read.mockReturnValue({ catalog: [{ ...item, connected: false }], connections: [] });
  await render();
  state.rpc.mockImplementation((proc: string) => {
    if (proc === "connections/begin")
      return Promise.resolve({ connectionId: account.id, authorizationUrl: null });
    if (proc === "connections/complete") return Promise.resolve(account);
    if (proc === "connections/catalog") return Promise.reject(new Error("Unavailable"));
    return Promise.resolve([]);
  });
  const add = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "Add" && !button.closest('[data-testid="mcp-presets"]'),
  );
  await act(async () => add?.click());
  expect(state.write).toHaveBeenLastCalledWith(expect.anything(), {
    catalog: [item],
    connections: [account],
  });
  expect(container.textContent).toContain("Example appAdded");
});

it("paints persisted cached rows while identity is pending or offline", async () => {
  state.persisted.mockResolvedValue({ userId: "user-a", spaceId: "space-a" });
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  let rejectIdentity!: (error: Error) => void;
  state.scope.mockReturnValue(
    new Promise((_, reject) => {
      rejectIdentity = reject;
    }),
  );
  await render();
  expect(container.textContent).toContain("Example appAdded");
  expect(state.rpc).not.toHaveBeenCalled();
  await act(async () => rejectIdentity(new Error("offline")));
  expect(container.textContent).toContain("Example appAdded");
  expect(container.textContent).toContain("Retry");
});

it("rebuilds a stale space and continues refreshing while the screen stays open", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  await render();
  state.current = false;
  state.scope.mockImplementation(async () => {
    state.current = true;
    return { userId: "user-a", spaceId: "space-b" };
  });
  state.read.mockReturnValue(null);
  state.rpc.mockImplementation((proc: string) =>
    Promise.resolve(
      proc === "connections/catalog" ? [{ ...item, name: "Recovered app", connected: false }] : [],
    ),
  );
  await act(async () => resolveCatalog([item]));
  expect(state.scope).toHaveBeenCalledTimes(2);
  expect(container.textContent).not.toContain("Example app");
  expect(container.textContent).toContain("Recovered appAdd");
  expect(state.write).toHaveBeenLastCalledWith(
    { userId: "user-a", spaceId: "space-b" },
    {
      catalog: [{ ...item, name: "Recovered app", connected: false }],
      connections: [],
    },
  );
});

it("keeps sources loading when a rename cancels the catalog refresh", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  let resolveSources!: (value: unknown[]) => void;
  const sources = new Promise<unknown[]>((resolve) => {
    resolveSources = resolve;
  });
  const original = state.rpc.getMockImplementation()!;
  state.rpc.mockImplementation((proc: string) =>
    proc === "capabilities/list" ? sources : original(proc),
  );
  await render();
  await act(async () =>
    [...container.querySelectorAll("button")].find((b) => b.textContent === "Added")?.click(),
  );
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input,
      "Renamed",
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  state.rpc.mockImplementation((proc: string) =>
    proc === "connections/rename"
      ? Promise.resolve({ ...account, displayName: "Renamed" })
      : original(proc),
  );
  await act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  await act(async () => resolveCatalog([item]));
  await act(async () =>
    resolveSources([
      { id: "source-a", name: "Installed source", kind: "mcp", source: "https://example.test/mcp" },
    ]),
  );
  await act(async () =>
    [...container.querySelectorAll("button")].find((b) => b.textContent === "Back")?.click(),
  );
  await act(async () =>
    [...container.querySelectorAll("button")].find((b) => b.textContent === "Advanced")?.click(),
  );
  expect(container.textContent).toContain("Installed source");
  expect(container.textContent).not.toContain("No custom sources installed.");
  expect([...container.querySelectorAll("button")].some((b) => b.textContent === "Remove")).toBe(
    true,
  );
});

it("refreshes a different space on focus return and rejects the blurred refresh", async () => {
  state.read.mockReturnValue({ catalog: [item], connections: [account] });
  await render();
  state.focused = false;
  await render();
  await act(async () => resolveCatalog([{ ...item, name: "Late old app" }]));
  expect(container.textContent).not.toContain("Late old app");
  state.current = false;
  state.scope.mockImplementation(async () => {
    state.current = true;
    return { userId: "user-a", spaceId: "space-b" };
  });
  state.read.mockReturnValue(null);
  let resolveNew!: (items: (typeof item)[]) => void;
  const pending = new Promise<(typeof item)[]>((resolve) => {
    resolveNew = resolve;
  });
  state.rpc.mockImplementation((proc: string) =>
    proc === "connections/catalog" ? pending : Promise.resolve([]),
  );
  state.focused = true;
  await render();
  expect(container.textContent).not.toContain("Example app");
  expect(container.querySelector('[data-testid="integrations-loading"]')).not.toBeNull();
  await act(async () => resolveNew([{ ...item, name: "New space app", connected: false }]));
  expect(container.textContent).toContain("New space appAdd");
  expect(state.scope).toHaveBeenCalledTimes(2);
});

it.each(["rename", "revoke", "uninstall", "connect"])(
  "rejects a late %s result after an in-place space recovery",
  async (action) => {
    state.read.mockReturnValue({ catalog: [item], connections: [account] });
    await render();
    await act(async () =>
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Added")?.click(),
    );
    let finish!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    const original = state.rpc.getMockImplementation()!;
    state.rpc.mockImplementation((proc: string) => {
      if (
        proc === "connections/rename" ||
        proc === "connections/revoke" ||
        proc === "connections/complete"
      )
        return pending;
      if (proc === "connections/begin")
        return Promise.resolve({ connectionId: account.id, authorizationUrl: null });
      return original(proc);
    });
    if (action === "rename") {
      const input = container.querySelector("input")!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          "Old space rename",
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    } else {
      const label =
        action === "revoke" ? "Remove" : action === "uninstall" ? "Uninstall" : "Add another";
      await act(async () =>
        [...container.querySelectorAll("button")].find((b) => b.textContent === label)?.click(),
      );
    }
    expect(state.rpc).toHaveBeenCalledWith(
      action === "rename"
        ? "connections/rename"
        : action === "connect"
          ? "connections/complete"
          : "connections/revoke",
      expect.anything(),
    );
    state.current = false;
    state.scope.mockImplementation(async () => {
      state.current = true;
      return { userId: "user-a", spaceId: "space-b" };
    });
    state.read.mockReturnValue(null);
    state.rpc.mockImplementation((proc: string) =>
      Promise.resolve(
        proc === "connections/catalog"
          ? [{ ...item, name: "New space app", connected: false }]
          : [],
      ),
    );
    await act(async () => resolveCatalog([item]));
    expect(container.textContent).toContain("New space appAdd");
    const writes = state.write.mock.calls.length;
    await act(async () => finish({ ...account, displayName: "Old space rename" }));
    expect(state.write).toHaveBeenCalledTimes(writes);
    expect(state.write).toHaveBeenLastCalledWith(
      { userId: "user-a", spaceId: "space-b" },
      {
        catalog: [{ ...item, name: "New space app", connected: false }],
        connections: [],
      },
    );
    expect(container.textContent).not.toContain("Old space rename");
  },
);

it("ignores an old focus identity error after the new focus succeeds", async () => {
  let failIdentity!: (reason: Error) => void;
  const pending = new Promise((_, reject) => {
    failIdentity = reject;
  });
  state.scope.mockReturnValueOnce(pending);
  await render();
  state.focused = false;
  await render();
  state.scope.mockResolvedValue({ userId: "user-a", spaceId: "space-b" });
  state.rpc.mockImplementation((proc: string) =>
    Promise.resolve(
      proc === "connections/catalog" ? [{ ...item, name: "New space app", connected: false }] : [],
    ),
  );
  state.focused = true;
  await render();
  expect(container.textContent).toContain("New space appAdd");
  await act(async () => failIdentity(new Error("Old focus failed")));
  expect(container.textContent).not.toContain("Old focus failed");
  expect(container.textContent).not.toContain("Retry");
  expect(container.textContent).toContain("New space appAdd");
});

it("shows registered MCP servers with connector initials and sentence case statuses", async () => {
  const fallback = state.rpc.getMockImplementation();
  state.rpc.mockImplementation((proc: string) =>
    proc === "mcp/servers/list"
      ? Promise.resolve([
          { id: "saved", name: "Saved server", enabled: true, hasSecret: true },
          { id: "open", name: "Open server", enabled: true, hasSecret: false },
        ])
      : fallback?.(proc),
  );
  await render();
  const rows = container.querySelectorAll('[data-testid="registered-mcp-server"]');
  expect(rows).toHaveLength(2);
  expect(rows[0]?.textContent).toBe("SSaved serverCredential saved");
  expect(rows[1]?.textContent).toBe("OOpen serverNo auth");
  for (const row of rows) expect(row.querySelector("button")).toBeNull();
});
