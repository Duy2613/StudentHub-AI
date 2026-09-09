import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("VNext shell keeps global layers small and scopes operator realtime UI", () => {
  const layout = read("src/app/layout.tsx");
  const shell = read("src/components/layout/UnifiedAppShell.jsx");
  const rail = read("src/components/margin/MarginRail.jsx");
  const css = read("src/app/globals.css");

  assert.doesNotMatch(layout, /KnowledgeCursor|RealtimeLiveConsole/);
  assert.match(shell, /ContextBar/);
  assert.match(shell, /RealtimeLiveConsole/);
  assert.doesNotMatch(rail, /CinematicTaskBackdrop|TOOL_FILM_MAP/);
  assert.match(css, /\.app-header[\s\S]*?z-index: var\(--z-shell/);
  assert.doesNotMatch(css, /z-index:\s*99999/);
});

test("VNext shell navigation does not prefetch deferred settings code into every route", () => {
  const shell = read("src/components/layout/UnifiedAppShell.jsx");
  const rail = read("src/components/margin/MarginRail.jsx");
  assert.match(shell, /href=["']\/settings["'][\s\S]*?prefetch=\{false\}/);
  assert.match(rail, /href=\{item\.href\}[\s\S]*?prefetch=\{false\}/);
});
