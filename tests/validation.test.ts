import { describe, expect, it } from "vitest";
import { parseCreatePaste } from "@/lib/validation";

describe("parseCreatePaste", () => {
  it("accepts content only", () => {
    expect(parseCreatePaste({ content: "hi" })).toEqual({ ok: true, value: { content: "hi" } });
  });

  it("accepts all fields", () => {
    expect(parseCreatePaste({ content: "x", ttl_seconds: 60, max_views: 5 })).toEqual({
      ok: true,
      value: { content: "x", ttlSeconds: 60, maxViews: 5 },
    });
  });

  it.each([
    [null],
    [[]],
    ["text"],
    [{}],
    [{ content: "" }],
    [{ content: "   " }],
    [{ content: 42 }],
    [{ content: "x", ttl_seconds: 0 }],
    [{ content: "x", ttl_seconds: -5 }],
    [{ content: "x", ttl_seconds: 1.5 }],
    [{ content: "x", ttl_seconds: "60" }],
    [{ content: "x", ttl_seconds: null }],
    [{ content: "x", max_views: 0 }],
    [{ content: "x", max_views: 2.2 }],
    [{ content: "x", max_views: "3" }],
    [{ content: "x", max_views: 1e12 }],
  ])("rejects %j", (body) => {
    const r = parseCreatePaste(body);
    expect(r.ok).toBe(false);
  });

  it("rejects oversized content with 413", () => {
    const r = parseCreatePaste({ content: "a".repeat(600 * 1024) });
    expect(r).toMatchObject({ ok: false, status: 413 });
  });
});
