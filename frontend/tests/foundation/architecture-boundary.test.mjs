import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("foundation dependency direction keeps transport imports in the adapter", () => {
  const ports = source("../../src/lib/backend/ports.ts");
  const factory = source("../../src/lib/backend/providerFactory.ts");
  const demo = source("../../src/lib/backend/providers/DemoProvider.ts");
  const futureLive = source("../../src/lib/backend/providers/FutureLiveProvider.ts");
  const adapter = source("../../src/lib/backend/adapters/ApiProviderAdapter.ts");
  const uiState = source("../../src/lib/ui-state/model.ts");

  for (const foundationSource of [ports, factory, demo, futureLive, uiState]) {
    assert.doesNotMatch(foundationSource, /\bfetch\s*\(/, "non-adapter foundation must not own transport");
    assert.doesNotMatch(foundationSource, /apiRequest|supabase|@supabase|from ["'].*components/, "non-adapter foundation must not import transport/UI internals");
  }
  assert.match(adapter, /from ["']\.\.\/\.\.\/api\//);
  assert.doesNotMatch(adapter, /from ["'].*components/);
  assert.doesNotMatch(uiState, /from ["'].*react/);
  assert.doesNotMatch([ports, factory, demo, futureLive, adapter].join("\n"), /NEXT_PUBLIC_|SUPABASE_SERVICE_ROLE|API_KEY|SECRET/);
});

test("only explicit source provenance can identify demo output", () => {
  const demo = source("../../src/lib/backend/providers/DemoProvider.ts");
  const futureLive = source("../../src/lib/backend/providers/FutureLiveProvider.ts");
  assert.match(demo, /demoProvenance\(FIXTURE_ID, FIXTURE_VERSION\)/);
  assert.match(futureLive, /sourceMode: \"UNAVAILABLE\"/);
  assert.doesNotMatch(futureLive, /DemoProvider|demoProvenance|DEMO_FIXTURE/);
});
