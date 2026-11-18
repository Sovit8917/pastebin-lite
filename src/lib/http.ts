import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function errorJson(status: number, error: string, field?: string): NextResponse {
  return json(field ? { error, field } : { error }, status);
}

/** Public origin for share links: APP_URL, else forwarded headers, else the request URL. */
export function getBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const first = (v: string | null) => v?.split(",")[0]?.trim() || null;
  const url = new URL(req.url);
  const host = first(req.headers.get("x-forwarded-host")) ?? first(req.headers.get("host")) ?? url.host;
  const proto = first(req.headers.get("x-forwarded-proto")) ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
