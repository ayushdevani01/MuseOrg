import type { PrismaClient } from "@rakazo/db";
import { describe, expect, it, vi } from "vitest";
import { betaAccessRoutes, hasBetaAccess } from "./beta-access.js";

function fixture(code: string | undefined = "offline-invite") {
  const admissions = new Map<string, Date>();
  const findUnique = vi.fn(async ({ where }: { where: { id: string } }) => ({
    betaAdmittedAt: admissions.get(where.id) ?? null,
  }));
  const update = vi.fn(async ({ where }: { where: { id: string } }) => {
    admissions.set(where.id, new Date());
    return {};
  });
  const prisma = { user: { findUnique, update } } as unknown as PrismaClient;
  const app = betaAccessRoutes({
    prisma,
    code,
    authenticate: async (request) => request.headers.get("x-test-user") ?? undefined,
  });
  const status = (user = "user-a") =>
    app.request("/api/beta/status", { headers: { "x-test-user": user } });
  const redeem = (value: unknown, user = "user-a") =>
    app.request("/api/beta/redeem", {
      method: "POST",
      headers: { "x-test-user": user, "content-type": "application/json" },
      body: JSON.stringify({ code: value }),
    });
  return { app, status, redeem, admissions, update, prisma };
}

describe("beta admission", () => {
  it("requires a session and rejects incorrect codes without granting access", async () => {
    const f = fixture();
    expect((await f.app.request("/api/beta/status")).status).toBe(401);
    expect((await f.redeem("wrong", "")).status).toBe(401);
    expect(await (await f.status()).json()).toEqual({ admitted: false });
    expect((await f.redeem("wrong")).status).toBe(400);
    expect((await f.redeem({ injected: true })).status).toBe(400);
    expect(f.update).not.toHaveBeenCalled();
    expect(await hasBetaAccess(f.prisma, "user-a", "offline-invite")).toBe(false);
  });
  it("persists admission for exactly the authenticated account and never returns the code", async () => {
    const f = fixture();
    expect(await (await f.redeem(" offline-invite ")).json()).toEqual({ admitted: true });
    const result = await f.status();
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual({ admitted: true });
    expect(await (await f.status("user-b")).json()).toEqual({ admitted: false });
    expect(await hasBetaAccess(f.prisma, "user-a", "offline-invite")).toBe(true);
    expect((await f.redeem("wrong")).status).toBe(200);
    expect(f.update).toHaveBeenCalledTimes(1);
  });
  it("limits guesses per account and bounds request bodies", async () => {
    const f = fixture();
    for (let i = 0; i < 8; i++) expect((await f.redeem("wrong")).status).toBe(400);
    const blocked = await f.redeem("offline-invite");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect((await f.redeem("x".repeat(2048), "user-b")).status).toBe(413);
    expect((await f.redeem("offline-invite", "user-b")).status).toBe(200);
  });
  it("keeps ungated deployments working without an admission record", async () => {
    const f = fixture("");
    expect(await hasBetaAccess(f.prisma, "user-a")).toBe(true);
    expect(await (await f.status()).json()).toEqual({ admitted: true });
    expect(f.prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
