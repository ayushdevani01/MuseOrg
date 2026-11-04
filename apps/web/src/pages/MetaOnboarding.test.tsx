// @vitest-environment jsdom
import type { Me, ModelCatalogEntry } from "@rakazo/contracts";
import type { ComponentProps, ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  me: vi.fn(),
  connect: vi.fn(),
  list: vi.fn(),
  hire: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("../lib/rpc", () => ({
  createSpaceRpc: () => ({
    me: api.me,
    models: { connect: api.connect },
    bots: { list: api.list },
    onboarding: { hireCoworkers: api.hire },
  }),
}));
vi.mock("@lingui/react/macro", () => ({
  useLingui: () => ({ t: (parts: TemplateStringsArray) => parts.join("") }),
  Trans: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@rakazo/ui-web", () => ({
  Button: (props: ComponentProps<"button">) => <button {...props} />,
  Input: (props: ComponentProps<"input">) => <input {...props} />,
  Checkbox: ({
    onCheckedChange,
    ...props
  }: Omit<ComponentProps<"input">, "onChange"> & { onCheckedChange: (value: boolean) => void }) => (
    <input type="checkbox" {...props} onChange={(event) => onCheckedChange(event.target.checked)} />
  ),
}));
vi.mock("../components/ai/primitives", () => ({ LoadingState: () => <span role="status" /> }));
vi.mock("../components/PageLoading", () => ({ PageLoading: () => <span data-testid="loading" /> }));

import { MetaOnboarding } from "./MetaOnboarding";

const me = { userId: "user-a", needsModel: true, requiredPersonalModelProvider: "meta" } as Me;
const catalog = [
  { provider: "meta", id: "muse-spark-1.3" },
  { provider: "meta", id: "muse-wonder-1.0" },
] as ModelCatalogEntry[];
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
function Location() {
  return <output>{useLocation().pathname}</output>;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  api.connect.mockResolvedValue({ id: "connection" });
  api.me.mockResolvedValue({ ...me, needsModel: false });
  api.list.mockResolvedValue([]);
  api.hire.mockResolvedValue({ botIds: ["hired"] });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function render(initialMe = me) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/onboarding/model"]}>
        <MetaOnboarding initialMe={initialMe} catalog={catalog} onReload={api.reload} />
        <Location />
      </MemoryRouter>,
    ),
  );
}
async function key(value: string) {
  await act(async () => {
    const input = host.querySelector("input")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => {
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

it("saves through the account model connection and rechecks before offering coworkers", async () => {
  await render();
  expect(host.querySelector("input")?.type).toBe("password");
  expect(host.querySelector("button")?.disabled).toBe(true);
  await key("fake-meta-key");
  await submit();
  expect(api.connect).toHaveBeenCalledExactlyOnceWith({
    provider: "meta",
    apiKey: "fake-meta-key",
    modelId: "muse-spark-1.3",
    label: "Meta",
    scope: "account",
  });
  expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(4);
  expect(host.querySelector("output")?.textContent).toBe("/onboarding/coworkers");
  expect(api.hire).not.toHaveBeenCalled();
});

it("keeps invalid credentials in setup and hides raw provider error details", async () => {
  api.connect.mockRejectedValue(new Error("provider leaked fake-meta-key"));
  await render();
  await key("fake-meta-key");
  await submit();
  expect(host.querySelector("[role=alert]")?.textContent).toBe(
    "Could not connect to Meta. Check your key and try again.",
  );
  expect(host.textContent).not.toContain("provider leaked");
  expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  expect(api.me).not.toHaveBeenCalled();
  expect(api.hire).not.toHaveBeenCalled();
});

it("revisits an existing team without asking for the stored key", async () => {
  api.list.mockResolvedValue([{ id: "existing" }]);
  await render({ ...me, needsModel: false });
  expect(host.querySelector('input[type="password"]')).toBeNull();
  expect(host.querySelector("output")?.textContent).toBe("/app/existing");
  expect(api.connect).not.toHaveBeenCalled();
});

it("offers all four roles with a shared model and no personal key or model catalog", async () => {
  await render({
    ...me,
    needsModel: false,
    requiredPersonalModelProvider: null,
    defaultProvider: "local",
    defaultModel: "shared",
  });
  expect(host.querySelector('input[type="password"]')).toBeNull();
  expect(
    [...host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].every(
      (input) => input.checked,
    ),
  ).toBe(true);
  await act(async () => host.querySelector("button")!.click());
  expect(api.hire).toHaveBeenCalledExactlyOnceWith({
    templateIds: ["chief", "engineer", "creative", "growth"],
  });
  expect(api.connect).not.toHaveBeenCalled();
  expect(host.querySelector("output")?.textContent).toBe("/app/hired");
});

it("fails closed when loading the existing team fails", async () => {
  api.list.mockRejectedValue(new Error("offline"));
  await render({ ...me, needsModel: false });
  expect(host.querySelector("[role=alert]")?.textContent).toBe("Could not load setup.");
  expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  expect(api.hire).not.toHaveBeenCalled();
});

it("returns to setup when the server rejects hiring after a key was removed", async () => {
  await render({ ...me, needsModel: false });
  api.me.mockResolvedValue(me);
  api.hire.mockRejectedValue(new Error("Connection removed"));
  await act(async () => {
    host.querySelector("button")!.click();
  });
  expect(api.hire).toHaveBeenCalledWith({
    templateIds: ["chief", "engineer", "creative", "growth"],
  });
  expect(api.reload).toHaveBeenCalledOnce();
});
