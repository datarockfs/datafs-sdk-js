import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { Datafs } from "../src/index.js";
import { pagePayload } from "../src/payload.js";

test("page payload strips the query and keeps campaign fields", () => {
  const body = pagePayload({
    domain: "example.com",
    url: "https://example.com/pricing?utm_source=hn&utm_medium=social&utm_campaign=launch&utm_content=drop&q=1#top",
    referrer: "https://news.ycombinator.com/item?id=1",
  });
  assert.equal(body.u, "https://example.com/pricing");
  assert.equal(body.r, "https://news.ycombinator.com/item");
  assert.equal(body.s, "hn");
  assert.equal(body.m, "social");
  assert.equal(body.c, "launch");
  assert.equal(body.tc, undefined);
  assert.equal("utm_content" in body, false);
});

test("custom events reject reserved names and emails", () => {
  const dfs = new Datafs({ domain: "example.com", endpoint: "http://127.0.0.1:9", fetchImpl: async () => ({ status: 202 }) });
  assert.throws(() => dfs.event("pageview", null, { url: "https://example.com/" }), /invalid_name/);
  assert.throws(() => dfs.event("signup", { email: "a@b.co" }, { url: "https://example.com/" }), /invalid_props/);
});

test("pageview posts text/plain and treats 202 as success", async () => {
  let seen = "";
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      seen = JSON.stringify({
        url: req.url,
        type: req.headers["content-type"],
        body: Buffer.concat(chunks).toString(),
      });
      res.writeHead(202);
      res.end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const dfs = new Datafs({ domain: "example.com", endpoint: `http://127.0.0.1:${port}` });
    await dfs.pageview({ url: "https://example.com/pricing?q=1", referrer: "" });
    const got = JSON.parse(seen);
    assert.equal(got.url, "/api/event");
    assert.equal(got.type, "text/plain;charset=UTF-8");
    assert.deepEqual(JSON.parse(got.body), { n: "pageview", u: "https://example.com/pricing", d: "example.com" });
  } finally {
    server.close();
  }
});
