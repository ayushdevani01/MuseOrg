import { expect, it, vi } from "vitest";
import { builtinAgentTools } from "./builtin-tools.js";

const observed = vi.hoisted(() => ({
  agents: 0,
  resumedMessages: [] as Array<Record<string, unknown>>,
}));
vi.mock("@earendil-works/pi-agent-core", () => ({
  Agent: class {
    state: { errorMessage?: string; messages: Array<Record<string, unknown>> };
    constructor(options: { initialState: { messages?: Array<Record<string, unknown>> } }) {
      observed.agents++;
      this.state = { messages: [...(options.initialState.messages ?? [])] };
    }
    subscribe() {}
    async prompt() {
      throw new Error("A restored helper must not start a new agent");
    }
    async continue() {
      observed.resumedMessages = [...this.state.messages];
      this.state.messages.push({
        role: "assistant",
        content: [{ type: "text", text: "Recovery requires artifact verification." }],
      });
    }
    async waitForIdle() {}
    abort() {}
  },
}));
vi.mock("@earendil-works/pi-ai/providers/all", () => ({
  builtinModels: () => ({
    getModel: () => ({ provider: "test", id: "recovery-model", reasoning: false }),
    streamSimple: () => {
      throw new Error("No network in this test");
    },
  }),
}));
vi.mock("./pi-local-provider.js", () => ({ registerLocalProvider: (models: unknown) => models }));
vi.mock("./pi-openai-compatible-provider.js", () => ({
  OPENAI_COMPATIBLE_PROVIDER_ID: "openai-compatible",
  registerOpenAiCompatibleCatalog: (models: unknown) => models,
  registerOpenAiCompatibleRuntime: (models: unknown) => models,
}));

import { PiAgentRuntime } from "./pi-runtime.js";

it("marks a restored in-flight helper interrupted without starting it twice", async () => {
  const executeTool = vi.fn();
  const checkpoint = JSON.stringify({
    version: 1,
    provider: "test",
    model: "recovery-model",
    systemPrompt: "Fixture",
    pendingToolCallId: "helper-call",
    executionMode: "sequential",
    messages: [
      { role: "user", content: "Inspect fixture artifacts", timestamp: 0 },
      {
        role: "assistant",
        content: [
          {
            type: "toolCall",
            id: "helper-call",
            name: "run_subagent",
            arguments: { name: "scout", task: "inspect artifacts" },
          },
        ],
        api: "openai-completions",
        provider: "test",
        model: "recovery-model",
        stopReason: "toolUse",
        timestamp: 1,
      },
    ],
  });
  for await (const _ of new PiAgentRuntime().run(
    {
      botId: "bot",
      threadId: "thread",
      runId: "run",
      prompt: "Inspect fixture artifacts",
      instructions: "Fixture",
      history: [],
      model: { provider: "test", id: "recovery-model" },
      tools: builtinAgentTools.filter((tool) => tool.name === "run_subagent"),
      turnCheckpoint: checkpoint,
      executeTool,
    } as never,
    {
      operationId: "op",
      traceId: "trace",
      spaceId: "space",
      userId: "member",
      signal: new AbortController().signal,
    },
  )) {
    /* drain */
  }
  expect(observed.agents).toBe(1);
  expect(executeTool).not.toHaveBeenCalled();
  const result = observed.resumedMessages.find(
    (message) => message.role === "toolResult" && message.toolCallId === "helper-call",
  );
  expect(result?.isError).toBe(true);
  const content = result?.content as Array<{ text: string }>;
  expect(JSON.parse(content[0]!.text)).toMatchObject({ interrupted: true });
});
