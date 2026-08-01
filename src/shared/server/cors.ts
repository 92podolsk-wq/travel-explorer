import { NextResponse } from "next/server";

// The local app-shell (bundled inside the Capacitor Android app) is served from
// this origin and needs to call authenticated API routes cross-origin via a
// bearer token (see user-auth.ts) instead of the httpOnly session cookie.
const ALLOWED_ORIGINS = ["https://localhost"];

function resolveAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  return origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

export function withCors<T>(response: NextResponse<T>, request: Request): NextResponse<T> {
  const origin = resolveAllowedOrigin(request);
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function corsPreflight(request: Request): NextResponse {
  const origin = resolveAllowedOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return new NextResponse(null, { status: 204, headers });
}
