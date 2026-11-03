// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { prepareConnectionPopup } from "./connection-popup";

afterEach(() => vi.restoreAllMocks());

function setup() {
  const popup = { opener: {}, closed: false, close: vi.fn(), location: { replace: vi.fn() } };
  const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  return { popup, open };
}

it("reserves an isolated window before the authorization request finishes", async () => {
  const { popup, open } = setup();
  const authorization = prepareConnectionPopup("Allow popups");
  expect(open).toHaveBeenCalledWith("about:blank", "_blank", "popup,width=560,height=720");
  expect(popup.opener).toBeNull();
  await Promise.resolve();
  authorization.open("https://auth.example.test/google");
  authorization.closeUnused();
  expect(popup.location.replace).toHaveBeenCalledWith("https://auth.example.test/google");
  expect(popup.close).not.toHaveBeenCalled();
});

it("reports blocked sign-in before a remote connection is started", () => {
  vi.spyOn(window, "open").mockReturnValue(null);
  expect(() => prepareConnectionPopup("Allow popups")).toThrow("Allow popups");
});

it("closes the unused window when starting authorization fails or is unnecessary", () => {
  const { popup } = setup();
  const authorization = prepareConnectionPopup("Allow popups");
  authorization.closeUnused();
  expect(popup.close).toHaveBeenCalledOnce();
});

it("does not navigate a sign-in window the user closed while the server was responding", () => {
  const { popup } = setup();
  const authorization = prepareConnectionPopup("Allow popups");
  popup.closed = true;
  expect(() => authorization.open("https://auth.example.test/google")).toThrow("Allow popups");
  expect(popup.location.replace).not.toHaveBeenCalled();
});
