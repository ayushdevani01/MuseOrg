import { createRouterClient } from "@orpc/server";
import type * as adapters from "@rakazo/adapters";
import type { Actor } from "@rakazo/contracts";
import { MODEL_REQUIRED_SEND_ERROR } from "@rakazo/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouterDeps } from "./router.js";
import { createRouter } from "./router.js";
import { meDto, modelSetup } from "./routes/shared.js";

const models = vi.hoisted(() => ({
  resolveMemberMainModel: vi.fn(),
  hasHostedModelCredits: vi.fn(),
}));

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

function fixture() {
  const deps = {
    prisma: {
      user: {
        findUniqueOrThrow: vi.fn(async () => ({
          email: actor.email,
          name: "Owner",
          timezone: null,
          signupSurvey: null,
        })),
        update: vi.fn(async () => ({})),
      },
      deploymentSettings: {
        findUnique: vi.fn(async () => ({
          defaultModelProvider: "meta",
          defaultModelId: "muse-wonder-1.0",
        })),
      },
      secret: {
        findFirst: vi.fn(async () => ({ id: "personal-secret", ciphertext: "encrypted-key" })),
      },
    },
    secrets: { load: vi.fn(async () => "offline-personal-key") },
    env: {
      agentRuntime: "pi",
      requiredPersonalModelProvider: "meta",
      defaultProvider: "meta",
      defaultModel: "muse-spark-1.3",
      deploymentModelConfigured: true,
      deploymentModelHostCredentials: true,
      sandboxProvider: "fake",
      webOrigin: "https://app.example.test",
      screenProxySecret: "offline-test-screen-secret",
    },
  } as unknown as RouterDeps;
  return deps;
}

function mainModel(provider = "meta", userId = actor.userId) {
  return {
    provider,
    modelId: "muse-spark-1.3",
    credential: { id: "personal-connection", provider, userId, secretId: "personal-secret" },
  };
}

beforeEach(() => {
  models.resolveMemberMainModel.mockReset().mockResolvedValue(null);
  models.hasHostedModelCredits.mockReset().mockResolvedValue(false);
});

