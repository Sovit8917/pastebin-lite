export const MAX_CONTENT_BYTES = 512 * 1024;
export const MAX_TTL_SECONDS = 315_360_000; // 10 years
export const MAX_VIEWS_LIMIT = 2_147_483_647; // Postgres INTEGER max

export type ParsedCreate = {
  content: string;
  ttlSeconds?: number;
  maxViews?: number;
};

export type ParseResult =
  | { ok: true; value: ParsedCreate }
  | { ok: false; status: 400 | 413; error: string; field?: string };

const fail = (
  status: 400 | 413,
  error: string,
  field?: string,
): ParseResult => ({ ok: false, status, error, field });

const isPositiveInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1;

export function parseCreatePaste(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail(400, "Request body must be a JSON object.");
  }
  const { content, ttl_seconds, max_views } = body as Record<string, unknown>;

  if (typeof content !== "string" || content.trim().length === 0) {
    return fail(400, "content is required and must be a non-empty string.", "content");
  }
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    return fail(413, `content must not exceed ${MAX_CONTENT_BYTES / 1024} KB.`, "content");
  }

  const value: ParsedCreate = { content };

  if (ttl_seconds !== undefined) {
    if (!isPositiveInt(ttl_seconds) || ttl_seconds > MAX_TTL_SECONDS) {
      return fail(
        400,
        `ttl_seconds must be an integer between 1 and ${MAX_TTL_SECONDS}.`,
        "ttl_seconds",
      );
    }
    value.ttlSeconds = ttl_seconds;
  }

  if (max_views !== undefined) {
    if (!isPositiveInt(max_views) || max_views > MAX_VIEWS_LIMIT) {
      return fail(
        400,
        `max_views must be an integer between 1 and ${MAX_VIEWS_LIMIT}.`,
        "max_views",
      );
    }
    value.maxViews = max_views;
  }

  return { ok: true, value };
}
