import { createRouterClient } from "@orpc/server";
import { serializeModelSecret } from "@rakazo/adapters";
import type { Actor, ModelCatalogEntry } from "@rakazo/contracts";
import { describe, expect, it, vi } from "vitest";
import { persistModelCredential, prepareModelCredential } from "./model-credentials.js";
import { assertModelProviderAllowed, modelCatalogForPolicy } from "./model-provider-policy.js";
import type { RouterDeps } from "./router.js";
import { createRouter } from "./router.js";

const actor: Actor = {
  userId: "user-1",
  spaceId: "space-1",
  email: "owner@example.test",
  isDeploymentOwner: false,
};

const offlineCredential = {
  type: "oauth" as const,
  access: "offline-access",
  refresh: "offline-refresh",
  expires: 1,
};

function fixture(env: Partial<RouterDeps["env"]> = {}) {
  const oauth = {
    begin: vi.fn(async () => ({
      loginId: "login-1",
      provider: "openai-codex",
      mode: "auth-url" as const,
      verificationUri: "https://auth.example.test/authorize",
      expiresInSeconds: 60,
    })),
    submit: vi.fn(),
    complete: vi.fn(),
    finish: vi.fn(),
    cancel: vi.fn(),
  };
  const put = vi.fn(async () => ({ id: "secret-1", ciphertext: "offline-ciphertext" }));
  const transaction = vi.fn();
  const connectionFetch = vi.fn(async () => {
    throw new Error("Unexpected offline connection request");
  });
  const codexCatalog = { read: vi.fn(), invalidate: vi.fn() };
  const deps = {
    prisma: {
      userModelCredential: { findMany: vi.fn(async () => []) },
      userModelPreference: { findMany: vi.fn(async () => []) },
      $transaction: transaction,
    },
    secrets: { put, load: vi.fn() },
    oauthLogins: oauth,
    codexCatalog,
    modelConnectionFetch: connectionFetch,
    env: {
      agentRuntime: "pi",
      requiredPersonalModelProvider: "meta",
      defaultProvider: "meta",
      defaultModel: "muse-spark-1.3",
      sandboxProvider: "fake",
      webOrigin: "https://app.example.test",
      screenProxySecret: "offline-screen-secret",
      ...env,
    },
  } as unknown as RouterDeps;
  const client = createRouterClient(createRouter(deps), { context: { actor } as never });
  return { deps, client, oauth, put, transaction, codexCatalog, connectionFetch };
}

