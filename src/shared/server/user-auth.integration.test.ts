import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import { createDeviceToken, hashPassword, revokeSessionToken, verifyPassword } from "./user-auth";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password to something other than the plaintext and verifies it back", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password against a valid hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts each hash differently even for the same password", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});

describe("createDeviceToken / revokeSessionToken", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "user-auth-test@example.com", username: "user_auth_test", passwordHash: "test-hash" }
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.session.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("creates a session row tied to the user and returns a raw token string", async () => {
    const token = await createDeviceToken(userId);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const sessions = await prisma.session.findMany({ where: { userId } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe(token);
  });

  it("issues a fresh token on every call", async () => {
    const first = await createDeviceToken(userId);
    const second = await createDeviceToken(userId);
    expect(first).not.toBe(second);
  });

  it("revokes the matching session so the token no longer resolves to one", async () => {
    const token = await createDeviceToken(userId);
    await revokeSessionToken(token);
    const sessions = await prisma.session.findMany({ where: { userId } });
    expect(sessions).toHaveLength(0);
  });

  it("does nothing when revoking a token that was never issued", async () => {
    await expect(revokeSessionToken("not-a-real-token")).resolves.toBeUndefined();
  });
});
