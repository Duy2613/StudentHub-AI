import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { createCorrelationId, createSecureId } from "../../src/lib/security/secureId.js";
import { SecurityContext } from "../../src/lib/security/core/SecurityContext.js";

const LIB_ROOT = fileURLToPath(new URL("../../src/lib", import.meta.url));
const ALLOWED_NON_ID_RANDOM_FILES = new Set([
  join(LIB_ROOT, "intelligence", "social", "RateLimitManager.js"),
  join(LIB_ROOT, "intelligence", "academic", "liveSourceWatcher.js"),
]);

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(target);
    return entry.isFile() && target.endsWith(".js") ? [target] : [];
  });
}

describe("Secure identifier and correlation contracts", () => {
  it("generates unique bounded opaque IDs using the shared security utility", () => {
    const ids = Array.from({ length: 512 }, () => createSecureId("audit:event"));
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^audit:event_[A-Za-z0-9_-]+$/);
      assert.ok(id.length <= 128);
    }
    assert.match(createCorrelationId("sec_edge"), /^[A-Za-z0-9_.:-]{1,128}$/);
  });

  it("preserves valid incoming correlation IDs and replaces hostile values", () => {
    const valid = "request.safe-123";
    const validContext = SecurityContext.fromRequest(new Request("https://service.example/", {
      headers: { "x-correlation-id": valid },
    }));
    assert.equal(validContext.correlationId, valid);

    const hostile = "../../attacker supplied id";
    const hostileContext = SecurityContext.fromRequest(new Request("https://service.example/", {
      headers: { "x-correlation-id": hostile },
    }));
    assert.notEqual(hostileContext.correlationId, hostile);
    assert.match(hostileContext.correlationId, /^sec_[A-Za-z0-9_-]+$/);
  });

  it("contains no non-cryptographic random ID generator in authoritative ID paths", () => {
    const randomUses = collectJavaScriptFiles(LIB_ROOT)
      .filter((filePath) => !ALLOWED_NON_ID_RANDOM_FILES.has(filePath))
      .filter((filePath) => /Math\.random\s*\(/.test(readFileSync(filePath, "utf8")));
    assert.deepEqual(randomUses, [], `unexpected random ID paths: ${randomUses.join(", ")}`);

    const secureUtility = readFileSync(join(LIB_ROOT, "..", "lib", "security", "secureId.js"), "utf8");
    assert.match(secureUtility, /randomUUID|getRandomValues/);
  });

  it("does not treat scheduler jitter as an identifier source", () => {
    for (const allowedFile of ALLOWED_NON_ID_RANDOM_FILES) {
      const source = readFileSync(allowedFile, "utf8");
      assert.match(source, /Math\.random\s*\(/, allowedFile);
    }
  });
});
