import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const communityView = await readFile(new URL("../src/components/community/CommunityIntelligenceView.jsx", import.meta.url), "utf8");
const aggregation = await readFile(new URL("../src/lib/community/observationAggregation.js", import.meta.url), "utf8");
const scopedProvider = await readFile(new URL("../src/lib/backend/scopedRuntimeProvider.js", import.meta.url), "utf8");
const runtimeClient = await readFile(new URL("../src/lib/api/runtimeClient.js", import.meta.url), "utf8");

test("Community presentation aggregation is client-safe and keeps server authority isolated", () => {
  assert.match(communityView, /observationAggregation/);
  assert.doesNotMatch(communityView, /CanonicalAnnouncementService/);
  assert.doesNotMatch(aggregation, /node:crypto|crypto\.createHash|executeIdempotentMutation/);
  assert.match(aggregation, /Server-provided canonicalId remains[\s*]+authoritative/);
});

test("Community and Expert live browser lanes avoid server provider and validation bundles", () => {
  assert.doesNotMatch(scopedProvider, /@\/lib\/backend\/providerFactory|from ["']zod["']|from ["']@\/lib\/api\/(client|errors|community|experts)["']/);
  assert.doesNotMatch(runtimeClient, /from ["']zod["']|from ["']@\/lib\/api\/errors["']/);
  assert.match(scopedProvider, /NEXT_PUBLIC_STUDENTHUB_PROVIDER_MODE/);
  assert.match(scopedProvider, /SCOPED_PROVIDER_MODE/);
});
