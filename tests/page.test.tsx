import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";
import { cleanup, create, viewCount } from "./helpers";

let nowHeader: string | undefined;
vi.mock("next/headers", () => ({
  headers: async () => new Headers(nowHeader ? { "x-test-now-ms": nowHeader } : {}),
}));

import PastePage from "@/app/p/[id]/page";

afterAll(cleanup);

const render = async (id: string) =>
  renderToStaticMarkup(await PastePage({ params: Promise.resolve({ id }) }));

describe("GET /p/:id", () => {
  it("renders the paste content as HTML", async () => {
    const { data } = await create({ content: "hello page" });
    expect(await render(data.id)).toContain("hello page");
  });

  it("escapes HTML so scripts cannot execute", async () => {
    const payload = `<script>alert(1)</script><img src=x onerror=alert(2)>`;
    const { data } = await create({ content: payload });
    const html = await render(data.id);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("signals 404 (notFound) for missing, expired and exhausted pastes", async () => {
    await expect(render("nope1234567")).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });

    const once = await create({ content: "x", max_views: 1 });
    await render(once.data.id);
    await expect(render(once.data.id)).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
    expect(await viewCount(once.data.id)).toBe(1);

    const t0 = 1_800_000_000_000;
    nowHeader = String(t0);
    const ttl = await create({ content: "x", ttl_seconds: 30 }, { "x-test-now-ms": String(t0) });
    nowHeader = String(t0 + 30_000);
    await expect(render(ttl.data.id)).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
    nowHeader = undefined;
  });
});
