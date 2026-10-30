import { ORPCError } from "@orpc/server";
import type { ModelCatalogEntry } from "@rakazo/contracts";
import { canonicalPiProviderId } from "@rakazo/contracts";
import type { RouterDeps } from "./router.js";

type PolicyEnv = Pick<RouterDeps["env"], "agentRuntime" | "requiredPersonalModelProvider">;

export function requiredApiKeyProvider(env: PolicyEnv): string | null {
  const provider = env.requiredPersonalModelProvider?.trim();
  return provider && env.agentRuntime !== "scripted" ? canonicalPiProviderId(provider) : null;
}

export function assertSubscriptionSignInAllowed(env: PolicyEnv): void {
  if (requiredApiKeyProvider(env)) {
    throw new ORPCError("FORBIDDEN", {
      message: "Subscription sign-in is unavailable on this deployment.",
    });
  }
}

export function assertModelProviderAllowed(env: PolicyEnv, provider: string): void {
  const required = requiredApiKeyProvider(env);
  if (required && canonicalPiProviderId(provider) !== required) {
    throw new ORPCError("FORBIDDEN", {
      message: "Choose the configured model provider.",
    });
  }
}

/** Only the deployment's runnable API-key provider is offered while its policy is enforced. */
export function modelCatalogForPolicy(
  env: PolicyEnv,
  catalog: ModelCatalogEntry[],
): ModelCatalogEntry[] {
  const provider = requiredApiKeyProvider(env);
  if (!provider) return catalog;
  return catalog
    .filter((entry) => canonicalPiProviderId(entry.provider) === provider && entry.auth !== "oauth")
    .map(({ oauthLabel: _oauthLabel, signIn: _signIn, authHint: _authHint, ...entry }) => ({
      ...entry,
      auth: "api-key" as const,
      subscription: false,
      billing: "Uses your API key",
    }));
}
