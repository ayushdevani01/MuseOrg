// @vitest-environment jsdom

import { ORGANIC_AVATAR_LOOKS } from "@rakazo/core";
import type { ReactNode } from "react";
import { act } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBotDialogInput } from "./create-bot-dialog";

vi.mock("../../components/SkillCatalogPicker", () => ({
  SkillCatalogPicker: () => <div>Skill picker</div>,
}));

vi.mock("@lingui/react/macro", () => {
  const t = (parts: TemplateStringsArray, ...values: unknown[]) =>
    parts.reduce((text, part, index) => `${text}${index > 0 ? values[index - 1] : ""}${part}`, "");
  return { useLingui: () => ({ t }), Trans: ({ children }: { children: ReactNode }) => children };
});

import { CreateBotDialog } from "./create-bot-dialog";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function render(onCreate: (input: CreateBotDialogInput) => Promise<void>) {
  await act(async () => {
    root.render(<CreateBotDialog onCancel={() => undefined} onCreate={onCreate} />);
  });
}

function button(name: string) {
  const found = [...document.querySelectorAll("button")].find(
    (element) => element.getAttribute("aria-label") === name || element.textContent === name,
  );
  if (!found) throw new Error(`No button ${name}`);
  return found;
}

async function typeName(value: string) {
  const input = document.querySelector<HTMLInputElement>('input[placeholder="Name your Bot"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
}

async function continueHiring() {
  await click(document.querySelector<HTMLInputElement>('input[value="engineer"]')!);
  await click(button("Continue"));
}

describe("CreateBotDialog", () => {
  it("creates only once the name is not blank", async () => {
    const onCreate = vi.fn(async () => undefined);
    await render(onCreate);
    expect(button("Continue").disabled).toBe(true);
    await typeName("   ");
    expect(button("Continue").disabled).toBe(true);
    await typeName("  Scout  ");
    expect(button("Continue").disabled).toBe(true);
    await click(document.querySelector<HTMLInputElement>('input[value="engineer"]')!);
    expect(button("Continue").disabled).toBe(false);
  });

  it("sends the organic family the preview draws", async () => {
    const onCreate = vi.fn(async (_input: CreateBotDialogInput) => undefined);
    await render(onCreate);
    await click(button("Shape 2"));
    await click(button("Color #10B981"));
    const preview = document.querySelector(".rakazo-organic-avatar");
    const family = Number(preview?.getAttribute("data-shape-family"));
    await typeName("Scout");
    await continueHiring();
    await click(button("Create"));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Scout",
        color: "#10B981",
        avatarFamily: family,
        title: "Staff Engineer",
        skillImports: [],
      }),
    );
    expect(family).toBe(ORGANIC_AVATAR_LOOKS[1]);
  });

  it("sends a studio shape without an organic family", async () => {
    const onCreate = vi.fn(async (_input: CreateBotDialogInput) => undefined);
    await render(onCreate);
    await click(button("Color #F97316"));
    await click(button("wedge"));
    await typeName("Scout");
    await continueHiring();
    await click(button("Create"));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Scout", color: "#F97316::shape_1" }),
    );
    expect(onCreate.mock.calls[0]?.[0].avatarFamily).toBeUndefined();
  });

  it("shows the error and stays open when creating fails", async () => {
    await render(async () => {
      throw new Error("Bot limit reached");
    });
    await typeName("Scout");
    await continueHiring();
    await click(button("Create"));
    expect(document.querySelector('[data-testid="create-bot-error"]')?.textContent).toBe(
      "Bot limit reached",
    );
    expect(document.querySelector('[data-testid="create-bot-dialog"]')).not.toBeNull();
  });
});

describe("importing instead", () => {
  it("offers Import only when the parent handles it", async () => {
    await render(async () => undefined);
    expect(document.querySelector('[data-testid="create-bot-import"]')).toBeNull();

    const onImport = vi.fn();
    await act(async () => {
      root.render(
        <CreateBotDialog
          onCancel={() => undefined}
          onCreate={async () => undefined}
          onImport={onImport}
        />,
      );
    });
    await act(async () => button("Import").click());
    expect(onImport).toHaveBeenCalledTimes(1);
  });
});
