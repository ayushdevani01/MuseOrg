/** Offline provider HTTP; the public catalog deliberately accepts rejected keys. */
export function createModelConnectionFixtureFetch(
  catalog: ReadonlyArray<{ provider: string; id: string }>,
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    request.signal.throwIfAborted();
    if (request.url === "https://api.meta.ai/v1/responses") {
      if (request.headers.get("authorization") !== "Bearer fake-accepted-meta-key") {
        return Response.json(
          { error: { code: "invalid_api_key", message: "Invalid fixture key" } },
          { status: 401 },
        );
      }
      const body = (await request.json()) as { model?: string };
      if (!catalog.some((model) => model.provider === "meta" && model.id === body.model)) {
        return Response.json(
          { error: { code: "model_not_found", message: "Unknown fixture model" } },
          { status: 404 },
        );
      }
      const events = [
        { type: "response.created", response: { id: "resp_fixture", status: "in_progress" } },
        {
          type: "response.completed",
          response: {
            id: "resp_fixture",
            status: "completed",
            output: [],
            usage: { input_tokens: 1, output_tokens: 0, total_tokens: 1 },
          },
        },
      ];
      return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), {
        headers: { "content-type": "text/event-stream" },
      });
    }
    if (
      request.url === "https://openrouter.ai/api/v1/key" ||
      request.url === "https://ollama.com/api/balance"
    ) {
      const authorization = request.headers.get("authorization");
      const accepted =
        authorization?.startsWith("Bearer ") && authorization !== "Bearer rejected-fixture-key";
      return Response.json({ data: {} }, { status: accepted ? 200 : 401 });
    }
    if (request.url === "https://openrouter.ai/api/v1/models") {
      return Response.json({
        data: catalog
          .filter((model) => model.provider === "openrouter")
          .map((model) => ({ id: model.id })),
      });
    }
    if (request.url === "https://ollama.com/v1/models") {
      return Response.json({ data: [{ id: "fixture-model" }] });
    }
    throw new Error("Unexpected model connection request in the offline fixture");
  };
}
