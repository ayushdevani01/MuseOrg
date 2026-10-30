import { expect, it } from "vitest";
import { createModelConnectionFixtureFetch } from "./model-connection-fixture.js";

it("exposes Ollama models through the compatible fixture while authenticating balance requests", async () => {
  const transport = createModelConnectionFixtureFetch([]);
  const models = await transport("https://ollama.com/v1/models");
  expect(await models.json()).toEqual({ data: [{ id: "fixture-model" }] });
  for (const [key, status] of [
    ["rejected-fixture-key", 401],
    ["fake-fixture-key", 200],
  ] as const) {
    const response = await transport("https://ollama.com/api/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(response.status).toBe(status);
  }
});

it("accepts only the explicit fake Meta key and a catalog model through Responses", async () => {
  const transport = createModelConnectionFixtureFetch([{ provider: "meta", id: "muse-spark-1.3" }]);
  for (const [key, model, status] of [
    ["fake-rejected-meta-key", "muse-spark-1.3", 401],
    ["fake-accepted-meta-key", "unknown", 404],
    ["fake-accepted-meta-key", "muse-spark-1.3", 200],
  ] as const) {
    const response = await transport("https://api.meta.ai/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model }),
    });
    expect(response.status).toBe(status);
    if (status === 200) expect(await response.text()).toContain("response.completed");
  }
});
