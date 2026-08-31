import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { resolveNextChunkPath } from "./next-chunk-path.mjs";

const frontendRoot = resolve("bundle-path-test", "frontend");
const expected = (...segments) => join(resolve(frontendRoot, ".next"), ...segments);
const backslash = String.fromCharCode(92);

assert.equal(
  resolveNextChunkPath(frontendRoot, "static/chunks/a.js"),
  expected("static", "chunks", "a.js"),
);
assert.equal(
  resolveNextChunkPath(frontendRoot, "static" + backslash + "chunks" + backslash + "a.js"),
  expected("static", "chunks", "a.js"),
);
assert.equal(
  resolveNextChunkPath(frontendRoot, "static/chunks" + backslash + "nested" + backslash + "a.js"),
  expected("static", "chunks", "nested", "a.js"),
);
assert.equal(
  resolveNextChunkPath(
    frontendRoot,
    "static" + backslash + "chunks/mixed" + backslash + "nested/a.js",
  ),
  expected("static", "chunks", "mixed", "nested", "a.js"),
);

for (const invalidChunk of [
  "../static/chunks/a.js",
  "static/../chunks/a.js",
  "static/./chunks/a.js",
  "/static/chunks/a.js",
  "C:" + backslash + "outside" + backslash + "a.js",
]) {
  assert.throws(
    () => resolveNextChunkPath(frontendRoot, invalidChunk),
    /Invalid Next\.js chunk path/,
  );
}

console.log("[BUNDLE_PATH_TEST] PASS");
