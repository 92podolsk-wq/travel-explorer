import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma-client";

const SESSION_COOKIE_NAME = "te_user_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createSessionToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt }
  });

  return token;
}

export async function createUserSession(userId: string) {
  const token = await createSessionToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000
  });

  return { token };
}

// Mints an additional session token for native clients (returned in a JSON body,
// not a cookie) so the local app-shell origin can authenticate cross-origin.
export async function createDeviceToken(userId: string) {
  return createSessionToken(userId);
}

export async function revokeSessionToken(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

async function findValidSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (bearerToken) {
    const session = await findValidSession(bearerToken);
    if (!session) {
      return null;
    }
    if (session.user.isBlocked) {
      await prisma.session.deleteMany({ where: { userId: session.user.id } });
      return null;
    }
    return session.user;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await findValidSession(token);

  if (!session) {
    return null;
  }

  if (session.user.isBlocked) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}
