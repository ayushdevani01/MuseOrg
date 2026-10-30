// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  me: vi.fn(),
  bots: vi.fn(),
  response: undefined as ((response: Response) => void) | undefined,
}));
vi.mock("../lib/rpc", () => ({
  rpc: { me: api.me, bots: { list: api.bots } },
  onRpcResponse: (listener: (response: Response) => void) => {
    api.response = listener;
    return () => {
      api.response = undefined;
    };
  },
}));
vi.mock("@lingui/react/macro", () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@rakazo/ui-web", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />,
}));
vi.mock("./PageLoading", () => ({ PageLoading: () => <div>Loading</div> }));

import { PersonalModelGate } from "./PersonalModelGate";

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  api.me.mockResolvedValue({ requiredPersonalModelProvider: "meta", needsModel: false });
  api.bots.mockResolvedValue([{ id: "chief" }]);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function render() {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/app" element={<PersonalModelGate>Workspace</PersonalModelGate>} />
          <Route path="/onboarding/:step" element={<div>Setup</div>} />
        </Routes>
      </MemoryRouter>,
    ),
  );
}

it("blocks an existing workspace when the user's own model is missing", async () => {
  api.me.mockResolvedValue({ requiredPersonalModelProvider: "meta", needsModel: true });
  await render();
  expect(host.textContent).toBe("Setup");
  expect(api.bots).not.toHaveBeenCalled();
});

it("offers hiring for a connected account without coworkers", async () => {
  api.bots.mockResolvedValue([]);
  await render();
  expect(host.textContent).toBe("Setup");
});

it("keeps the workspace open on deployments without the personal-provider requirement", async () => {
  api.me.mockResolvedValue({ needsModel: true });
  await render();
  expect(host.textContent).toBe("Workspace");
  expect(api.bots).not.toHaveBeenCalled();
});

it("fails closed and recovers through an explicit retry", async () => {
  api.me.mockRejectedValueOnce(new Error("offline"));
  await render();
  expect(host.querySelector("[role=alert]")?.textContent).toBe("Could not load setup.");
  expect(host.textContent).not.toContain("Workspace");
  await act(async () => {
    host.querySelector("button")!.click();
  });
  expect(host.textContent).toBe("Workspace");
});

it("returns to setup when the server rejects a run after key removal", async () => {
  await render();
  expect(host.textContent).toBe("Workspace");
  api.me.mockResolvedValue({ requiredPersonalModelProvider: "meta", needsModel: true });
  await act(async () => {
    api.response?.(
      new Response(JSON.stringify({ json: { message: "Connect a model to start a run." } }), {
        status: 400,
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(host.textContent).toBe("Setup");
});
