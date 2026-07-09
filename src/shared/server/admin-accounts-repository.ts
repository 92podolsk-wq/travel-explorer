import type { AdminAccount } from "@/entities/admin-account/model/types";
import { hashAdminPassword } from "./admin-auth";
import { prisma } from "./prisma-client";

type AdminRow = Awaited<ReturnType<typeof prisma.adminAccount.findFirstOrThrow>>;

function toAdminAccount(row: AdminRow): AdminAccount {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.createdAt.toISOString() };
}

export async function findAdminByEmail(email: string) {
  return prisma.adminAccount.findUnique({ where: { email: email.toLowerCase() } });
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const rows = await prisma.adminAccount.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toAdminAccount);
}

export type CreateAdminAccountResult =
  | { success: true; account: AdminAccount }
  | { success: false; reason: "duplicate-email" };

export async function createAdminAccount(name: string, email: string, password: string): Promise<CreateAdminAccountResult> {
  const passwordHash = await hashAdminPassword(password);

  try {
    const row = await prisma.adminAccount.create({ data: { name, email: email.toLowerCase(), passwordHash } });
    return { success: true, account: toAdminAccount(row) };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, reason: "duplicate-email" };
    }
    throw error;
  }
}

export type UpdateAdminAccountResult =
  | { success: true; account: AdminAccount }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "duplicate-email" };

export async function updateAdminAccount(
  id: string,
  patch: { name?: string; email?: string; password?: string }
): Promise<UpdateAdminAccountResult> {
  const existing = await prisma.adminAccount.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const data: { name?: string; email?: string; passwordHash?: string } = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.email !== undefined) data.email = patch.email.toLowerCase();
  if (patch.password) data.passwordHash = await hashAdminPassword(patch.password);

  try {
    const row = await prisma.adminAccount.update({ where: { id }, data });
    return { success: true, account: toAdminAccount(row) };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, reason: "duplicate-email" };
    }
    throw error;
  }
}

export type DeleteAdminAccountResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "last-admin" };

export async function deleteAdminAccount(id: string): Promise<DeleteAdminAccountResult> {
  const existing = await prisma.adminAccount.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const total = await prisma.adminAccount.count();
  if (total <= 1) {
    return { success: false, reason: "last-admin" };
  }

  await prisma.adminAccount.delete({ where: { id } });
  return { success: true };
}
