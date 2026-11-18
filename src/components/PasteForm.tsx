"use client";

import { useRef, useState, type FormEvent } from "react";
import CopyButton from "./CopyButton";

const UNITS = { seconds: 1, minutes: 60, hours: 3600, days: 86400 } as const;
type Unit = keyof typeof UNITS;

const TTL_PRESETS: { label: string; value: string; unit: Unit }[] = [
  { label: "10 min", value: "10", unit: "minutes" },
  { label: "1 hour", value: "1", unit: "hours" },
  { label: "1 day", value: "1", unit: "days" },
  { label: "7 days", value: "7", unit: "days" },
];
const VIEW_PRESETS = ["1", "5", "10", "100"];

function Label({ htmlFor, children, hint }: { htmlFor: string; children: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between text-[13px] font-medium">
      {children}
      {hint && <span className="font-normal text-subtle">{hint}</span>}
    </label>
  );
}

export default function PasteForm() {
  const [content, setContent] = useState("");
  const [ttlValue, setTtlValue] = useState("");
  const [ttlUnit, setTtlUnit] = useState<Unit>("minutes");
  const [maxViews, setMaxViews] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = Math.max(content.split("\n").length, 14);
  const gutterText = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
  const realLines = content === "" ? 0 : content.split("\n").length;

  const unitLabel = ttlValue.trim() === "1" ? ttlUnit.slice(0, -1) : ttlUnit;
  const ttlActive = ttlValue.trim() !== "";
  const viewsActive = maxViews.trim() !== "";
  const summary =
    ttlActive && viewsActive
      ? `Expires after ${ttlValue} ${unitLabel} or ${maxViews} ${maxViews === "1" ? "view" : "views"}, whichever comes first.`
      : ttlActive
        ? `Expires after ${ttlValue} ${unitLabel}. Unlimited views until then.`
        : viewsActive
          ? `Expires after ${maxViews} ${maxViews === "1" ? "view" : "views"}. No time limit.`
          : "Stays available with no expiry and no view limit.";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (content.trim() === "") return setError("Paste content can't be empty.");

    const payload: Record<string, unknown> = { content };

    if (ttlValue.trim() !== "") {
      const n = Number(ttlValue);
      if (!Number.isInteger(n) || n < 1) {
        return setError("Expiry must be a whole number of 1 or more.");
      }
      payload.ttl_seconds = n * UNITS[ttlUnit];
    }
    if (maxViews.trim() !== "") {
      const n = Number(maxViews);
      if (!Number.isInteger(n) || n < 1) {
        return setError("View limit must be a whole number of 1 or more.");
      }
      payload.max_views = n;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(data?.error ?? "Couldn't create the paste. Try again.");
        return;
      }
      setResult({ id: data.id, url: data.url });
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setContent("");
    setTtlValue("");
    setMaxViews("");
    setError(null);
  }

  if (result) {
    return (
      <section className="card mx-auto max-w-2xl animate-pop p-6 sm:p-8" aria-live="polite">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m2.5 7.5 3 3 6-7" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Paste created</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Share this link. Opening it counts as a view, including your own visit.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={result.url}
            aria-label="Shareable link"
            onFocus={(e) => e.currentTarget.select()}
            className="field flex-1 bg-gutter font-mono text-[13px]"
          />
          <CopyButton text={result.url} label="Copy link" />
        </div>
        <div className="mt-6 flex gap-3 border-t border-line pt-6">
          <a href={`/p/${result.id}`} className="btn btn-md btn-primary">
            Open paste
          </a>
          <button onClick={reset} className="btn btn-md btn-secondary">
            New paste
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Editor */}
      <div>
        <Label htmlFor="content">Content</Label>
        <div className="card overflow-hidden transition-shadow duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(36,87,230,0.12)]">
          <div className="flex h-[22rem] bg-panel font-mono text-[13px] leading-6 sm:h-[26rem]">
            <div
              ref={gutterRef}
              aria-hidden
              className="select-none overflow-hidden whitespace-pre border-r border-line bg-gutter px-3 py-3 text-right text-subtle"
            >
              {gutterText}
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={(e) => {
                if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
              }}
              wrap="off"
              spellCheck={false}
              placeholder="Paste or type your text here"
              className="min-w-0 flex-1 resize-none overflow-auto bg-transparent px-4 py-3 text-ink outline-none placeholder:text-subtle"
            />
          </div>
          <div className="flex h-10 items-center justify-between border-t border-line bg-gutter px-3 text-xs text-muted">
            <span className="tabular-nums">
              {realLines} {realLines === 1 ? "line" : "lines"} · {content.length.toLocaleString()} characters
            </span>
            <button
              type="button"
              onClick={() => setContent("")}
              disabled={content === ""}
              className="btn btn-ghost h-7 rounded-md px-2 text-xs disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <aside className="card p-5 lg:mt-[26px]">
        <h2 className="text-sm font-semibold tracking-tight">Link settings</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Both are optional. The link stops working when the first limit is reached.
        </p>

        <div className="mt-5">
          <Label htmlFor="ttl" hint="Optional">Expires after</Label>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {TTL_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="chip"
                aria-pressed={ttlValue === p.value && ttlUnit === p.unit}
                onClick={() => {
                  setTtlValue(p.value);
                  setTtlUnit(p.unit);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="ttl"
              inputMode="numeric"
              value={ttlValue}
              onChange={(e) => setTtlValue(e.target.value)}
              placeholder="Never"
              className="field"
            />
            <select
              aria-label="Expiry unit"
              value={ttlUnit}
              onChange={(e) => setTtlUnit(e.target.value as Unit)}
              className="field w-auto cursor-pointer pr-8"
            >
              {Object.keys(UNITS).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <Label htmlFor="views" hint="Optional">View limit</Label>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {VIEW_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                className="chip"
                aria-pressed={maxViews === v}
                onClick={() => setMaxViews(v)}
              >
                {v} {v === "1" ? "view" : "views"}
              </button>
            ))}
          </div>
          <input
            id="views"
            inputMode="numeric"
            value={maxViews}
            onChange={(e) => setMaxViews(e.target.value)}
            placeholder="Unlimited"
            className="field"
          />
        </div>

        <p className="mt-5 rounded-lg bg-accent-soft px-3 py-2.5 text-[13px] leading-relaxed text-[#1b3a9e]">
          {summary}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 animate-pop rounded-lg border border-[#fecdca] bg-danger-soft px-3 py-2.5 text-[13px] leading-relaxed text-danger"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary mt-5 h-11 w-full text-[15px]">
          {busy && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {busy ? "Creating…" : "Create paste"}
        </button>
      </aside>
    </form>
  );
}
