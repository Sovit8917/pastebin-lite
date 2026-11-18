import { NextRequest } from "next/server";
import { GET as getPaste } from "@/app/api/pastes/[id]/route";
import { POST as postPaste } from "@/app/api/pastes/route";
import { prisma } from "@/lib/prisma";

const ORIGIN = "https://pastes.example.test";
const created: string[] = [];

export async function create(body: unknown, headers: Record<string, string> = {}) {
  const res = await postPaste(
    new NextRequest(`${ORIGIN}/api/pastes`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  const data = await res.json();
  if (data?.id) created.push(data.id);
  return { res, data };
}

export async function fetchPaste(id: string, headers: Record<string, string> = {}) {
  const res = await getPaste(new NextRequest(`${ORIGIN}/api/pastes/${id}`, { headers }), {
    params: Promise.resolve({ id }),
  });
  return { res, data: await res.json() };
}

export const viewCount = async (id: string) =>
  (await prisma.paste.findUniqueOrThrow({ where: { id } })).viewCount;

export async function cleanup() {
  await prisma.paste.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
}
