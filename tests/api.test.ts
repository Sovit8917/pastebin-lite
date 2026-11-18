import { afterAll, describe, expect, it } from "vitest";
import { GET as healthz } from "@/app/api/healthz/route";
import { cleanup, create, fetchPaste, viewCount } from "./helpers";

afterAll(cleanup);

const T0 = 1_800_000_000_000;
const at = (ms: number) => ({ "x-test-now-ms": String(ms) });

describe("GET /api/healthz", () => {
  it("returns 200 JSON when the database is reachable", async () => {
    const res = await healthz();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /api/pastes", () => {
  it("creates a paste and returns id + /p/:id url", async () => {
    const { res, data } = await create({ content: "hello" });
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(typeof data.id).toBe("string");
    expect(data.url).toBe(`https://pastes.example.test/p/${data.id}`);
  });

  it("generates unique ids", async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10; i++) ids.add((await create({ content: "x" })).data.id);
    expect(ids.size).toBe(10);
  });

  it.each([
    ["missing content", {}],
    ["empty content", { content: "" }],
    ["non-string content", { content: 123 }],
    ["zero ttl", { content: "x", ttl_seconds: 0 }],
    ["fractional ttl", { content: "x", ttl_seconds: 1.5 }],
    ["string ttl", { content: "x", ttl_seconds: "60" }],
    ["zero max_views", { content: "x", max_views: 0 }],
    ["negative max_views", { content: "x", max_views: -1 }],
  ])("rejects %s with 4xx JSON", async (_name, body) => {
    const { res, data } = await create(body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(typeof data.error).toBe("string");
  });

  it("rejects malformed JSON with 400", async () => {
    const { res, data } = await create("{not json");
    expect(res.status).toBe(400);
    expect(data.error).toBeTruthy();
  });
});

describe("GET /api/pastes/:id", () => {
  it("returns original content; unlimited constraints are null", async () => {
    const content = "line1\n<b>bold</b>\n  ünïcode ✓";
    const { data } = await create({ content });
    for (let i = 0; i < 3; i++) {
      const r = await fetchPaste(data.id);
      expect(r.res.status).toBe(200);
      expect(r.res.headers.get("content-type")).toContain("application/json");
      expect(r.data).toEqual({ content, remaining_views: null, expires_at: null });
    }
  });

  it("returns 404 JSON for unknown and malformed ids", async () => {
    for (const id of ["doesnotexist1", "../etc/passwd", "a".repeat(200)]) {
      const r = await fetchPaste(id);
      expect(r.res.status).toBe(404);
      expect(r.res.headers.get("content-type")).toContain("application/json");
      expect(r.data.error).toBeTruthy();
    }
  });
});

describe("view limits", () => {
  it("max_views=1: first fetch 200, second 404", async () => {
    const { data } = await create({ content: "once", max_views: 1 });
    const a = await fetchPaste(data.id);
    expect(a.res.status).toBe(200);
    expect(a.data.remaining_views).toBe(0);
    expect((await fetchPaste(data.id)).res.status).toBe(404);
  });

  it("max_views=2: two fetches succeed, third 404, counts never exceed limit", async () => {
    const { data } = await create({ content: "twice", max_views: 2 });
    expect((await fetchPaste(data.id)).data.remaining_views).toBe(1);
    expect((await fetchPaste(data.id)).data.remaining_views).toBe(0);
    expect((await fetchPaste(data.id)).res.status).toBe(404);
    expect((await fetchPaste(data.id)).res.status).toBe(404);
    expect(await viewCount(data.id)).toBe(2);
  });
});

describe("TTL (TEST_MODE x-test-now-ms)", () => {
  it("is available before expiry and 404 at/after expiry", async () => {
    const { data } = await create({ content: "ttl", ttl_seconds: 60 }, at(T0));

    const before = await fetchPaste(data.id, at(T0 + 59_999));
    expect(before.res.status).toBe(200);
    expect(before.data.expires_at).toBe(new Date(T0 + 60_000).toISOString());

    expect((await fetchPaste(data.id, at(T0 + 60_000))).res.status).toBe(404);
    expect((await fetchPaste(data.id, at(T0 + 120_000))).res.status).toBe(404);
  });

  it("ignores the header when TEST_MODE is not 1", async () => {
    const { data } = await create({ content: "real clock", ttl_seconds: 3600 });
    const prev = process.env.TEST_MODE;
    process.env.TEST_MODE = "0";
    try {
      expect((await fetchPaste(data.id, at(T0 * 10))).res.status).toBe(200);
    } finally {
      process.env.TEST_MODE = prev;
    }
  });

  it("an expired fetch does not consume a view", async () => {
    const { data } = await create({ content: "x", ttl_seconds: 10, max_views: 3 }, at(T0));
    expect((await fetchPaste(data.id, at(T0 + 20_000))).res.status).toBe(404);
    expect(await viewCount(data.id)).toBe(0);
  });
});

describe("combined constraints", () => {
  it("view limit triggers first", async () => {
    const { data } = await create({ content: "x", ttl_seconds: 600, max_views: 1 }, at(T0));
    expect((await fetchPaste(data.id, at(T0 + 1000))).res.status).toBe(200);
    expect((await fetchPaste(data.id, at(T0 + 2000))).res.status).toBe(404);
  });

  it("TTL triggers first", async () => {
    const { data } = await create({ content: "x", ttl_seconds: 5, max_views: 10 }, at(T0));
    expect((await fetchPaste(data.id, at(T0 + 1000))).res.status).toBe(200);
    expect((await fetchPaste(data.id, at(T0 + 5000))).res.status).toBe(404);
    expect(await viewCount(data.id)).toBe(1);
  });
});

describe("concurrency", () => {
  it("never serves more than max_views under concurrent load", async () => {
    const { data } = await create({ content: "race", max_views: 5 });
    const results = await Promise.all(Array.from({ length: 30 }, () => fetchPaste(data.id)));
    const ok = results.filter((r) => r.res.status === 200);
    const gone = results.filter((r) => r.res.status === 404);

    expect(ok).toHaveLength(5);
    expect(gone).toHaveLength(25);
    expect(ok.map((r) => r.data.remaining_views).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(await viewCount(data.id)).toBe(5);
  });

  it("counts every concurrent view exactly once when unlimited", async () => {
    const { data } = await create({ content: "count" });
    await Promise.all(Array.from({ length: 20 }, () => fetchPaste(data.id)));
    expect(await viewCount(data.id)).toBe(20);
  });
});
