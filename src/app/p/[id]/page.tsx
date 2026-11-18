import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import { consumePaste } from "@/lib/pastes";
import { getNow } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paste · Pastebin Lite",
  robots: { index: false, follow: false },
};

function formatUtc(date: Date): string {
  return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

export default async function PastePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paste = await consumePaste(id, getNow(await headers()));
  if (!paste) notFound();

  const lineCount = paste.content.split("\n").length;
  const gutterText = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  const views =
    paste.remainingViews === null
      ? "Unlimited views"
      : paste.remainingViews === 0
        ? "Last view. This link no longer works after this."
        : `${paste.remainingViews} ${paste.remainingViews === 1 ? "view" : "views"} left`;
  const expiry = paste.expiresAt ? `Expires ${formatUtc(paste.expiresAt)}` : "No expiry";

  return (
    <article>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 font-medium text-ink shadow-card">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            {views}
          </span>
          <span className="inline-flex items-center rounded-full border border-line-strong bg-panel px-2.5 py-1 text-muted shadow-card">
            {expiry}
          </span>
        </div>
        <CopyButton text={paste.content} label="Copy text" />
      </div>
      {/* React escapes text children, so content is never interpreted as HTML. */}
      <div className="card animate-pop overflow-auto font-mono text-[13px] leading-6">
        <div className="flex min-w-max">
          <pre
            aria-hidden
            className="sticky left-0 select-none border-r border-line bg-gutter px-3 py-3 text-right text-subtle"
          >
            {gutterText}
          </pre>
          <pre className="flex-1 px-4 py-3" data-testid="paste-content">
            {paste.content}
          </pre>
        </div>
      </div>
    </article>
  );
}
