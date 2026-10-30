import { describe, expect, it, vi } from "vitest";
import { bootstrapUserSpace } from "./bootstrap-user.js";
import type { PrismaClient } from "./client.js";

function makePrisma(settings: { id: string; ownerUserId: string | null } | null) {
  const create = () => vi.fn(async (_input: { data: Record<string, unknown> }) => ({}));
  const prisma = {
    organization: {
      create: create(),
      findUniqueOrThrow: vi.fn(async () => {
        throw new Error("not found");
      }),
    },
    member: { create: create() },
    space: { create: create() },
    spaceMember: { create: create() },
    deploymentSettings: {
      findUnique: vi.fn(async () => settings),
      create: create(),
      update: create(),
      upsert: vi.fn(
        async (_input: { create: Record<string, unknown>; update: Record<string, unknown> }) =>
          settings ?? { id: "default" },
      ),
      updateMany: vi.fn(async () => ({ count: settings && !settings.ownerUserId ? 1 : 0 })),
    },
    memoryDocument: { findFirst: vi.fn(async () => null), create: create() },
    notificationPreference: { create: create() },
  };
  return prisma;
}

const env = { signupsEnabled: "false", signupAllowlist: "a@example.com, b@example.com" };

describe("bootstrapUserSpace", () => {
  it("creates a personal organization with a default workspace", async () => {
    const prisma = makePrisma({ id: "default", ownerUserId: "user-1" });
    const result = await bootstrapUserSpace(
      prisma as unknown as PrismaClient,
      { id: "user-1" },
      env,
    );

    expect(prisma.organization.create).toHaveBeenCalledTimes(1);
    const orgData = prisma.organization.create.mock.calls[0]![0].data;
    expect(orgData.name).toBe("Personal");
    expect(orgData.slug).toEqual(expect.stringMatching(/^user-/));
    expect(result.spaceId).toBe(orgData.id);

    const memberData = prisma.member.create.mock.calls[0]![0].data;
    expect(memberData.organizationId).toBe(orgData.id);
    expect(memberData.userId).toBe("user-1");
    expect(memberData.role).toBe("owner");

    const spaceData = prisma.space.create.mock.calls[0]![0].data;
    expect(spaceData).toEqual(
      expect.objectContaining({
        id: orgData.id,
        organizationId: orgData.id,
        name: "Personal",
      }),
    );
    const spaceMemberData = prisma.spaceMember.create.mock.calls[0]![0].data;
    expect(spaceMemberData).toEqual(
      expect.objectContaining({
        spaceId: orgData.id,
        organizationId: orgData.id,
        userId: "user-1",
      }),
    );
  });

  it("seeds deployment settings from the env policy when none exist", async () => {
    const prisma = makePrisma(null);
    await bootstrapUserSpace(prisma as unknown as PrismaClient, { id: "user-1" }, env);

    const { create, update } = prisma.deploymentSettings.upsert.mock.calls[0]![0];
    expect(create.id).toBe("default");
    expect(create.ownerUserId).toBeNull();
    expect(create.signupsEnabled).toBe(false);
    expect(create.signupAllowlist).toBe("a@example.com,b@example.com");
    expect(create.signupPolicyInitialized).toBe(true);
    expect(update).toEqual({});
  });

  it("keeps users with the same ID prefix in separate private organizations", async () => {
    const first = makePrisma(null);
    const second = makePrisma(null);
    const firstUser = "shared-prefix-first-user";
    const secondUser = "shared-prefix-second-user";
    expect(firstUser.slice(0, 12)).toBe(secondUser.slice(0, 12));

    const firstSpace = await bootstrapUserSpace(
      first as unknown as PrismaClient,
      { id: firstUser },
      env,
    );
    const secondSpace = await bootstrapUserSpace(
      second as unknown as PrismaClient,
      { id: secondUser },
      env,
    );

    expect(first.organization.create.mock.calls[0]![0].data.slug).not.toBe(
      second.organization.create.mock.calls[0]![0].data.slug,
    );
    expect(firstSpace.spaceId).not.toBe(secondSpace.spaceId);
    expect(first.member.create.mock.calls[0]![0].data.userId).toBe(firstUser);
    expect(second.member.create.mock.calls[0]![0].data.userId).toBe(secondUser);
  });

  it.each([null, "user-0"])(
    "never claims admin rights, even with stored owner %s",
    async (ownerUserId) => {
      const prisma = makePrisma({ id: "default", ownerUserId });
      await bootstrapUserSpace(prisma as unknown as PrismaClient, { id: "user-1" }, env);
      expect(prisma.deploymentSettings.upsert.mock.calls[0]![0].update).toEqual({});
      expect(prisma.deploymentSettings.updateMany).not.toHaveBeenCalled();
    },
  );

  it("creates the user memory document and notification preference in the new workspace", async () => {
    const prisma = makePrisma({ id: "default", ownerUserId: "user-1" });
    const { spaceId } = await bootstrapUserSpace(
      prisma as unknown as PrismaClient,
      { id: "user-1" },
      env,
    );

    const memoryData = prisma.memoryDocument.create.mock.calls[0]![0].data;
    expect(memoryData.spaceId).toBe(spaceId);
    expect(memoryData.userId).toBe("user-1");
    expect(memoryData.scope).toBe("user");
    expect(memoryData.path).toBe("MEMORY.md");

    const prefData = prisma.notificationPreference.create.mock.calls[0]![0].data;
    expect(prefData.spaceId).toBe(spaceId);
    expect(prefData.userId).toBe("user-1");
  });
});

describe("bootstrapUserSpace concurrency", () => {
  it("recovers when a concurrent bootstrap wins the org, member, and settings races", async () => {
    const uniqueViolation = async () => {
      throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    };
    const prisma = {
      organization: {
        create: vi.fn(uniqueViolation),
        findUniqueOrThrow: vi.fn(async () => ({
          id: "org-winner",
          members: [{ userId: "user-1" }],
        })),
      },
      member: { create: vi.fn(uniqueViolation) },
      space: { create: vi.fn(uniqueViolation) },
      spaceMember: { create: vi.fn(uniqueViolation) },
      deploymentSettings: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(uniqueViolation),
        upsert: vi.fn(async () => ({ id: "default" })),
        update: vi.fn(async () => ({})),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
      memoryDocument: {
        findFirst: vi.fn(async () => ({ id: "mem-1" })),
        create: vi.fn(async () => ({})),
      },
      notificationPreference: { create: vi.fn(uniqueViolation) },
    };
    const result = await bootstrapUserSpace(
      prisma as unknown as PrismaClient,
      { id: "user-1" },
      env,
    );

    expect(result.spaceId).toBe("org-winner");
  });

  it("refuses to join an existing organization owned by another user", async () => {
    const prisma = {
      ...makePrisma(null),
      organization: {
        create: vi.fn(async () => {
          throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        }),
        findUniqueOrThrow: vi.fn(async () => ({
          id: "other-organization",
          members: [{ userId: "other-user" }],
        })),
      },
    };

    await expect(
      bootstrapUserSpace(prisma as unknown as PrismaClient, { id: "user-1" }, env),
    ).rejects.toThrow("Personal organization belongs to another user");
    expect(prisma.member.create).not.toHaveBeenCalled();
    expect(prisma.space.create).not.toHaveBeenCalled();
    expect(prisma.spaceMember.create).not.toHaveBeenCalled();
  });
});
