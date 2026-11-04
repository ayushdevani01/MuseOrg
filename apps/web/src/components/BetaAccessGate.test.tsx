// @vitest-environment jsdom
import type { ComponentProps, ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@lingui/react/macro", () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
  useLingui: () => ({ t: (parts: TemplateStringsArray) => parts.join("") }),
}));
vi.mock("@rakazo/ui-web", () => ({
  Button: ({ variant: _, ...props }: ComponentProps<"button"> & { variant?: string }) => (
    <button {...props} />
  ),
  Input: (props: ComponentProps<"input">) => <input {...props} />,
  Label: (props: ComponentProps<"label">) => (
    <label htmlFor={props.htmlFor}>{props.children}</label>
  ),
}));
vi.mock("../lib/auth", () => ({ authClient: { signOut: vi.fn() } }));
vi.mock("./PageLoading", () => ({ PageLoading: () => <div>Loading</div> }));

import { BetaAccessGate } from "./BetaAccessGate";

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const request = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", request);
  request.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const render = () =>
  act(async () => root.render(<BetaAccessGate>Private workspace</BetaAccessGate>));
it("shows admission before rendering the workspace", async () => {
  request.mockResolvedValueOnce(Response.json({ admitted: false }));
  await render();
  expect(host.textContent).toContain("Invite code");
  expect(host.textContent).not.toContain("Private workspace");
  request.mockResolvedValueOnce(Response.json({ admitted: true }));
  await act(async () =>
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(host.textContent).toBe("Private workspace");
  expect(request).toHaveBeenLastCalledWith(
    "/api/beta/redeem",
    expect.objectContaining({ method: "POST", credentials: "include" }),
  );
});
it("keeps the gate closed after a rejected invite", async () => {
  request.mockResolvedValueOnce(Response.json({ admitted: false }));
  await render();
  request.mockResolvedValueOnce(Response.json({ error: "Invalid" }, { status: 400 }));
  await act(async () =>
    host
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("Could not verify");
  expect(host.textContent).not.toContain("Private workspace");
});
it("fails closed when the status request fails", async () => {
  request.mockRejectedValueOnce(new Error("offline"));
  await render();
  expect(host.textContent).toContain("Retry");
  expect(host.textContent).not.toContain("Private workspace");
});
it("allows an admitted account without asking again", async () => {
  request.mockResolvedValueOnce(Response.json({ admitted: true }));
  await render();
  expect(host.textContent).toBe("Private workspace");
});
