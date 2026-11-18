import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const isValidId = (id: string) => ID_PATTERN.test(id);

export type ViewedPaste = {
  content: string;
  remainingViews: number | null;
  expiresAt: Date | null;
};

export async function createPaste(
  input: { content: string; ttlSeconds?: number; maxViews?: number },
  now: Date,
): Promise<{ id: string; expiresAt: Date | null }> {
  const expiresAt =
    input.ttlSeconds !== undefined ? new Date(now.getTime() + input.ttlSeconds * 1000) : null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomBytes(9).toString("base64url"); // 12 URL-safe chars
    try {
      await prisma.paste.create({
        data: {
          id,
          content: input.content,
          createdAt: now,
          expiresAt,
          maxViews: input.maxViews ?? null,
        },
      });
      return { id, expiresAt };
    } catch (err) {
      const isCollision =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isCollision) throw err;
    }
  }
  throw new Error("Could not allocate a unique paste id");
}

type Row = {
  content: string;
  max_views: number | null;
  view_count: number;
  expires_at: Date | null;
};

/**
 * Atomically records one view and returns the paste, or null when the paste
 * is missing, expired, or has no views left.
 *
 * A single conditional UPDATE ... RETURNING does the availability check and the
 * increment together, so concurrent requests can never push view_count past
 * max_views, and failed lookups never consume a view.
 */
export async function consumePaste(id: string, now: Date): Promise<ViewedPaste | null> {
  if (!isValidId(id)) return null;

  const rows = await prisma.$queryRaw<Row[]>`
    UPDATE "pastes"
    SET "view_count" = "view_count" + 1
    WHERE "id" = ${id}
      AND ("expires_at" IS NULL OR "expires_at" > ${now})
      AND ("max_views" IS NULL OR "view_count" < "max_views")
    RETURNING "content", "max_views", "view_count", "expires_at"`;

  const row = rows[0];
  if (!row) return null;

  return {
    content: row.content,
    remainingViews: row.max_views === null ? null : Math.max(0, row.max_views - row.view_count),
    expiresAt: row.expires_at,
  };
}
