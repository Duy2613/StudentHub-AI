import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

test("F02 exposes primitive, semantic, component, status, type, and motion token layers", () => {
  for (const token of [
    "--token-primitive-canvas",
    "--token-semantic-surface-canvas",
    "--token-semantic-ink-primary",
    "--token-semantic-border-default",
    "--token-component-radius-control",
    "--token-component-focus-ring",
    "--token-status-safe",
    "--token-status-risk",
    "--token-status-unknown",
    "--token-status-unavailable",
    "--token-type-human",
    "--token-type-machine",
    "--token-motion-duration-standard",
    "--token-motion-ease-standard",
  ]) {
    assert.match(css, new RegExp(`${token}\\s*:`), token);
  }
});

test("uncertainty and unavailable status tokens are not aliases for safe", () => {
  assert.match(css, /--token-status-safe:\s*var\(--success\)/);
  assert.match(css, /--token-status-unknown:\s*var\(--text-secondary\)/);
  assert.match(css, /--token-status-unavailable:\s*var\(--text-muted\)/);
  assert.doesNotMatch(css, /--token-status-unknown:\s*var\(--success\)/);
  assert.doesNotMatch(css, /--token-status-unavailable:\s*var\(--success\)/);
});

test("reduced-motion token fallback is explicit", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /--token-motion-duration-standard:\s*0ms/);
  assert.match(css, /--token-motion-ease-reduced:\s*linear/);
});
