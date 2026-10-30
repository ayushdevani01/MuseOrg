/** Remove ambient provider authentication before deterministic offline tests run. */
export function clearProviderTestCredentials(env: NodeJS.ProcessEnv): void {
  for (const name of Object.keys(env)) {
    if (
      /(?:^|_)(?:API_KEY|AUTH_TOKEN|OAUTH_TOKEN|ACCESS_TOKEN|REFRESH_TOKEN|BEARER_TOKEN)(?:_|$)/.test(
        name,
      ) ||
      [
        "HF_TOKEN",
        "COPILOT_GITHUB_TOKEN",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN",
        "AWS_PROFILE",
        "AWS_SHARED_CREDENTIALS_FILE",
        "AWS_CONFIG_FILE",
        "AWS_WEB_IDENTITY_TOKEN_FILE",
        "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
        "AWS_CONTAINER_CREDENTIALS_FULL_URI",
        "GOOGLE_APPLICATION_CREDENTIALS",
        "ANTHROPIC_IDENTITY_TOKEN_FILE",
      ].includes(name)
    ) {
      delete env[name];
    }
  }
}
