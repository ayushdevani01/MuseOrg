import type { AgentRunRequest, AgentRuntimeEvent } from "@rakazo/adapter-kit";
import { describe, expect, it, vi } from "vitest";
import { verifyModelServesAgents } from "./model-connect-check.js";
import { PiAgentRuntime } from "./pi-runtime.js";
import { restoreTurnCheckpoint } from "./turn-checkpoint.js";

const apiKey = "fake-meta-fixture-key";
const reasoning = {
  type: "reasoning",
  id: "rs_fixture",
  summary: [],
  encrypted_content: "opaque-fixture-reasoning",
  status: "completed",
};
const commentary = {
  type: "message",
  id: "msg_commentary",
  role: "assistant",
  phase: "commentary",
  status: "completed",
  content: [{ type: "output_text", text: "Checking the fixture.", annotations: [] }],
};
const toolCall = {
  type: "function_call",
  id: "fc_fixture",
  call_id: "call_fixture",
  name: "read_fixture",
  arguments: '{"value":"fixture"}',
  status: "completed",
};

function responseStream(output: Array<Record<string, unknown>>): Response {
  const events: unknown[] = [
    { type: "response.created", response: { id: "resp_fixture", status: "in_progress" } },
  ];
  for (const [index, item] of output.entries()) {
    events.push({
      type: "response.output_item.added",
      output_index: index,
      item: {
        ...item,
        status: "in_progress",
        ...(item.type === "function_call" ? { arguments: "" } : {}),
      },
    });
    if (item.type === "function_call") {
      events.push({
        type: "response.function_call_arguments.delta",
        output_index: index,
        delta: item.arguments,
      });
    }
    if (item.type === "message") {
      const content = item.content as Array<{ text: string }>;
      events.push({
        type: "response.output_text.delta",
        output_index: index,
        content_index: 0,
        delta: content[0]?.text,
      });
    }
    events.push({ type: "response.output_item.done", output_index: index, item });
  }
  events.push({
    type: "response.completed",
    response: {
      id: "resp_fixture",
      status: "completed",
      output,
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
    },
  });
  return new Response(
    `${events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")}data: [DONE]\n\n`,
    { headers: { "content-type": "text/event-stream" } },
  );
}

