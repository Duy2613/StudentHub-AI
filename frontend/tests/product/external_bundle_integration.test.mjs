import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";

describe("external bundle integration contract", () => {
  it("isolates Ultra Experience to its dedicated route", () => {
    const rootLayout = readFileSync(new URL("../../src/app/layout.tsx", import.meta.url), "utf8");
    const ultraPage = readFileSync(new URL("../../src/app/ultra/page.jsx", import.meta.url), "utf8");
    const scene = readFileSync(new URL("../../src/components/ultra/UltraHeroScene.jsx", import.meta.url), "utf8");
    assert.equal(rootLayout.includes("UltraProvider"), false);
    assert.match(ultraPage, /<UltraProvider>/);
    assert.match(scene, /frameloop=\{isActive \? "always" : "never"\}/);
    assert.match(scene, /visibilitychange/);
    assert.match(scene, /IntersectionObserver/);
  });

  it("keeps secret and machine-state artifacts out of the repository", () => {
    for (const path of [
      "../../../git-credentials.txt",
      "../../../genspark_llm.yaml",
      "../../../sudo_as_admin_successful",
      "../../../node_modules.tar.gz",
    ]) {
      assert.equal(existsSync(new URL(path, import.meta.url)), false, path);
    }
  });

  it("documents every supplied artifact class and its safe disposition", () => {
    const spec = readFileSync(new URL("../../../docs/integrations/EXTERNAL-BUNDLE-INTEGRATION-SPEC.md", import.meta.url), "utf8");
    for (const marker of ["webapp.tar.gz", "AI Drive wheels", "node_modules.tar.gz", "genspark_llm", "git-credentials", "HOST_STATE_EXCLUDED"]) {
      assert.ok(spec.includes(marker), marker);
    }
  });
});
