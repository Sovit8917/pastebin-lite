import type { NextRequest } from "next/server";
import { errorJson, json } from "@/lib/http";
import { consumePaste } from "@/lib/pastes";
import { getNow } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const paste = await consumePaste(id, getNow(req.headers));
    if (!paste) return errorJson(404, "Paste not found, expired, or view limit reached.");
    return json({
      content: paste.content,
      remaining_views: paste.remainingViews,
      expires_at: paste.expiresAt ? paste.expiresAt.toISOString() : null,
    });
  } catch (err) {
    console.error("GET /api/pastes/:id failed", err);
    return errorJson(500, "Could not load the paste. Please try again.");
  }
}
