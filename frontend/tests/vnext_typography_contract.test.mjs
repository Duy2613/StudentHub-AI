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

test("VNext typography uses Vietnamese UI, selective editorial and technical families", () => {
  const layout = read("src/app/layout.tsx");
  const css = read("src/app/globals.css");

  assert.match(layout, /Be_Vietnam_Pro/);
  assert.match(layout, /subsets:\s*\["latin",\s*"vietnamese"\]/);
  assert.match(layout, /weight:\s*\["400",\s*"500",\s*"600",\s*"700"\]/);
  assert.match(layout, /Lora/);
  assert.match(layout, /JetBrains_Mono/);
  assert.match(css, /--font-ui:\s*var\(--font-be-vietnam\)/);
  assert.match(css, /--type-technical:\s*0\.8125rem/);
  assert.match(css, /\.type-body-lg/);
  assert.match(css, /font-synthesis:\s*none/);
});