describe("required API-key provider policy", () => {
  it.each(["openai-codex", "openai-compatible"])(
    "rejects %s defaults, role choices and backups before credential access",
    async (provider) => {
      const { deps, client, codexCatalog, transaction } = fixture();
      const choice = { provider, modelId: "offline-model" };
      await expect(client.models.setDefault(choice)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        client.models.setRole({ role: "approval", primary: choice }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(client.models.setBackups([choice])).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(deps.prisma.userModelCredential.findMany).not.toHaveBeenCalled();
      expect(deps.prisma.userModelPreference.findMany).not.toHaveBeenCalled();
      expect(deps.secrets.load).not.toHaveBeenCalled();
      expect(codexCatalog.read).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    },
  );

  it("rejects an implicit default connection before verifying or storing its key", async () => {
    const { deps, client, put, transaction, connectionFetch } = fixture();
    await expect(
      client.models.connect({
        provider: "openai",
        modelId: "offline-model",
        apiKey: "offline-key",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deps.prisma.userModelCredential.findMany).not.toHaveBeenCalled();
    expect(deps.secrets.load).not.toHaveBeenCalled();
    expect(connectionFetch).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rechecks imported default choices while allowing optional non-default API keys", async () => {
    const { deps, codexCatalog, put } = fixture();
    const input = {
      provider: "openai-compatible",
      credentialId: null,
      modelId: "offline-model",
      plaintext: serializeModelSecret({
        kind: "openai_compatible",
        baseUrl: "https://models.example.test/v1",
        apiKey: "offline-api-key",
      }),
    };
    await expect(prepareModelCredential(deps, actor, input, codexCatalog)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(put).not.toHaveBeenCalled();
    await expect(
      prepareModelCredential(deps, actor, { ...input, makeDefault: false }, codexCatalog),
    ).resolves.toMatchObject({ defaultModel: "offline-model" });
    expect(put).toHaveBeenCalledOnce();
  });

  it("preserves the required provider and generic or scripted model choices", () => {
    expect(() =>
      assertModelProviderAllowed(
        { agentRuntime: "pi", requiredPersonalModelProvider: " meta " },
        "meta",
      ),
    ).not.toThrow();
    for (const env of [
      { agentRuntime: "pi", requiredPersonalModelProvider: undefined },
      { agentRuntime: "pi", requiredPersonalModelProvider: "" },
      { agentRuntime: "scripted", requiredPersonalModelProvider: "meta" },
    ]) {
      expect(() => assertModelProviderAllowed(env, "openai-codex")).not.toThrow();
    }
  });

  it("rejects subscription sign-in before starting, polling, submitting, or persisting it", async () => {
    const { client, oauth, put, transaction } = fixture();

    await expect(
      client.models.beginOAuth({ provider: "openai-codex", credentialId: null }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      client.models.submitOAuthCode({ loginId: "login-1", code: "offline-code" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(client.models.completeOAuth({ loginId: "login-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(client.models.finishOAuth({ loginId: "login-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    for (const method of [
      oauth.begin,
      oauth.submit,
      oauth.complete,
      oauth.finish,
      put,
      transaction,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
    await expect(client.models.cancelOAuth({ loginId: "login-1" })).resolves.toEqual({ ok: true });
    expect(oauth.cancel).toHaveBeenCalledWith("login-1", actor);
  });

  it.each([
    { requiredPersonalModelProvider: undefined },
    { requiredPersonalModelProvider: "", agentRuntime: "pi" },
    { requiredPersonalModelProvider: "meta", agentRuntime: "scripted" },
  ])("retains subscription sign-in without an enforced policy: %j", async (env) => {
    const { client, oauth } = fixture(env);
    await expect(
      client.models.beginOAuth({ provider: "openai-codex", credentialId: null }),
    ).resolves.toMatchObject({ loginId: "login-1" });
    expect(oauth.begin).toHaveBeenCalledOnce();
  });

  it("rejects imported OAuth credentials before encryption or a database transaction", async () => {
    const { deps, codexCatalog, put, transaction } = fixture();
    await expect(
      persistModelCredential(
        deps,
        actor,
        {
          provider: "openai-codex",
          credentialId: null,
          plaintext: serializeModelSecret({ kind: "oauth", credential: offlineCredential }),
        },
        codexCatalog,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(put).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rechecks the policy if a sign-in started before the policy changed", async () => {
    const { deps, client, oauth, put, transaction } = fixture({
      requiredPersonalModelProvider: undefined,
    });
    oauth.finish.mockImplementation(async (_id, _actor, persist) => {
      deps.env.requiredPersonalModelProvider = "meta";
      return {
        status: "connected",
        value: await persist({
          status: "connected",
          provider: "openai-codex",
          credentialId: null,
          credential: offlineCredential,
          label: "Offline account",
          signal: new AbortController().signal,
        }),
      };
    });
    await expect(client.models.finishOAuth({ loginId: "login-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(put).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("keeps compatible API-key connections available through the generic settings", async () => {
    const { deps, codexCatalog, put } = fixture({
      requiredPersonalModelProvider: "openai-compatible",
    });
    await expect(
      prepareModelCredential(
        deps,
        actor,
        {
          provider: "openai-compatible",
          credentialId: null,
          modelId: "offline-model",
          plaintext: serializeModelSecret({
            kind: "openai_compatible",
            baseUrl: "https://models.example.test/v1",
            apiKey: "offline-api-key",
          }),
        },
        codexCatalog,
      ),
    ).resolves.toMatchObject({ defaultModel: "offline-model" });
    expect(put).toHaveBeenCalledOnce();
    expect(codexCatalog.read).not.toHaveBeenCalled();
  });

  it("offers only the required provider in chat and approval catalogs", async () => {
    const { client, codexCatalog } = fixture();
    for (const catalog of [
      await client.models.list(),
      await client.models.forRole({ role: "approval" }),
    ]) {
      expect(catalog.length).toBeGreaterThan(0);
      expect(new Set(catalog.map((entry) => entry.provider))).toEqual(new Set(["meta"]));
      for (const entry of catalog) {
        expect(entry.auth).toBe("api-key");
        expect(entry.subscription).toBe(false);
        expect(entry).not.toHaveProperty("signIn");
        expect(entry).not.toHaveProperty("oauthLabel");
      }
    }
    expect(codexCatalog.read).not.toHaveBeenCalled();
  });

  it("removes subscription-only entries and sign-in metadata without changing generic catalogs", () => {
    const entries: ModelCatalogEntry[] = [
      {
        provider: "example",
        id: "both-model",
        label: "Both",
        billing: "Subscription or key",
        auth: "both",
        subscription: true,
        signIn: "device-code",
        oauthLabel: "Example account",
        authHint: "Sign in",
      },
      {
        provider: "example",
        id: "subscription-model",
        label: "Subscription",
        billing: "Subscription",
        auth: "oauth",
      },
    ];
    expect(
      modelCatalogForPolicy(
        { agentRuntime: "pi", requiredPersonalModelProvider: "example" },
        entries,
      ),
    ).toEqual([
      {
        provider: "example",
        id: "both-model",
        label: "Both",
        billing: "Uses your API key",
        auth: "api-key",
        subscription: false,
      },
    ]);
    for (const env of [
      { agentRuntime: "pi", requiredPersonalModelProvider: undefined },
      { agentRuntime: "scripted", requiredPersonalModelProvider: "example" },
    ]) {
      expect(modelCatalogForPolicy(env, entries)).toBe(entries);
    }
  });
});
