import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const frontendRoot = process.cwd().endsWith("frontend")
  ? process.cwd()
  : join(process.cwd(), "frontend");
const apiRoot = join(frontendRoot, "src", "app", "api");
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.name === "route.js" || entry.name === "route.jsx" ? [target] : [];
  });
}

test("every API route exposes at least one explicit HTTP handler", () => {
  const routes = collect(apiRoot);
  assert.ok(routes.length > 0, "No API routes discovered");
  const invalid = routes.filter((route) => {
    const source = readFileSync(route, "utf8");
    return !methods.some((method) =>
      new RegExp(`export\\s+(?:(?:async\\s+)?function|const|let)\\s+${method}\\b`).test(source)
    );
  });
  assert.deepEqual(invalid, [], `Routes without explicit handlers: ${invalid.map((route) => relative(process.cwd(), route)).join(", ")}`);
});

test("API route source does not contain obvious browser-only globals", () => {
  const routes = collect(apiRoot);
  const invalid = routes.filter((route) => /document\.cookie|localStorage|sessionStorage/.test(readFileSync(route, "utf8")));
  assert.deepEqual(invalid, [], `Server routes contain browser-only globals: ${invalid.map((route) => relative(process.cwd(), route)).join(", ")}`);
});