describe("personal model setup policy", () => {
  it("requires the user's own connection even when deployment and host models exist", async () => {
    const deps = fixture();

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      requiredPersonalModelProvider: "meta",
      requiresPersonalModel: true,
      needsModel: true,
      hasDeployment: false,
      main: null,
      model: null,
    });
    await expect(meDto(deps, actor)).resolves.toMatchObject({
      needsModel: true,
      requiredPersonalModelProvider: "meta",
      defaultProvider: null,
      defaultModel: null,
      hostCredentialProvider: null,
      hostCredentialSource: null,
    });
    expect(models.resolveMemberMainModel).toHaveBeenCalledWith(
      { prisma: deps.prisma, secretStore: deps.secrets },
      actor,
    );
  });

  it("accepts an existing matching personal connection without a second setup step", async () => {
    const deps = fixture();
    const main = mainModel();
    models.resolveMemberMainModel.mockResolvedValue(main);

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      needsModel: false,
      hasDeployment: false,
      main,
      model: main,
    });
    await expect(meDto(deps, actor)).resolves.toMatchObject({
      needsModel: false,
      defaultProvider: "meta",
      defaultModel: "muse-spark-1.3",
    });
  });

  it("requires setup again when the personal connection is removed", async () => {
    const deps = fixture();
    models.resolveMemberMainModel.mockResolvedValueOnce(mainModel()).mockResolvedValueOnce(null);

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({ needsModel: false });
    await expect(modelSetup(deps, actor)).resolves.toMatchObject({ needsModel: true, model: null });
  });

  it.each([
    [
      "an OAuth connection",
      JSON.stringify({
        type: "oauth",
        access: "offline-access-token",
        refresh: "offline-refresh-token",
        expires: 0,
      }),
    ],
    [
      "a compatible endpoint",
      JSON.stringify({
        kind: "openai_compatible",
        baseUrl: "https://models.example.test/v1",
        apiKey: "offline-compatible-key",
      }),
    ],
    ["a blank key", "   "],
    ["a corrupt credential", '{"kind":"api_key","key":null}'],
  ])("does not count %s as personal API-key setup", async (_name, plaintext) => {
    const deps = fixture();
    models.resolveMemberMainModel.mockResolvedValue(mainModel());
    vi.mocked(deps.secrets.load).mockResolvedValue(plaintext);

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      needsModel: true,
      main: null,
      model: null,
    });
  });

  it("requires setup when a credential's personal secret has been removed", async () => {
    const deps = fixture();
    models.resolveMemberMainModel.mockResolvedValue(mainModel());
    vi.mocked(deps.prisma.secret.findFirst).mockResolvedValue(null);

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({ needsModel: true });
    expect(deps.prisma.secret.findFirst).toHaveBeenCalledWith({
      where: { id: "personal-secret", userId: actor.userId, spaceId: null },
      select: { id: true, ciphertext: true },
    });
    expect(deps.secrets.load).not.toHaveBeenCalled();
  });

  it.each([
    ["another provider", mainModel("openai")],
    ["another user's connection", mainModel("meta", "other-user")],
    ["hosted credits without a personal connection", { ...mainModel(), credential: null }],
    [
      "a connection for a different provider",
      {
        ...mainModel(),
        credential: { ...mainModel().credential, provider: "openai" },
      },
    ],
  ])("does not count %s as personal setup", async (_name, main) => {
    models.resolveMemberMainModel.mockResolvedValue(main);
    models.hasHostedModelCredits.mockResolvedValue(true);
    const deps = fixture();
    deps.billing = {
      modelCreditsEnabled: true,
      status: vi.fn(async () => ({ funding: "credits", creditPurchasesEnabled: true })),
    } as unknown as RouterDeps["billing"];

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      needsModel: true,
      main: null,
      model: null,
      hasDeployment: false,
    });
    expect(models.hasHostedModelCredits).not.toHaveBeenCalled();
  });

  it("keeps profile/settings access available while refusing a model run", async () => {
    const deps = fixture();
    const client = createRouterClient(createRouter(deps), { context: { actor } as never });

    await expect(client.me()).resolves.toMatchObject({ needsModel: true });
    await expect(client.preferences.update({ timezone: "Asia/Kolkata" })).resolves.toMatchObject({
      needsModel: true,
    });
    await expect(
      client.threads.send({ botId: "bot-1", text: "Hello", clientNonce: "nonce-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: MODEL_REQUIRED_SEND_ERROR });
    await expect(
      client.routines.testRun({ routineId: "routine-1", clientNonce: "nonce-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: MODEL_REQUIRED_SEND_ERROR });
    expect(deps.prisma.user.update).toHaveBeenCalledWith({
      where: { id: actor.userId },
      data: { timezone: "Asia/Kolkata" },
    });
  });

  it("skips the signup survey when personal provider setup is required", async () => {
    const deps = fixture();
    deps.billing = {
      status: vi.fn(async () => ({ funding: "byok" })),
    } as unknown as RouterDeps["billing"];

    await expect(meDto(deps, actor)).resolves.toMatchObject({ needsSignupSurvey: false });
  });

  it("keeps credential-free scripted fixtures explicit", async () => {
    const deps = fixture();
    deps.env.agentRuntime = "scripted";

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      requiredPersonalModelProvider: "meta",
      requiresPersonalModel: false,
      needsModel: false,
    });
  });

  it("preserves provider-neutral deployment defaults when the policy is unset", async () => {
    const deps = fixture();
    delete deps.env.requiredPersonalModelProvider;

    await expect(modelSetup(deps, actor)).resolves.toMatchObject({
      requiredPersonalModelProvider: null,
      requiresPersonalModel: false,
      needsModel: false,
      hasDeployment: true,
      model: { provider: "meta", modelId: "muse-wonder-1.0" },
    });
  });
});
