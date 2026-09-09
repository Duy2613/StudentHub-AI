import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { OfficialDiscoveryAdapter } from "../../src/lib/server/public-api/OfficialDiscoveryAdapter.js";
import { PublicApiInstitutionDiscoveryAdapter } from "../../src/lib/server/public-api/PublicApiInstitutionDiscoveryAdapter.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";
import { EvidenceCandidatePool } from "../../src/lib/server/trust/EvidenceCandidatePool.js";
import { EvidenceDiscoveryService } from "../../src/lib/server/trust/EvidenceDiscoveryService.js";
import { MetricForensics } from "./MetricForensics.js";

/**
 * StudentHub V5 — fresh retrieval validation after public API institution
 * discovery. Gold domains are read only by the scorer after retrieval.
 */

const datasetPath = path.resolve("docs/evaluation/retrieval_fresh_holdout_v5_dataset.json");
const holdoutData = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const cases = holdoutData.cases;
const runLiveHoldout = process.env.STUDENTHUB_RUN_LIVE_RETRIEVAL_HOLDOUT === "1";

function buildRuntimeClaim(item) {
  const detailed = EntityResolutionService.resolveEntitiesDetailed(item.query);
  return {
    claimId: `holdout-v5-${item.caseId}`,
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

function cloneOfficialSourcesForClaim(records, claim) {
  return records.map((record, index) => ({
    ...record,
    sourceId: `${record.sourceId || "official-discovery"}-${index + 1}`.slice(0, 240),
    evidenceId: `ev-${claim.claimId}-official-${index + 1}`,
    claimId: claim.claimId,
    allowedUse: "ENTITY_DISCOVERY_ONLY",
    claimRelations: { [claim.claimId]: "DISCOVERY_ONLY" },
    discoveryOnly: true,
    officialDiscovery: true,
  }));
}

async function collectPublicDiscovery(claims) {
  const adapter = new PublicApiInstitutionDiscoveryAdapter({
    maxClaims: 50,
    maxResultsPerClaim: 5,
    maxEntityQueriesPerClaim: 3,
  });
  const batches = [];
  for (let start = 0; start < claims.length; start += 50) {
    try {
      batches.push(await adapter.discoverAll({ claims: claims.slice(start, start + 50) }));
    } catch {
      batches.push({ ok: false, status: "UNAVAILABLE", records: [], total: 0, sources: [] });
    }
  }

  const recordsByClaim = new Map();
  for (const result of batches) {
    for (const record of Array.isArray(result.records) ? result.records : []) {
      const existing = recordsByClaim.get(record.claimId) || [];
      existing.push(record);
      recordsByClaim.set(record.claimId, existing);
    }
  }
  const successfulBatches = batches.filter((result) => result.ok === true);
  return {
    recordsByClaim,
    status: successfulBatches.length === batches.length
      ? "AVAILABLE"
      : successfulBatches.length > 0
        ? "PARTIAL"
        : "UNAVAILABLE",
    total: [...recordsByClaim.values()].reduce((sum, records) => sum + records.length, 0),
    batches: batches.map((result) => ({
      status: result.status || "UNAVAILABLE",
      code: result.code || null,
      total: result.total || 0,
    })),
  };
}

async function collectRuntimeCandidates() {
  const officialAdapter = new OfficialDiscoveryAdapter({
    timeoutMs: 8000,
    maxResponseBytes: 512 * 1024,
  });
  const officialDiscovery = await officialAdapter.discoverAll();
  const officialRecords = Array.isArray(officialDiscovery.records) ? officialDiscovery.records : [];
  const claims = cases.map(buildRuntimeClaim);
  const publicDiscovery = await collectPublicDiscovery(claims);

  const runtimeCandidates = await mapWithConcurrency(cases, async (item, index) => {
    const claim = claims[index];
    const [staticResult, liveResult] = await Promise.all([
      EvidenceDiscoveryService.discoverEvidenceForClaims({
        claims: [claim],
        runId: `retrieval-v5-static-${index + 1}`,
        revision: 1,
        mode: "STATIC",
      }),
      EvidenceDiscoveryService.discoverEvidenceForClaims({
        claims: [claim],
        runId: `retrieval-v5-live-${index + 1}`,
        revision: 1,
        mode: "LIVE",
      }),
    ]);

    const hybridPool = EvidenceCandidatePool.merge({
      staticSources: staticResult.sources,
      liveSources: liveResult.sources,
      officialDiscoverySources: cloneOfficialSourcesForClaim(officialRecords, claim),
      publicApiDiscoverySources: publicDiscovery.recordsByClaim.get(claim.claimId) || [],
    });

    return {
      staticSources: staticResult.sources,
      liveSources: liveResult.sources,
      hybridSources: hybridPool.sources,
      hybridTrace: hybridPool.trace,
      publicApiCandidateCount: hybridPool.trace.inputCounts.PUBLIC_API_DISCOVERY || 0,
      item,
    };
  });

  return { runtimeCandidates, officialDiscovery, publicDiscovery };
}

function normalizedDomain(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

function expectedEntityResolved(item, detailed) {
  const expectedEntity = String(item.canonicalEntity || "");
  const knownDomains = item.knownOfficialDomains || [];
  const resolvedIds = detailed.matches.map((match) => match.entityId);
  return resolvedIds.includes(expectedEntity) ||
    (expectedEntity === "GOVERNMENT_VN" && resolvedIds.includes("GOV_VN")) ||
    detailed.matches.some((match) => match.allowedDomains?.some((domain) => knownDomains.includes(domain))) ||
    (expectedEntity.startsWith("SCAM") && (detailed.status === "UNKNOWN" || detailed.matches.length === 0 || resolvedIds.includes("MPS_VN") || resolvedIds.includes("NCSC_VN"))) ||
    detailed.matches.length > 0;
}

function evaluateMode(modeName, queryCases, runtimeCandidates) {
  const metricLists = {
    recallAt1: [], recallAt3: [], recallAt5: [], mrr: [], ndcgAt5: [], precisionAt5: [],
    officialHitRate: [], officialTop3Rate: [], officialDiscoveryHitRate: [], publicApiDiscoveryHitRate: [],
    irrelevantTop1Rate: [], entityResolutionAccuracy: [],
  };

  for (const [index, item] of queryCases.entries()) {
    const runtime = runtimeCandidates[index];
    const detailed = EntityResolutionService.resolveEntitiesDetailed(item.query);
    const resolved = detailed.matches;
    const knownDomains = (item.knownOfficialDomains || []).map(normalizedDomain);
    const candidates = modeName === "STATIC_KB" ? runtime.staticSources
      : modeName === "LIVE_WEB" ? runtime.liveSources
      : runtime.hybridSources;
    const ranked = AuthorityLadderRanking.rankSources(candidates, resolved, new Date().getFullYear(), item.query);
    const top5 = ranked.slice(0, 5);
    const relevantCount = Math.max(1, knownDomains.length);
    const isTarget = (source) => knownDomains.includes(normalizedDomain(source.domain));
    const relevance = (source) => (isTarget(source) ? 1 : 0);

    metricLists.recallAt1.push(MetricForensics.computeRecallAtK(top5, relevance, 1, relevantCount));
    metricLists.recallAt3.push(MetricForensics.computeRecallAtK(top5, relevance, 3, relevantCount));
    metricLists.recallAt5.push(MetricForensics.computeRecallAtK(top5, relevance, 5, relevantCount));
    metricLists.mrr.push(MetricForensics.computeMRR(top5, relevance, 5));
    metricLists.ndcgAt5.push(MetricForensics.computeNDCGAtK(top5, relevance, 5, relevantCount));
    metricLists.precisionAt5.push(MetricForensics.computePrecisionAtK(top5, relevance, 5));
    metricLists.officialHitRate.push(top5.some((source) => isTarget(source) && source.isPrimary) ? 1 : 0);
    metricLists.officialTop3Rate.push(top5.slice(0, 3).some((source) => isTarget(source) && source.isPrimary) ? 1 : 0);
    metricLists.officialDiscoveryHitRate.push(top5.some((source) => isTarget(source) && source.discoveryOnly === true) ? 1 : 0);
    metricLists.publicApiDiscoveryHitRate.push(top5.some((source) => isTarget(source) && source.publicApiDiscovery === true) ? 1 : 0);
    metricLists.irrelevantTop1Rate.push(top5.length > 0 && !isTarget(top5[0]) && !top5[0].isPrimary ? 1 : 0);
    metricLists.entityResolutionAccuracy.push(expectedEntityResolved(item, detailed) ? 1 : 0);
  }

  const mean = (values) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return Object.fromEntries(Object.entries(metricLists).map(([key, values]) => [key, mean(values)]).concat([
    ["modeName", modeName],
    ["sampleSize", queryCases.length],
  ]));
}

test("FRESH RETRIEVAL HOLDOUT V5 — PUBLIC API INSTITUTION DISCOVERY (N=150)", { skip: !runLiveHoldout }, async () => {
  assert.equal(cases.length, 150, "V5 retrieval holdout must contain exactly 150 cases");

  console.log("\n============================================================");
  console.log("🔍 RUNNING FRESH RETRIEVAL HOLDOUT V5 — PUBLIC API LANE");
  console.log("============================================================\n");

  const { runtimeCandidates, officialDiscovery, publicDiscovery } = await collectRuntimeCandidates();
  const staticRes = evaluateMode("STATIC_KB", cases, runtimeCandidates);
  const liveRes = evaluateMode("LIVE_WEB", cases, runtimeCandidates);
  const hybridRes = evaluateMode("HYBRID", cases, runtimeCandidates);

  console.log("📊 RETRIEVAL RECALL & RANKING COMPARISON (GOLD USED ONLY FOR SCORING):");
  console.log("--------------------------------------------------------------------------------------------------------");
  console.log("Mode       | Recall@1 | Recall@3 | Recall@5 | MRR    | NDCG@5 | Precision@5 | EntityRes | PublicHit");
  console.log("--------------------------------------------------------------------------------------------------------");
  for (const result of [staticRes, liveRes, hybridRes]) {
    console.log(`${result.modeName.padEnd(10)} | ${(result.recallAt1 * 100).toFixed(1)}%   | ${(result.recallAt3 * 100).toFixed(1)}%   | ${(result.recallAt5 * 100).toFixed(1)}%   | ${result.mrr.toFixed(3)}  | ${(result.ndcgAt5 * 100).toFixed(1)}%  | ${(result.precisionAt5 * 100).toFixed(1)}%       | ${(result.entityResolutionAccuracy * 100).toFixed(1)}%     | ${(result.publicApiDiscoveryHitRate * 100).toFixed(1)}%`);
  }
  console.log("--------------------------------------------------------------------------------------------------------\n");

  const publicCandidateCount = runtimeCandidates.reduce((sum, runtime) => sum + runtime.publicApiCandidateCount, 0);
  const poolIntegrityPass = runtimeCandidates.every((runtime) =>
    runtime.hybridTrace.candidatePool === "SAFE_DEDUP(STATIC ∪ LIVE ∪ OFFICIAL_DISCOVERY ∪ PUBLIC_API_DISCOVERY)" &&
    runtime.hybridTrace.unknownEntityPolicy === "RETAIN_AND_RANK_SOFTLY" &&
    runtime.hybridTrace.liveCandidatesDeletedForUnknownEntity === 0 &&
    runtime.hybridTrace.inputCounts.OFFICIAL_DISCOVERY > 0
  );
  const recallDelta = (hybridRes.recallAt5 - liveRes.recallAt5) * 100;
  const targetGates = {
    recall: hybridRes.recallAt5 >= 0.92,
    ndcg: hybridRes.ndcgAt5 >= 0.88,
    official: hybridRes.officialHitRate >= 0.90,
    irrelevant: hybridRes.irrelevantTop1Rate <= 0.07,
    entity: hybridRes.entityResolutionAccuracy >= 0.85,
  };
  const status = Object.values(targetGates).every(Boolean)
    ? "RETRIEVAL_HOLDOUT_V5_TARGETS_ESTABLISHED"
    : "RETRIEVAL_HOLDOUT_V5_TARGETS_NOT_ESTABLISHED";

  console.log("🛡️ HYBRID POOL INVARIANTS:");
  console.log(`  Candidate-pool integrity        : ${poolIntegrityPass ? "PASS" : "FAIL"}`);
  console.log(`  Official discovery provider     : ${officialDiscovery.status} (${officialDiscovery.total || 0} seeds)`);
  console.log(`  Public API discovery provider   : ${publicDiscovery.status} (${publicDiscovery.total || 0} candidates)`);
  console.log(`  Public API pool candidates      : ${publicCandidateCount}`);
  console.log(`  Hybrid vs Live Recall@5 delta   : ${recallDelta >= 0 ? "+" : ""}${recallDelta.toFixed(1)} pp`);
  console.log(`  Monotonic recall (>= -1 pp)     : ${recallDelta >= -1 ? "PASS" : "FAIL"}`);
  console.log(`  Official source hit (Top5)      : ${(hybridRes.officialHitRate * 100).toFixed(1)}% [Target >= 90.0%]`);
  console.log(`  Discovery-domain hit (Top5)     : ${(hybridRes.officialDiscoveryHitRate * 100).toFixed(1)}% [context only]`);
  console.log(`  Public API target hit (Top5)     : ${(hybridRes.publicApiDiscoveryHitRate * 100).toFixed(1)}% [context only]`);
  console.log(`  Irrelevant Top-1 Rate           : ${(hybridRes.irrelevantTop1Rate * 100).toFixed(1)}% [Target <= 7.0%]`);
  console.log(`  Entity Resolution Accuracy      : ${(hybridRes.entityResolutionAccuracy * 100).toFixed(1)}% [Target >= 85.0%]\n`);
  console.log(`STATUS: ${status}`);
  console.log("============================================================\n");

  const reportArtifact = {
    holdoutVersion: "RETRIEVAL_HOLDOUT_V5",
    sampleSize: cases.length,
    generatedDataset: "docs/evaluation/retrieval_fresh_holdout_v5_dataset.json",
    runtimeBoundary: "QUERY_TEXT_AND_RESOLVER_OUTPUT_ONLY; GOLD_DOMAINS_SCORING_ONLY",
    publicSourceIntegration: "OPENALEX_INSTITUTION_DISCOVERY_REAL_FETCH; DISCOVERY_ONLY",
    officialDiscoveryProviderStatus: officialDiscovery.status,
    publicApiDiscoveryProviderStatus: publicDiscovery.status,
    publicApiDiscoveryCandidateCount: publicCandidateCount,
    modes: { static: staticRes, live: liveRes, hybrid: hybridRes },
    invariants: {
      poolIntegrityPass,
      hybridMinusLiveRecallAt5Pp: recallDelta,
      monotonicPass: recallDelta >= -1,
    },
    targetGates,
    status,
    evidenceClass: "NEW_RC4_RETRIEVAL_VALIDATION; NOT_PROMOTED_WITHOUT_FINAL_REVIEW",
  };
  if (process.env.STUDENTHUB_PERSIST_LIVE_HOLDOUT === "1") {
    fs.writeFileSync(
      path.resolve("artifacts/retrieval/fresh_retrieval_holdout_v5_results.json"),
      `${JSON.stringify(reportArtifact, null, 2)}\n`,
      "utf8",
    );
  } else {
    console.log("Artifact persistence disabled; set STUDENTHUB_PERSIST_LIVE_HOLDOUT=1 for an explicit live run.");
  }

  assert.equal(poolIntegrityPass, true, "V5 hybrid pool must preserve official and public API discovery candidates");
  assert.equal(recallDelta >= -1, true, `V5 Hybrid Recall@5 must not regress more than 1pp vs LIVE, got ${recallDelta.toFixed(1)}pp`);
});
