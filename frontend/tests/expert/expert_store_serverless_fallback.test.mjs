import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "studenthub-expert-store-"));
const blockedParent = path.join(tempRoot, "blocked-parent");
fs.writeFileSync(blockedParent, "not a directory", "utf8");
const unavailableStoragePath = path.join(blockedParent, "nested", "store.json");

after(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

test("serves seeded experts when durable storage is unavailable", () => {
  assert.doesNotThrow(() => ExpertStore.setStoragePath(unavailableStoragePath));

  const experts = ExpertStore.getAllExperts();
  assert.equal(experts.length, 6);
  assert.ok(experts.some((expert) => expert.expertId === "EXP_DR_MINH_AI"));
});
