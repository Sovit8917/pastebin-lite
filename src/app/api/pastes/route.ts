import type { NextRequest } from "next/server";
import { errorJson, getBaseUrl, json } from "@/lib/http";
import { createPaste } from "@/lib/pastes";
import { getNow } from "@/lib/time";
import { parseCreatePaste } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson(400, "Request body must be valid JSON.");
  }

  const parsed = parseCreatePaste(body);
  if (!parsed.ok) return errorJson(parsed.status, parsed.error, parsed.field);

  try {
    const { id } = await createPaste(parsed.value, getNow(req.headers));
    return json({ id, url: `${getBaseUrl(req)}/p/${id}` }, 201);
  } catch (err) {
    console.error("POST /api/pastes failed", err);
    return errorJson(500, "Could not create the paste. Please try again.");
  }
}
