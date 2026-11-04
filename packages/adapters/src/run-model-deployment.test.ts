import { afterEach, expect, it, vi } from "vitest";
import type { ExecutorDeps } from "./executor-deps.js";
import { createConnectedMediaGenerationProvider } from "./media-generation-factory.js";
import type * as modelSelection from "./model-selection.js";
import { resolveConnectedRunModel, resolveModelKey } from "./run-model.js";

const mocks = vi.hoisted(() => ({
  find: vi.fn(async () => null),
  validate: vi.fn(async () => "Provider is not connected"),
}));
vi.mock("./model-selection.js", async (original) => ({
  ...(await original<typeof modelSelection>()),
  findConnectedModelCredential: mocks.find,
  validateConnectedModelChoice: mocks.validate,
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function fixture() {
  vi.stubEnv("PI_DEFAULT_PROVIDER", "meta");
  vi.stubEnv("PI_DEFAULT_MODEL", "muse-spark-1.3-contributor");
  vi.stubEnv("PI_DEFAULT_BACKUP_MODEL", "muse-spark-1.3");
  const deps = {
    deploymentModelKey: "offline-beta-key",
    deploymentModelConfigured: true,
    billingEnabled: false,
    prisma: {},
    secretStore: {},
  } as unknown as ExecutorDeps;
  return deps;
}
it("runs the shared backup without a personal credential or paid credit balance", async () => {
  const deps = fixture();
  const model = await resolveConnectedRunModel(
    deps,
    { userId: "beta-user", spaceId: "beta-space" },
    "meta",
    "muse-spark-1.3",
    undefined,
    true,
  );
  expect(model).toMatchObject({
    provider: "meta",
    id: "muse-spark-1.3",
    apiKey: "offline-beta-key",
  });
  expect(mocks.validate).not.toHaveBeenCalled();
});
it("keeps other models and providers subject to connection validation", async () => {
  const deps = fixture();
  await expect(
    resolveConnectedRunModel(
      deps,
      { userId: "beta-user", spaceId: "beta-space" },
      "other-provider",
      "muse-spark-1.3",
      undefined,
      true,
    ),
  ).rejects.toThrow("not connected");
  await expect(
    resolveConnectedRunModel(
      deps,
      { userId: "beta-user", spaceId: "beta-space" },
      "meta",
      "unconfigured-model",
      undefined,
      true,
    ),
  ).rejects.toThrow("not connected");
});
it("reuses the shared Meta connection for media and never hands its key to another provider", async () => {
  const deps = fixture();
  const connection = await resolveModelKey(
    deps,
    "beta-user",
    "beta-space",
    null,
    "meta",
    "muse-spark-1.3-contributor",
  );
  expect(
    createConnectedMediaGenerationProvider({ provider: "meta", ...connection })?.capabilities,
  ).toMatchObject({ images: true, transcription: true, segmentation: true });
  await expect(
    resolveModelKey(deps, "beta-user", "beta-space", null, "other-provider", "other-model"),
  ).rejects.toThrow();
});
