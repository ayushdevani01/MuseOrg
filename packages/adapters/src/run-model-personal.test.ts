import { MISSING_MODEL_RUN_ERROR } from "@rakazo/core";
import type { PrismaClient } from "@rakazo/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExecutorDeps } from "./executor-deps.js";
import { UnavailableModelForAuthError } from "./model-selection.js";
import * as modelAuth from "./pi-oauth.js";
import { serializeModelSecret } from "./pi-oauth.js";
import { isTerminalModelSetupError, resolveModelKey } from "./run-model.js";

const credential = {
  id: "personal-meta",
  userId: "user-1",
  provider: "meta",
  secretId: "personal-secret",
};

function fixture() {
  const findSecret = vi.fn(async () => ({ id: credential.secretId, ciphertext: "encrypted-key" }));
  const load = vi.fn(async () =>
    serializeModelSecret({ kind: "api_key", key: "offline-personal-key" }),
  );
  const deps = {
    requiredPersonalModelProvider: "meta",
    deploymentModelKey: "offline-deployment-key",
    deploymentModelConfigured: true,
    billingEnabled: true,
    prisma: {
      secret: { findFirst: findSecret },
      deploymentSettings: { findUnique: vi.fn() },
    } as unknown as PrismaClient,
    secretStore: { load },
    runtime: { describe: () => ({ capabilities: { scripted: false } }) },
  } as unknown as ExecutorDeps;
  return { deps, findSecret, load };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("required personal model credentials at execution", () => {
  it.each([
    ["a deployment credential", null, "meta"],
    ["another user's credential", { ...credential, userId: "other-user" }, "meta"],
    ["another provider's credential", { ...credential, provider: "openai" }, "meta"],
    ["another selected provider", credential, "openai"],
  ] as const)(
    "rejects %s before reading a secret or choosing host authentication",
    async (_name, selected, provider) => {
      const { deps, findSecret, load } = fixture();
      vi.stubEnv("PI_DEFAULT_PROVIDER", "meta");
      vi.stubEnv("PI_DEFAULT_CREDENTIALS", "host");

      const result = resolveModelKey(
        deps,
        "user-1",
        "space-1",
        selected,
        provider,
        "muse-spark-1.3",
      );

      await expect(result).rejects.toMatchObject({ message: MISSING_MODEL_RUN_ERROR });
      await expect(result).rejects.toBeInstanceOf(UnavailableModelForAuthError);
      expect(findSecret).not.toHaveBeenCalled();
      expect(load).not.toHaveBeenCalled();
    },
  );

  it("fails terminally if a personal secret is removed after the connection was selected", async () => {
    const { deps, findSecret, load } = fixture();
    findSecret.mockResolvedValue(null as never);

    const error = await resolveModelKey(
      deps,
      "user-1",
      "space-1",
      credential,
      "meta",
      "muse-spark-1.3",
    ).catch((failure: unknown) => failure);

    expect(error).toMatchObject({ message: MISSING_MODEL_RUN_ERROR });
    expect(isTerminalModelSetupError(error)).toBe(true);
    expect(findSecret).toHaveBeenCalledWith({
      where: { id: credential.secretId, userId: "user-1", spaceId: null },
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("does not substitute environment keys for an empty personal secret", async () => {
    const { deps, load } = fixture();
    deps.requiredPersonalModelProvider = "openrouter";
    load.mockResolvedValue(serializeModelSecret({ kind: "api_key", key: "" }));
    vi.stubEnv("OPENROUTER_API_KEY", "offline-host-key");

    await expect(
      resolveModelKey(
        deps,
        "user-1",
        "space-1",
        { ...credential, provider: "openrouter" },
        "openrouter",
        "openai/gpt-6-luna",
      ),
    ).rejects.toThrow(MISSING_MODEL_RUN_ERROR);
  });

  it.each([
    [
      "an expired OAuth connection",
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
    ["a corrupt credential", '{"kind":"api_key","key":null}'],
  ])("rejects %s before resolving or refreshing authentication", async (_name, plaintext) => {
    const { deps, load } = fixture();
    load.mockResolvedValue(plaintext);
    const resolveAuth = vi.spyOn(modelAuth, "resolveModelAuth");

    await expect(
      resolveModelKey(deps, "user-1", "space-1", credential, "meta", "muse-spark-1.3"),
    ).rejects.toMatchObject({ message: MISSING_MODEL_RUN_ERROR });
    expect(resolveAuth).not.toHaveBeenCalled();
  });

  it("uses the matching user's stored key even when hosted credits are enabled", async () => {
    const { deps, findSecret } = fixture();

    await expect(
      resolveModelKey(deps, "user-1", "space-1", credential, "meta", "muse-spark-1.3"),
    ).resolves.toMatchObject({ apiKey: "offline-personal-key", ownCredential: true });
    expect(findSecret).toHaveBeenCalledWith({
      where: { id: credential.secretId, userId: "user-1", spaceId: null },
    });
  });

  it("preserves the explicit credential-free scripted runtime", async () => {
    const { deps } = fixture();
    deps.billingEnabled = false;
    deps.runtime = {
      describe: () => ({ capabilities: { scripted: true } }),
    } as unknown as ExecutorDeps["runtime"];
    vi.stubEnv("OPENROUTER_API_KEY", undefined);

    await expect(
      resolveModelKey(deps, "user-1", "space-1", null, "scripted", "scripted"),
    ).resolves.toMatchObject({ apiKey: undefined });
  });
});
