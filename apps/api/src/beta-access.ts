import { createHash, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@rakazo/db";
import { runAsSystem } from "@rakazo/db";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

type BetaStore = Pick<PrismaClient, "user">;

export async function hasBetaAccess(prisma: BetaStore, userId: string, code?: string) {
  if (!code) return true;
  const user = await runAsSystem("beta admission", () =>
    prisma.user.findUnique({ where: { id: userId }, select: { betaAdmittedAt: true } }),
  );
  return Boolean(user?.betaAdmittedAt);
}

/** Admission is attached to the account; the reusable invite stays on the server. */
export function betaAccessRoutes(options: {
  prisma: BetaStore;
  code?: string;
  authenticate: (request: Request) => Promise<string | undefined>;
}) {
  const app = new Hono();
  const attempts = new Map<string, { count: number; until: number }>();
  app.use("/api/beta/redeem", bodyLimit({ maxSize: 1024 }));
  app.get("/api/beta/status", async (c) => {
    c.header("Cache-Control", "no-store");
    const userId = await options.authenticate(c.req.raw);
    if (!userId) return c.json({ error: "Sign in first" }, 401);
    return c.json({ admitted: await hasBetaAccess(options.prisma, userId, options.code) });
  });
  app.post("/api/beta/redeem", async (c) => {
    c.header("Cache-Control", "no-store");
    const userId = await options.authenticate(c.req.raw);
    if (!userId) return c.json({ error: "Sign in first" }, 401);
    if (await hasBetaAccess(options.prisma, userId, options.code))
      return c.json({ admitted: true });
    const now = Date.now();
    for (const [id, attempt] of attempts) if (attempt.until <= now) attempts.delete(id);
    const attempt = attempts.get(userId) ?? { count: 0, until: now + 60_000 };
    if (attempt.count >= 8 || (!attempts.has(userId) && attempts.size >= 10_000)) {
      c.header("Retry-After", "60");
      return c.json({ error: "Try again in a minute" }, 429);
    }
    attempt.count++;
    attempts.set(userId, attempt);
    if (Number(c.req.header("content-length") ?? 0) > 1024)
      return c.json({ error: "Invalid invite code" }, 400);
    const body: unknown = await c.req.json().catch(() => null);
    const code = body && typeof body === "object" && "code" in body ? body.code : undefined;
    if (
      typeof code !== "string" ||
      code.length > 256 ||
      !timingSafeEqual(
        createHash("sha256").update(code.trim()).digest(),
        createHash("sha256").update(options.code!).digest(),
      )
    )
      return c.json({ error: "Invalid invite code" }, 400);
    await runAsSystem("beta admission", () =>
      options.prisma.user.update({ where: { id: userId }, data: { betaAdmittedAt: new Date() } }),
    );
    attempts.delete(userId);
    return c.json({ admitted: true });
  });
  return app;
}
