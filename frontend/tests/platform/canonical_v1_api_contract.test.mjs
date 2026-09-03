import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const route = (name) => readFileSync(new URL(`../../src/app/api/v1/${name}/route.js`, import.meta.url), "utf8");

test("canonical v1 product façades expose versioned, Security Fabric-wrapped contracts", () => {
  const expected = {
    trust: ["trust.v1", "RUN_CANONICAL_TRUST_PIPELINE", "allowAnonymous: true"],
    community: ["community.v1", "READ_CANONICAL_COMMUNITY", "QUERY_CANONICAL_COMMUNITY"],
    experts: ["experts.v1", "DISCOVER_CANONICAL_EXPERTS", "EXPERT.READ"],
    academic: ["academic.v1", "READ_CANONICAL_ACADEMIC", "allowAnonymous: false"],
    dashboard: ["dashboard.v1", "READ_CANONICAL_DASHBOARD", "allowAnonymous: false"],
    search: ["search.v1", "SEARCH_CANONICAL_PRODUCT", "allowAnonymous: true"],
    notifications: ["notifications.v1", "READ_CANONICAL_NOTIFICATIONS", "UPDATE_CANONICAL_NOTIFICATION"],
  };

  for (const [name, markers] of Object.entries(expected)) {
    const source = route(name);
    assert.match(source, /SecurityFabric\.wrapHandler/);
    for (const marker of markers) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name}: ${marker}`);
  }
});

test("canonical Trust accepts only server-composed evidence inputs", () => {
  const source = route("trust");
  assert.match(source, /const INPUT_TYPES = new Set\(\["text", "url", "image", "file"\]\)/);
  assert.match(source, /safeMetadata/);
  assert.match(source, /Layer1ScreenService\.screen/);
  assert.match(source, /Layer2SemanticService\.verify/);
  assert.match(source, /Layer3EvidenceService\.verify/);
  assert.match(source, /Layer4TrustService\.evaluate/);
  assert.doesNotMatch(source, /body\?\.(evidence|candidates|sources)\b/, "browser must not provide candidate evidence authority");
});
