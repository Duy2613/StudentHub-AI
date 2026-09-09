import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";
import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";
import { EvidenceCandidatePool } from "../../src/lib/server/trust/EvidenceCandidatePool.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { MetricForensics } from "./MetricForensics.js";

/**
 * StudentHub V5 — Fresh Retrieval Holdout V3 (N=165 Queries)
 *
 * The previous runner constructed LIVE/HYBRID candidates from each query's
 * `knownOfficialDomains`. That was an oracle and its PASS result is invalid.
 * This runner calls the production discovery service. Gold domains are used
 * only by the scorer after retrieval, never to create a candidate or query.
 *
 * This is therefore a real retrieval validation run. It reports whether the
 * target gates are established; it does not convert a failed external-recall
 * gate into a green CI result.
 */

const datasetPath = path.resolve("docs/evaluation/retrieval_fresh_holdout_v3_dataset.json");
const holdoutData = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const cases = holdoutData.cases;

function buildRuntimeClaim(item) {
  const detailed = EntityResolutionService.resolveEntitiesDetailed(item.query);
  return {
    claimId: `holdout-${item.caseId}`,
    text: item.query,
    normalizedText: item.query.toLowerCase(),
    entities: detailed.matches.map((match) => ({
      name: match.canonicalName,
      domain: match.officialDomain,
      entityId: match.entityId,
    })),
  };
}

async function mapWithConcurrency(items, worker, concurrency = 6) {
  const output = new Array(items.length);
  let nextIndex = 0;
  async function runWorker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));
  return output;
}

async function collectRuntimeCandidates() {
  return mapWithConcurrency(cases, async (item, index) => {
    const claim = buildRuntimeClaim(item);
    const [staticResult, liveResult] = await Promise.all([
      EvidenceDiscoveryService.discoverEvidenceForClaims({
        claims: [claim],
        runId: `retrieval-v3-static-${index + 1}`,
        revision: 1,
        mode: "STATIC",
      }),
      EvidenceDiscoveryService.discoverEvidenceForClaims({
        claims: [claim],
        runId: `retrieval-v3-live-${index + 1}`,
        revision: 1,
        mode: "LIVE",
      }),
    ]);

    const hybridPool = EvidenceCandidatePool.merge({
      staticSources: staticResult.sources,
      liveSources: liveResult.sources,
      // No label-derived domain seed is allowed here. Official discovery is
      // intentionally empty until an independently collected public registry
      // is supplied to the production adapter.
      officialDiscoverySources: [],
    });

    return {
      staticSources: staticResult.sources,
      liveSources: liveResult.sources,
      hybridSources: hybridPool.sources,
      hybridTrace: hybridPool.trace,
    };
  });
}

function expectedEntityResolved(item, detailed) {
  const expectedEntity = item.canonicalEntity;
  const knownDomains = item.knownOfficialDomains || (item.knownOfficialDomain ? [item.knownOfficialDomain] : []);
  const resolvedIds = detailed.matches.map((match) => match.entityId);
  return resolvedIds.includes(expectedEntity) ||
    (expectedEntity === "GOVERNMENT_VN" && resolvedIds.includes("GOV_VN")) ||
    detailed.matches.some((match) => match.allowedDomains?.some((domain) => knownDomains.includes(domain))) ||
    (expectedEntity.startsWith("AMBIGUOUS_") && detailed.status === "AMBIGUOUS") ||
    (expectedEntity.startsWith("SCAM_ALERT_") && (detailed.status === "UNKNOWN" || detailed.matches.length === 0 || resolvedIds.includes("MPS_VN") || resolvedIds.includes("NCSC_VN"))) ||
    ((expectedEntity.startsWith("MULTI_") || expectedEntity.startsWith("SIMILAR_")) && resolvedIds.length >= 2);
}

function evaluateMode(modeName, queryCases, runtimeCandidates) {
  const metricLists = {
    recallAt1: [], recallAt3: [], recallAt5: [], mrr: [], ndcgAt5: [], precisionAt5: [],
    officialHitRate: [], officialTop3Rate: [], irrelevantTop1Rate: [], entityResolutionAccuracy: [],
  };

  for (const [index, item] of queryCases.entries()) {
    const runtime = runtimeCandidates[index];
    const detailed = EntityResolutionService.resolveEntitiesDetailed(item.query);
    const resolved = detailed.matches;
    const knownDomains = item.knownOfficialDomains || (item.knownOfficialDomain ? [item.knownOfficialDomain] : []);
    const candidates = modeName === "STATIC_KB" ? runtime.staticSources
      : modeName === "LIVE_WEB" ? runtime.liveSources
      : runtime.hybridSources;
    const ranked = AuthorityLadderRanking.rankSources(candidates, resolved, new Date().getFullYear(), item.query);
    const top5 = ranked.slice(0, 5);
    const isTarget = (source) => knownDomains.some((domain) => String(source.domain || "").toLowerCase() === domain.toLowerCase());
    const relevance = (source) => (isTarget(source) ? 1 : 0);

    metricLists.recallAt1.push(MetricForensics.computeRecallAtK(top5, relevance, 1, 1));
    metricLists.recallAt3.push(MetricForensics.computeRecallAtK(top5, relevance, 3, 1));
    metricLists.recallAt5.push(MetricForensics.computeRecallAtK(top5, relevance, 5, 1));
    metricLists.mrr.push(MetricForensics.computeMRR(top5, relevance, 5));
    metricLists.ndcgAt5.push(MetricForensics.computeNDCGAtK(top5, relevance, 5, 1));
    metricLists.precisionAt5.push(MetricForensics.computePrecisionAtK(top5, relevance, 5));
    metricLists.officialHitRate.push(top5.some((source) => source.isPrimary) ? 1 : 0);
    metricLists.officialTop3Rate.push(top5.slice(0, 3).some((source) => source.isPrimary) ? 1 : 0);
    metricLists.irrelevantTop1Rate.push(top5.length > 0 && !isTarget(top5[0]) && !top5[0].isPrimary ? 1 : 0);
    metricLists.entityResolutionAccuracy.push(expectedEntityResolved(item, detailed) ? 1 : 0);
  }

  const mean = (values) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return Object.fromEntries(Object.entries(metricLists).map(([key, values]) => [key, mean(values)]).concat([
    ["modeName", modeName],
    ["sampleSize", queryCases.length],
  ]));
}

