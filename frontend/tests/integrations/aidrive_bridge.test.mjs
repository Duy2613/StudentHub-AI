import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AIDriveIntegrationError,
  GenSparkAIDriveClient,
  getAIDriveIntegrationStatus,
  normalizeAIDrivePath,
} from "../../src/lib/integrations/aidrive/GenSparkAIDriveClient.js";

const baseEnv = {
  GENSPARK_TOKEN: "test-token-never-returned",
  GENSPARK_BASE_URL: "https://www.genspark.ai",
  GENSPARK_AIDRIVE_API_PREFIX: "/api/aidrive",
};

describe("GenSpark AI Drive read-only bridge", () => {
  it("normalizes safe paths and rejects traversal, relative, control, and backslash paths", () => {
    assert.equal(normalizeAIDrivePath("/coursework/week-1"), "/coursework/week-1");
    assert.equal(normalizeAIDrivePath("/"), "/");
    for (const path of ["relative", "/../secret", "/a/./b", "/a\\b", "/a\nheader"]) {
      assert.throws(() => normalizeAIDrivePath(path), AIDriveIntegrationError);
    }
  });

  it("reports configuration without exposing the token", () => {
    const status = getAIDriveIntegrationStatus(baseEnv);
    assert.equal(status.status, "READY");
    assert.equal(status.mode, "SERVER_READ_ONLY");
    assert.equal(JSON.stringify(status).includes(baseEnv.GENSPARK_TOKEN), false);
    assert.equal(getAIDriveIntegrationStatus({}).status, "NOT_CONFIGURED");
  });

  it("rejects custom or non-HTTPS origins unless explicitly allowlisted", () => {
    assert.throws(
      () => new GenSparkAIDriveClient({ env: { ...baseEnv, GENSPARK_BASE_URL: "http://www.genspark.ai" }, fetchImpl: async () => null }),
      (error) => error.code === "UNAPPROVED_PROVIDER_ORIGIN"
    );
    assert.throws(
      () => new GenSparkAIDriveClient({ env: { ...baseEnv, GENSPARK_BASE_URL: "https://evil.example" }, fetchImpl: async () => null }),
      (error) => error.code === "UNAPPROVED_PROVIDER_ORIGIN"
    );
  });

  it("lists bounded normalized items through the documented SDK endpoint", async () => {
    let captured;
    const client = new GenSparkAIDriveClient({
      env: baseEnv,
      fetchImpl: async (url, options) => {
        captured = { url: String(url), options };
        return new Response(JSON.stringify({ items: [
          { id: "internal", parent_id: "internal", name: "Academic", path: "/Academic", type: "directory", size: 999, modified_time: 1720000000 },
          { name: "rules.pdf", path: "/rules.pdf", type: "file", size: 4096, modified_time: 1720000100, mime_type: "application/pdf" },
          { name: "invalid", path: "relative", type: "file" },
        ] }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });

    const result = await client.listFiles("/", 12);
    assert.equal(result.totalCount, 2);
    assert.equal(result.items[0].size, 0);
    assert.equal("id" in result.items[0], false);
    assert.match(captured.url, /\/api\/aidrive\/ls\/files\/?\?limit=12$/);
    assert.equal(captured.options.redirect, "error");
    assert.equal(captured.options.headers.Authorization, `Bearer ${baseEnv.GENSPARK_TOKEN}`);
  });

  it("maps provider authentication errors without returning provider bodies", async () => {
    const client = new GenSparkAIDriveClient({
      env: baseEnv,
      fetchImpl: async () => new Response("token=leaked-provider-detail", { status: 401 }),
    });
    await assert.rejects(
      () => client.listFiles("/"),
      (error) => error.code === "AIDRIVE_AUTHENTICATION_FAILED" && !error.message.includes("leaked-provider-detail")
    );
  });
});
