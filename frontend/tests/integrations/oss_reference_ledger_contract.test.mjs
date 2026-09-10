import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const ledger = readFileSync(join(root, "docs", "integrations", "OSS-REFERENCE-LEDGER.md"), "utf8");

test("OSS reference ledger records licenses and concept-only boundaries", () => {
  for (const reference of ["Discourse", "Forem", "OpenReview", "Supabase agent skills", "Vercel React best practices", "21st / Magic MCP", "Convex agent skills", "public-apis/public-apis"]) {
    assert.match(ledger, new RegExp(reference.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"), reference);
  }
  assert.match(ledger, /GPL-2\.0/i);
  assert.match(ledger, /AGPL-3\.0/i);
  assert.match(ledger, /MIT/i);
  assert.match(ledger, /No Discourse source|No Forem source/i);
  assert.match(ledger, /Supabase\/Postgres/i);
  assert.match(ledger, /GET-only|GET-only/i);
});

test("Promax runtime does not import the reference projects as dependencies", () => {
  const runtimeFiles = [
    "frontend/src/lib/communityExpert/promaxDomain.js",
    "frontend/src/lib/server/database/CommunityRepository.js",
    "frontend/src/lib/server/database/ExpertRepository.js",
    "frontend/src/lib/server/expert/ExpertQualificationService.js",
  ];
  for (const file of runtimeFiles) {
    const source = readFileSync(join(root, file), "utf8");
    assert.doesNotMatch(source, /from\s+["'](?:discourse|forem|openreview|convex)["']/i, file);
  }
});
