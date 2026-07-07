import type { User } from "@/entities/user/model/types";
import { prisma } from "./prisma-client";

type UserRow = Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
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
