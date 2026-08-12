import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  setUserBlocked,
  setUserHiddenCategoryAccess,
  updateUserAvatar
} from "./users-repository";

const emailPrefix = "users-repo-test-";
let emailCounter = 0;
function nextEmail() {
  emailCounter += 1;
  return `${emailPrefix}${emailCounter}@example.com`;
}
function nextUsername() {
  return `usersrepotest_${emailCounter}`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createUser / findUserByEmail / findUserById", () => {
  it("creates a user and finds it back by email and id", async () => {
    const email = nextEmail();
    const created = await createUser(email, nextUsername(), "hash", "Alice");
    expect(created.email).toBe(email);
    expect(created.name).toBe("Alice");

    const byEmail = await findUserByEmail(email);
    expect(byEmail?.id).toBe(created.id);

    const byId = await findUserById(created.id);
    expect(byId?.id).toBe(created.id);
  });

  it("returns null for an email or id that does not exist", async () => {
    expect(await findUserByEmail("nobody@example.com")).toBeNull();
    expect(await findUserById("does-not-exist")).toBeNull();
  });
});

describe("updateUserAvatar", () => {
  it("sets the avatarId field", async () => {
    const user = await createUser(nextEmail(), nextUsername(), "hash", null);
    const updated = await updateUserAvatar(user.id, "avatar-3");
    expect(updated.avatarId).toBe("avatar-3");
  });
});

describe("listUsers", () => {
  it("includes newly created test users", async () => {
    const a = await createUser(nextEmail(), nextUsername(), "hash", null);
    const b = await createUser(nextEmail(), nextUsername(), "hash", null);
    const ids = (await listUsers()).map((u) => u.id);
    expect(ids).toEqual(expect.arrayContaining([a.id, b.id]));
  });
});

describe("setUserBlocked", () => {
  it("blocks a user and revokes all of their sessions", async () => {
    const user = await createUser(nextEmail(), nextUsername(), "hash", null);
    await prisma.session.create({
      data: { tokenHash: `session-${user.id}`, userId: user.id, expiresAt: new Date(Date.now() + 1_000_000) }
    });

    const updated = await setUserBlocked(user.id, true);
    expect(updated?.isBlocked).toBe(true);

    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(0);
  });

  it("unblocks a user without needing any sessions to exist", async () => {
    const user = await createUser(nextEmail(), nextUsername(), "hash", null);
    await setUserBlocked(user.id, true);
    const updated = await setUserBlocked(user.id, false);
    expect(updated?.isBlocked).toBe(false);
  });

  it("returns null for a user that does not exist", async () => {
    expect(await setUserBlocked("does-not-exist", true)).toBeNull();
  });
});

describe("setUserHiddenCategoryAccess", () => {
  it("toggles canAccessHiddenCategories on and off", async () => {
    const user = await createUser(nextEmail(), nextUsername(), "hash", null);
    expect((await setUserHiddenCategoryAccess(user.id, true))?.canAccessHiddenCategories).toBe(true);
    expect((await setUserHiddenCategoryAccess(user.id, false))?.canAccessHiddenCategories).toBe(false);
  });

  it("returns null for a user that does not exist", async () => {
    expect(await setUserHiddenCategoryAccess("does-not-exist", true)).toBeNull();
  });
});

describe("deleteUser", () => {
  it("deletes an existing user and reports success", async () => {
    const user = await createUser(nextEmail(), nextUsername(), "hash", null);
    expect(await deleteUser(user.id)).toBe(true);
    expect(await findUserById(user.id)).toBeNull();
  });

  it("returns false for a user that does not exist", async () => {
    expect(await deleteUser("does-not-exist")).toBe(false);
  });
});
