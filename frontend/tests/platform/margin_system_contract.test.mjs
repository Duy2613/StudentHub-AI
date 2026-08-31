import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("The Margin is a shared production primitive, not a copied prototype", () => {
  for (const path of [
    "../../src/components/margin/Mark.jsx",
    "../../src/components/margin/Annotation.jsx",
    "../../src/components/margin/MarginRail.jsx",
    "../../src/components/margin/margin.css",
  ]) {
    assert.equal(existsSync(new URL(path, import.meta.url)), true, path);
  }

  const marks = source("../../src/components/margin/Mark.jsx");
  for (const mark of ["[n]", "✻", "!!", "?", "→", "✕"]) assert.match(marks, new RegExp(mark.replace(/[\[\]()*+?.\\^$|{}]/g, "\\$&")), mark);
  assert.doesNotMatch(marks, /[★☆✓✔⚠☑]/, "closed six-mark alphabet must not grow silently");

  const shell = source("../../src/components/layout/UnifiedAppShell.jsx");
  assert.match(shell, /import MarginRail/);
  assert.match(shell, /<MarginRail/);
  assert.match(source("../../src/app/layout.tsx"), /data-paper="night"/);
});

test("Dashboard and Academic surfaces expose source state instead of claiming fixture data is live", () => {
  const dashboard = source("../../src/components/home/CommandCenterDashboard.jsx");
  assert.match(dashboard, /DEMO_FIXTURE/);
  assert.match(dashboard, /SNAPSHOT \/ CẦN KẾT NỐI/);
  assert.match(dashboard, /Không tự thay thế dữ liệu bằng fixture/);
  assert.doesNotMatch(dashboard, /48 \/ 150/);
  assert.doesNotMatch(dashboard, /13:40/);

  const academicLoader = source("../../src/lib/intelligence/academic/academicCommandCenterDataLoader.js");
  assert.match(academicLoader, /sourceState: "SYNTHETIC_FIXTURE"/);
  assert.match(academicLoader, /isAuthoritative: false/);
  assert.match(source("../../src/components/academic/AcademicHeader.jsx"), /sourceState !== "SYNTHETIC_FIXTURE"/);
});