describe("native Meta protocol conformance", () => {
  it.each(["muse-spark-1.3", "muse-wonder-1.0"])(
    "streams %s through a tool loop with encrypted reasoning and commentary replay",
    async (id) => {
      const requests: Array<{
        url: string;
        body: Record<string, unknown>;
        authorization: string | null;
      }> = [];
      const modelFetch = vi.fn<typeof fetch>(async (input, init) => {
        requests.push({
          url: input instanceof Request ? input.url : String(input),
          body: JSON.parse(String(init?.body)),
          authorization: new Headers(init?.headers).get("authorization"),
        });
        return responseStream(
          requests.length === 1
            ? [reasoning, commentary, toolCall]
            : [
                {
                  type: "message",
                  id: "msg_final",
                  role: "assistant",
                  status: "completed",
                  content: [{ type: "output_text", text: "Fixture verified.", annotations: [] }],
                },
              ],
        );
      });
      const executeTool = vi.fn(async () => ({ evidence: "fixture-result" }));
      const checkpoints: string[] = [];
      const request: AgentRunRequest = {
        botId: "fixture-bot",
        threadId: "fixture-thread",
        runId: "fixture-run",
        prompt: "Read the fixture and report the result.",
        instructions: "Use read_fixture once before replying.",
        history: [],
        model: { provider: "meta", id, apiKey, thinkingLevel: "high" },
        tools: [
          {
            name: "read_fixture",
            description: "Read fixture evidence.",
            inputSchema: {
              type: "object",
              properties: { value: { type: "string" } },
              required: ["value"],
            },
            readOnly: true,
          },
        ],
        executeTool,
        onCheckpoint: async (capture) => {
          checkpoints.push(capture());
        },
      };
      const events: AgentRuntimeEvent[] = [];
      for await (const event of new PiAgentRuntime({ modelFetch }).run(request, {
        signal: AbortSignal.timeout(20_000),
      }))
        events.push(event);

      expect(events.at(-1)).toMatchObject({
        type: "done",
        text: expect.stringContaining("Fixture verified."),
      });
      expect(executeTool).toHaveBeenCalledOnce();
      expect(executeTool).toHaveBeenCalledWith(
        "read_fixture",
        { value: "fixture" },
        expect.any(String),
        undefined,
        expect.objectContaining({ onShellStillRunning: expect.any(Function) }),
      );
      expect(requests).toHaveLength(2);
      for (const sent of requests) {
        expect(sent.url).toBe("https://api.meta.ai/v1/responses");
        expect(sent.authorization).toBe(`Bearer ${apiKey}`);
        expect(JSON.stringify(sent.body)).not.toContain(apiKey);
        expect(sent.body).toMatchObject({
          model: id,
          stream: true,
          store: false,
          include: ["reasoning.encrypted_content"],
          reasoning: { effort: "high" },
          tools: [expect.objectContaining({ name: "read_fixture", type: "function" })],
        });
      }
      const replay = requests[1]!.body.input as Array<Record<string, unknown>>;
      expect(replay).toEqual(
        expect.arrayContaining([
          reasoning,
          expect.objectContaining({
            type: "message",
            phase: "commentary",
            content: commentary.content,
          }),
          expect.objectContaining({
            type: "function_call",
            call_id: "call_fixture",
            arguments: toolCall.arguments,
          }),
          expect.objectContaining({
            type: "function_call_output",
            call_id: "call_fixture",
            output: expect.stringContaining("fixture-result"),
          }),
        ]),
      );
      const reasoningIndex = replay.findIndex((item) => item.type === "reasoning");
      expect(replay.slice(reasoningIndex, reasoningIndex + 4)).toMatchObject([
        { type: "reasoning", encrypted_content: reasoning.encrypted_content },
        { type: "message", phase: "commentary" },
        { type: "function_call", call_id: "call_fixture" },
        { type: "function_call_output", call_id: "call_fixture" },
      ]);
      expect(JSON.stringify(events)).not.toContain(reasoning.encrypted_content);
      expect(JSON.stringify(events)).not.toContain(apiKey);
      expect(checkpoints).toHaveLength(1);
      const restored = restoreTurnCheckpoint(checkpoints[0]!, { provider: "meta", id });
      const assistant = restored.messages.find((message) => message.role === "assistant");
      expect(assistant).toMatchObject({
        provider: "meta",
        model: id,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "thinking",
            thinkingSignature: JSON.stringify(reasoning),
          }),
          expect.objectContaining({
            type: "text",
            textSignature: JSON.stringify({ v: 1, id: "msg_commentary", phase: "commentary" }),
          }),
        ]),
      });
    },
  );

  it.each(["muse-spark-1.3", "muse-wonder-1.0"])(
    "checks %s with an actual Responses request before connecting",
    async (id) => {
      const modelFetch = vi.fn<typeof fetch>(async () => responseStream([]));
      await expect(
        verifyModelServesAgents(
          { provider: "meta", id, apiKey },
          { fetch: modelFetch, requireAcceptance: true },
        ),
      ).resolves.toBeUndefined();
      expect(modelFetch).toHaveBeenCalledOnce();
      expect(String(modelFetch.mock.calls[0]?.[0])).toBe("https://api.meta.ai/v1/responses");
      expect(JSON.parse(String(modelFetch.mock.calls[0]?.[1]?.body))).toMatchObject({
        model: id,
        max_output_tokens: 1024,
        tools: [expect.objectContaining({ type: "function", name: "noop" })],
      });
    },
  );

  it.each([401, 403])("sanitizes a rejected Meta credential (%i)", async (status) => {
    const modelFetch = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            message: `Invalid API key ${apiKey}`,
            code: "invalid_api_key",
          },
        },
        { status },
      ),
    );
    const result = verifyModelServesAgents(
      { provider: "meta", id: "muse-spark-1.3", apiKey },
      { fetch: modelFetch },
    );
    await expect(result).rejects.toThrow(/key|access/i);
    await expect(result).rejects.not.toThrow(apiKey);
  });
});