test("FRESH RETRIEVAL HOLDOUT V3 — REAL DISCOVERY PATH (N=165 QUERIES)", async () => {
  console.log("\n============================================================");
  console.log("🔍 RUNNING FRESH RETRIEVAL HOLDOUT V3 — REAL DISCOVERY PATH (N=165)");
  console.log("============================================================\n");

  const runtimeCandidates = await collectRuntimeCandidates();
  const staticRes = evaluateMode("STATIC_KB", cases, runtimeCandidates);
  const liveRes = evaluateMode("LIVE_WEB", cases, runtimeCandidates);
  const hybridRes = evaluateMode("HYBRID", cases, runtimeCandidates);

  console.log("📊 RETRIEVAL RECALL & RANKING COMPARISON (GOLD USED ONLY FOR SCORING):");
  console.log("-----------------------------------------------------------------------------------------");
  console.log("Mode       | Recall@1 | Recall@3 | Recall@5 | MRR    | NDCG@5 | Precision@5 | EntityRes");
  console.log("-----------------------------------------------------------------------------------------");
  for (const result of [staticRes, liveRes, hybridRes]) {
    console.log(`${result.modeName.padEnd(10)} | ${(result.recallAt1 * 100).toFixed(1)}%   | ${(result.recallAt3 * 100).toFixed(1)}%   | ${(result.recallAt5 * 100).toFixed(1)}%   | ${result.mrr.toFixed(3)}  | ${(result.ndcgAt5 * 100).toFixed(1)}%  | ${(result.precisionAt5 * 100).toFixed(1)}%       | ${(result.entityResolutionAccuracy * 100).toFixed(1)}%`);
  }
  console.log("-----------------------------------------------------------------------------------------\n");

  const poolIntegrityPass = runtimeCandidates.every((runtime) =>
    runtime.hybridTrace.candidatePool === "SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)" &&
    runtime.hybridTrace.unknownEntityPolicy === "RETAIN_AND_RANK_SOFTLY" &&
    runtime.hybridTrace.liveCandidatesDeletedForUnknownEntity === 0
  );
  const recallDelta = (hybridRes.recallAt5 - liveRes.recallAt5) * 100;
  console.log("🛡️ HYBRID POOL INVARIANTS:");
  console.log(`  Candidate-pool integrity        : ${poolIntegrityPass ? "PASS" : "FAIL"}`);
  console.log(`  Hybrid vs Live Recall@5 delta   : ${recallDelta >= 0 ? "+" : ""}${recallDelta.toFixed(1)} pp`);
  console.log(`  Monotonic recall (>= -1 pp)     : ${recallDelta >= -1 ? "PASS" : "FAIL"}`);
  console.log(`  Official Source Hit Rate (Top5): ${(hybridRes.officialHitRate * 100).toFixed(1)}% [Target >= 90.0%]`);
  console.log(`  Irrelevant Top-1 Rate           : ${(hybridRes.irrelevantTop1Rate * 100).toFixed(1)}% [Target <= 7.0%]`);
  console.log(`  Entity Resolution Accuracy      : ${(hybridRes.entityResolutionAccuracy * 100).toFixed(1)}% [Target >= 85.0%]\n`);

  const retrievalGates = {
    recall: hybridRes.recallAt5 >= 0.92,
    ndcg: hybridRes.ndcgAt5 >= 0.88,
    official: hybridRes.officialHitRate >= 0.90,
    irrelevant: hybridRes.irrelevantTop1Rate <= 0.07,
    entity: hybridRes.entityResolutionAccuracy >= 0.85,
  };
  const allTargetGatesPass = Object.values(retrievalGates).every(Boolean);
  const status = allTargetGatesPass
    ? "RETRIEVAL_HOLDOUT_V3_TARGETS_ESTABLISHED"
    : "RETRIEVAL_HOLDOUT_V3_TARGETS_NOT_ESTABLISHED";
  console.log(`STATUS: ${status}`);
  console.log("============================================================\n");

  // This test is an integrity/measurement run. External recall is evidence,
  // not a reason to make CI green by injecting a gold-domain candidate.
  assert.equal(poolIntegrityPass, true, "Hybrid candidate pool must preserve all source families and UNKNOWN candidates");
  assert.equal(recallDelta >= -1, true, `Hybrid Recall@5 must not regress more than 1pp vs LIVE, got ${recallDelta.toFixed(1)}pp`);
});
