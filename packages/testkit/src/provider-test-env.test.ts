import { describe, expect, it } from "vitest";
import { clearProviderTestCredentials } from "./provider-test-env.js";

describe("offline provider credentials", () => {
  it("removes inherited keys, tokens and host credential selectors without removing the test database", () => {
    const env = {
      OPENROUTER_API_KEY: "offline-sentinel",
      META_API_KEY: "offline-sentinel",
      MODEL_API_KEY: "offline-sentinel",
      AWS_BEARER_TOKEN_BEDROCK: "offline-sentinel",
      AWS_SECRET_ACCESS_KEY: "offline-sentinel",
      AWS_PROFILE: "offline-profile",
      HF_TOKEN: "offline-sentinel",
      COPILOT_GITHUB_TOKEN: "offline-sentinel",
      GOOGLE_APPLICATION_CREDENTIALS: "offline-credentials.json",
      ANTHROPIC_IDENTITY_TOKEN_FILE: "offline-token.json",
      DATABASE_URL: "postgres://offline-test",
      PATH: "offline-path",
    };

    clearProviderTestCredentials(env);

    expect(env).toEqual({ DATABASE_URL: "postgres://offline-test", PATH: "offline-path" });
  });
});
