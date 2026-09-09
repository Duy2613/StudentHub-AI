import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const css = fs.readFileSync(path.join(frontendRoot, "src/app/globals.css"), "utf8");

test("VNext semantic palette, state tokens and presentation layers are declared", () => {
  assert.match(css, /--canvas:\s*#07090E/);
  assert.match(css, /--surface:\s*#0C131B/);
  assert.match(css, /--surface-raised:\s*#14202B/);
  assert.match(css, /--brand:\s*#8BD9C3/);
  assert.match(css, /--control-border:\s*#647787/);
  assert.match(css, /--focus:\s*#C8E8FF/);
  assert.match(css, /--state-critical-text:\s*#FFA59B/);
  assert.match(css, /--z-atmosphere:\s*1/);
  assert.match(css, /--z-shell:\s*10/);
  assert.match(css, /--z-workspace:\s*20/);
  assert.match(css, /--z-contextual:\s*40/);
  assert.match(css, /\.surface-reading/);
  assert.match(css, /\.surface-instrument/);
  assert.match(css, /\.surface-archive/);
  assert.match(css, /\.surface-chrome/);
  assert.match(css, /background-image: none/);
});
