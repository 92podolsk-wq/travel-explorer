import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "te_admin_session";
const SESSION_VALUE = "authenticated";

function getAdminPassword() {
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      '[admin] ADMIN_PASSWORD is not set — using the default password "kyoto-admin". Set ADMIN_PASSWORD in .env.local before deploying anywhere public.'
    );
    return "kyoto-admin";
  }

  return process.env.ADMIN_PASSWORD;
}

export function checkAdminPassword(password: string) {
  return password === getAdminPassword();
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value === SESSION_VALUE;
}
