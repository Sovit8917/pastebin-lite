import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

export async function GET() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("database timeout")), DB_TIMEOUT_MS);
      }),
    ]);
    return json({ ok: true });
  } catch (err) {
    console.error("healthz: database check failed", err);
    return json({ ok: false }, 503);
  } finally {
    clearTimeout(timer);
  }
}
