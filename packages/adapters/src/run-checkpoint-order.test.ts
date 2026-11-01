import type * as DbModule from "@rakazo/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunContext } from "./run-context.js";
import { persistTurnCheckpoint } from "./run-context.js";

const checkpointDb = vi.hoisted(() => ({ save: vi.fn(), drop: vi.fn() }));
vi.mock("@rakazo/db", async (importOriginal) => ({
  ...(await importOriginal<typeof DbModule>()),
  saveRunTurnCheckpoint: checkpointDb.save,
  dropRunTurnCheckpoint: checkpointDb.drop,
}));

function context() {
  return {
    deps: { prisma: {} },
    run: { id: "run", spaceId: "space" },
    workerId: "worker",
    fence: 1,
    state: {
      effects: {
        occurrences: [],
        storedTurnCheckpoint: false,
        pendingTurnCheckpoints: new Map([
          ["first", () => JSON.stringify({ pendingToolCallId: "first" })],
          ["second", () => JSON.stringify({ pendingToolCallId: "second" })],
        ]),
      },
    },
  } as unknown as RunContext;
}

beforeEach(() => {
  checkpointDb.save.mockReset();
  checkpointDb.drop.mockReset();
});
describe("durable tool checkpoint ordering", () => {
  it("cannot let a delayed earlier save replace a later independent call", async () => {
    let release!: () => void;
    checkpointDb.save
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const ctx = context();
    const first = persistTurnCheckpoint(ctx, "first");
    const second = persistTurnCheckpoint(ctx, "second");
    await Promise.resolve();
    expect(checkpointDb.save).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
    expect(
      checkpointDb.save.mock.calls.map((args) => JSON.parse(args[4]).pendingToolCallId),
    ).toEqual(["first", "second"]);
  });
  it("fails closed after its lease-fenced save fails", async () => {
    checkpointDb.save.mockRejectedValueOnce(new Error("lease lost"));
    const ctx = context();
    await expect(persistTurnCheckpoint(ctx, "first")).rejects.toThrow("lease lost");
    await expect(persistTurnCheckpoint(ctx, "second")).rejects.toThrow("lease lost");
    expect(checkpointDb.save).toHaveBeenCalledTimes(1);
  });
});
