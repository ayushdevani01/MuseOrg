import type * as adapters from "@rakazo/adapters";
import type { Actor, CreateBotInput } from "@rakazo/contracts";
import { beforeEach, expect, it, vi } from "vitest";
import { botsRoutes } from "./bots.js";
import type { RouterContext } from "./context.js";

const models = vi.hoisted(() => ({ validateBotModelChange: vi.fn() }));
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
const input: CreateBotInput = {
  name: "Engineer",
  title: "Staff Engineer",
  description: "",
  instructions: "",
  notifyOnFinish: true,
  computerMode: "team",
  modelProvider: "meta",
  modelId: "muse-wonder-1.0",
};

// Expose handlers directly; schema validation is covered by the contract tests.
function procedures(): unknown {
  return new Proxy(
    {},
    {
      get: (_, key) => (key === "handler" ? (handler: unknown) => handler : procedures()),
    },
  );
}

function fixture() {
  const createBot = vi.fn(async () => ({ id: "engineer", threadId: null }));
  const validationDeps = { boundary: "personal-model-connections" };
  const ctx = {
    deps: { env: { agentRuntime: "pi", requiredPersonalModelProvider: "meta" } },
    repos: { createBot },
    botModelValidation: vi.fn(() => validationDeps),
    authed: procedures(),
  } as unknown as RouterContext;
  const routes = botsRoutes(ctx);
  const create = routes.bots.create as unknown as (args: {
    context: { actor: Actor };
    input: CreateBotInput;
  }) => Promise<unknown>;
  return {
    createBot,
    validationDeps,
    create: (value = input) => create({ context: { actor }, input: value }),
  };
}

beforeEach(() => {
  models.validateBotModelChange.mockReset().mockResolvedValue({
    ok: true,
    provider: "meta",
    model: "muse-wonder-1.0",
    thinkingLevel: null,
  });
});

it("validates the actor's connection and persists the requested model with the new bot", async () => {
  const { create, createBot, validationDeps } = fixture();
  await create();
  expect(models.validateBotModelChange).toHaveBeenCalledExactlyOnceWith(validationDeps, {
    userId: actor.userId,
    spaceId: actor.spaceId,
    provider: "meta",
    model: "muse-wonder-1.0",
  });
  expect(createBot).toHaveBeenCalledExactlyOnceWith(actor, input);
});

it("does not create a bot when the requested connection is unavailable", async () => {
  models.validateBotModelChange.mockResolvedValue({
    ok: false,
    error: "Connect this provider first",
  });
  const { create, createBot } = fixture();
  await expect(create()).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(createBot).not.toHaveBeenCalled();
});

it("rejects another provider before looking up its retained connection", async () => {
  const { create, createBot } = fixture();
  await expect(
    create({ ...input, modelProvider: "openai-codex", modelId: "offline-model" }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  expect(models.validateBotModelChange).not.toHaveBeenCalled();
  expect(createBot).not.toHaveBeenCalled();
});

it("preserves the default-model create flow when there is no override", async () => {
  const { modelProvider: _provider, modelId: _model, ...defaultInput } = input;
  const { create, createBot } = fixture();
  await create(defaultInput);
  expect(models.validateBotModelChange).not.toHaveBeenCalled();
  expect(createBot).toHaveBeenCalledExactlyOnceWith(actor, defaultInput);
});
