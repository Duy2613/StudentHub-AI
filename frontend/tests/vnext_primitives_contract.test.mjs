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

test("VNext primitives expose surface, intent, evidence-state and data-backed context contracts", () => {
  const surface = read("src/components/ui/VNextSurface.jsx");
  const button = read("src/components/ui/VNextButton.jsx");
  const state = read("src/components/ui/EvidenceStateBadge.jsx");
  const context = read("src/components/ui/ContextBar.jsx");
  const css = read("src/app/globals.css");

  assert.match(surface, /surface-reading/);
  assert.match(surface, /surface-instrument/);
  assert.match(surface, /surface-archive/);
  assert.match(surface, /surface-chrome/);
  assert.match(button, /isLoading/);
  assert.match(button, /disabled \|\| isLoading/);
  assert.match(state, /conflict/);
  assert.match(state, /unknown/);
  assert.match(state, /Icon/);
  assert.match(context, /item\.value !== undefined/);
  assert.match(context, /visibleItems\.length === 0/);
  assert.match(css, /\.vnext-button-primary/);
  assert.match(css, /\.evidence-state-critical/);
});
