import type { AdminUser, User } from "@/entities/user/model/types";
import { prisma } from "./prisma-client";

type UserRow = Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarId: row.avatarId,
    createdAt: row.createdAt.toISOString()
  };
}

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarId: row.avatarId,
    isBlocked: row.isBlocked,
    createdAt: row.createdAt.toISOString()
  };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : null;
}

export async function createUser(email: string, passwordHash: string, name: string | null): Promise<User> {
  const row = await prisma.user.create({ data: { email, passwordHash, name } });
  return toUser(row);
}

export async function updateUserAvatar(userId: string, avatarId: string): Promise<User> {
  const row = await prisma.user.update({ where: { id: userId }, data: { avatarId } });
  return toUser(row);
}

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toAdminUser);
}

export async function setUserBlocked(userId: string, isBlocked: boolean): Promise<AdminUser | null> {
  const row = await prisma.user.update({ where: { id: userId }, data: { isBlocked } }).catch(() => null);
  if (!row) {
    return null;
  }

  if (isBlocked) {
    await prisma.session.deleteMany({ where: { userId } });
  }

  return toAdminUser(row);
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  return result !== null;
}
