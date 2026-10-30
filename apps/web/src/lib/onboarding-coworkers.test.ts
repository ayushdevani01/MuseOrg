import { COWORKER_TEMPLATES } from "@rakazo/core";
import { expect, it, vi } from "vitest";
import { hireOnboardingCoworker } from "./onboarding-coworkers";
import type { RpcClient } from "./rpc";

const template = COWORKER_TEMPLATES[1];
const model = { provider: "meta", id: "muse-wonder-1.0" };

function client() {
  const bots = {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: "engineer",
      modelProvider: model.provider,
      modelId: model.id,
    }),
    update: vi.fn().mockResolvedValue({ id: "engineer" }),
  };
  return { bots, rpc: { bots } as unknown as Pick<RpcClient, "bots"> };
}

it("hires the ordinary editable profile with its role model already assigned", async () => {
  const { bots, rpc } = client();
  await expect(hireOnboardingCoworker(rpc, template, model)).resolves.toEqual({ id: "engineer" });
  expect(bots.create).toHaveBeenCalledWith({
    name: template.name,
    title: template.title,
    description: template.description,
    instructions: template.instructions,
    notifyOnFinish: true,
    spawnKey: "museorg:onboarding:engineer",
    modelProvider: "meta",
    modelId: "muse-wonder-1.0",
  });
  expect(bots.update).not.toHaveBeenCalled();
});

it("repairs a partial hire without creating a duplicate", async () => {
  const { bots, rpc } = client();
  bots.list.mockResolvedValue([
    { id: "engineer", spawnKey: "museorg:onboarding:engineer", modelProvider: null, modelId: null },
  ]);
  await hireOnboardingCoworker(rpc, template, model);
  expect(bots.create).not.toHaveBeenCalled();
  expect(bots.update).toHaveBeenCalledOnce();
});

it("reuses the concurrent winner by exact spawn key and preserves unrelated bots", async () => {
  const { bots, rpc } = client();
  bots.create.mockRejectedValue(new Error("conflict"));
  bots.list.mockResolvedValueOnce([]).mockResolvedValueOnce([
    { id: "other", name: "Engineer", spawnKey: null },
    {
      id: "winner",
      spawnKey: "museorg:onboarding:engineer",
      modelProvider: model.provider,
      modelId: model.id,
    },
  ]);
  await expect(hireOnboardingCoworker(rpc, template, model)).resolves.toEqual({ id: "winner" });
  expect(bots.update).not.toHaveBeenCalled();
});

it("does not create when the initial roster cannot be loaded", async () => {
  const { bots, rpc } = client();
  bots.list.mockRejectedValue(new Error("offline"));
  await expect(hireOnboardingCoworker(rpc, template, model)).rejects.toThrow("offline");
  expect(bots.create).not.toHaveBeenCalled();
});
