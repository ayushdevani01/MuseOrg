// @vitest-environment jsdom
import type { SkillBundle } from "@rakazo/contracts";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

const bundle: SkillBundle = {
  source: "example/skills",
  key: "fixture",
  name: "fixture",
  description: "A fixture",
  revision: "a".repeat(40),
  sha256: "b".repeat(64),
  url: "https://skills.sh/example/skills/fixture",
  content: "---\nname: fixture\ndescription: A fixture\n---\n\nInspect fixture bytes.\n",
  resources: {},
};
vi.mock("@lingui/react/macro", () => ({
  useLingui: () => ({
    t: (parts: TemplateStringsArray, ...values: unknown[]) =>
      parts.reduce((s, part, i) => `${s}${i ? values[i - 1] : ""}${part}`, ""),
  }),
  Trans: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../lib/space-rpc", () => ({ useSpaceRpc: () => client }));
const client = {
  agentSkills: {
    searchCatalog: vi.fn(async () => [bundle]),
    list: vi.fn(async () => []),
    previewCatalog: vi.fn(async () => bundle),
  },
};

import { SkillCatalogPicker } from "./SkillCatalogPicker";

it("requires preview and explicit selection before adding a remote skill", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onChange = vi.fn();
  try {
    await act(async () =>
      root.render(<SkillCatalogPicker initialQuery="design" selected={[]} onChange={onChange} />),
    );
    expect(client.agentSkills.searchCatalog).toHaveBeenCalledWith({ query: "design" });
    expect(onChange).not.toHaveBeenCalled();
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="Preview fixture"]')!.click(),
    );
    expect(container.querySelector('[data-testid="skill-preview"]')).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    await act(async () =>
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent === "Add skill")!
        .click(),
    );
    expect(onChange).toHaveBeenCalledWith([bundle]);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
