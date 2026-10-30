import type * as adapters from "@rakazo/adapters";
import type { Actor } from "@rakazo/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertBotModelProviderAllowed, assertRoutineModel } from "./model-pins.js";
import type { RouterDeps } from "./router.js";

const models = vi.hoisted(() => ({ validateConnectedModelChoice: vi.fn() }));
vi.mock("@rakazo/adapters", async (original) => ({
  ...(await original<typeof adapters>()),
  ...models,
}));

const actor: Actor = {
  userId: "owner-1",
  spaceId: "space-1",
  email: "owner@example.test",
  isDeploymentOwner: false,
};

function fixture(env: Partial<RouterDeps["env"]> = {}) {
  return {
    env: { agentRuntime: "pi", requiredPersonalModelProvider: "meta", ...env },
    prisma: {},
    secrets: { load: vi.fn() },
  } as unknown as RouterDeps;
}

beforeEach(() => {
  models.validateConnectedModelChoice.mockReset().mockResolvedValue(undefined);
});

describe("bot model pin provider policy", () => {
  it("rejects a new or changed pin for another provider", () => {
    const deps = fixture();
    for (const current of [undefined, { provider: "meta", model: "offline-meta-model" }]) {
      expect(() =>
        assertBotModelProviderAllowed(deps, {
          provider: "openai-codex",
          model: "offline-model",
          current,
        }),
      ).toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
    }
    expect(deps.secrets.load).not.toHaveBeenCalled();
  });

  it("allows clearing an override and unrelated edits to an existing pin", () => {
    const deps = fixture();
    const current = { provider: "openai-codex", model: "offline-model" };
    expect(() => assertBotModelProviderAllowed(deps, { ...current, current })).not.toThrow();
    expect(() =>
      assertBotModelProviderAllowed(deps, { provider: null, model: null, current }),
    ).not.toThrow();
    expect(() =>
      assertBotModelProviderAllowed(deps, {
        provider: "meta",
        model: "offline-meta-model",
        current,
      }),
    ).not.toThrow();
  });

  it.each([{ requiredPersonalModelProvider: undefined }, { agentRuntime: "scripted" }])(
    "preserves generic and scripted pin choices: %j",
    (env) => {
      expect(() =>
        assertBotModelProviderAllowed(fixture(env), {
          provider: "openai-codex",
          model: "offline-model",
        }),
      ).not.toThrow();
    },
  );
});

describe("routine model pin provider policy", () => {
  const catalog = { read: vi.fn() };

  it("rejects another provider before credential validation or secret reads", async () => {
    const deps = fixture();
    await expect(
      assertRoutineModel(
        deps,
        actor,
        { modelProvider: "openai-codex", modelId: "offline-model" },
        catalog,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(models.validateConnectedModelChoice).not.toHaveBeenCalled();
    expect(deps.secrets.load).not.toHaveBeenCalled();
    expect(catalog.read).not.toHaveBeenCalled();
  });

  it("allows clearing the pin without credential validation", async () => {
    await assertRoutineModel(fixture(), actor, { modelProvider: null, modelId: null }, catalog);
    expect(models.validateConnectedModelChoice).not.toHaveBeenCalled();
  });

  it.each([
    { env: {}, provider: "meta" },
    { env: { requiredPersonalModelProvider: undefined }, provider: "openai-codex" },
    { env: { agentRuntime: "scripted" }, provider: "openai-codex" },
  ])("keeps connection validation for allowed choices: %j", async ({ env, provider }) => {
    const deps = fixture(env);
    await assertRoutineModel(
      deps,
      actor,
      { modelProvider: provider, modelId: "offline-model" },
      catalog,
    );
    expect(models.validateConnectedModelChoice).toHaveBeenCalledExactlyOnceWith(
      deps.prisma,
      deps.secrets,
      actor,
      provider,
      "offline-model",
      { codexCatalog: catalog },
    );
  });
});
