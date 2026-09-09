import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { INSTITUTIONAL_KNOWLEDGE_BASE } from "../../src/lib/ai-trust/layer3/retrieval/KnowledgeBaseRetriever.js";

/**
 * StudentHub V5 — Historical Retrieval Validation V1 (N=168 Queries)
 *
 * This historical evaluator constructs LIVE/HYBRID candidates from each
 * case's knownOfficialDomains. It is therefore gold-derived and is retained
 * only as a validation record, not as an untouched release holdout.
 *
 * Implements the historical Sections 9–15 comparison:
 * - Historical 168-case set (SHA-256: 9329872e02a402defef9fe7a36503e9ee75a1545550c1e63c6f582e22dd60cce)
 * - Evaluates STATIC_KB, LIVE_WEB, and HYBRID separately.
 * - Reports:
 *   - Recall@1, Recall@3, Recall@5
 *   - MRR (Mean Reciprocal Rank)
 *   - NDCG@5
 *   - Precision@5
 *   - Official Source Hit Rate
 *   - Official Source Top-3 Rate
 *   - Irrelevant Top-1 Rate
 *   - Entity Resolution Accuracy
 *   - Bootstrap 95% Confidence Intervals (1000 resamples)
 *
 * Targets (Section 15):
 * - Recall@5 >= 0.92
 * - NDCG@5 >= 0.88
 * - Official Source Hit >= 0.90
 * - Irrelevant Top-1 <= 0.07
 * - Entity Resolution >= 0.90
 */

const datasetPath = path.resolve("docs/evaluation/retrieval_fresh_holdout_dataset.json");
const holdoutData = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const cases = holdoutData.cases;

// Bootstrap 95% Confidence Interval Calculator
function bootstrapCI(values, numResamples = 1000) {
  if (!values || values.length === 0) return { mean: 0, low: 0, high: 0 };
  const n = values.length;
  const resampleMeans = [];

  for (let b = 0; b < numResamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sum += values[idx];
    }
    resampleMeans.push(sum / n);
  }

  resampleMeans.sort((a, b) => a - b);
  const lowIdx = Math.floor(numResamples * 0.025);
  const highIdx = Math.floor(numResamples * 0.975);
  const mean = values.reduce((a, b) => a + b, 0) / n;

  return {
    mean: Number(mean.toFixed(4)),
    ci95Low: Number(resampleMeans[lowIdx].toFixed(4)),
    ci95High: Number(resampleMeans[highIdx].toFixed(4))
  };
}

function evaluateRetrievalMode(modeName, queryCases) {
  const n = queryCases.length;
  const recall1List = [];
  const recall3List = [];
  const recall5List = [];
  const mrrList = [];
  const ndcg5List = [];
  const precision5List = [];
  const officialHitList = [];
  const officialTop3List = [];
  const irrelevantTop1List = [];
  const entityResolutionList = [];

  for (const item of queryCases) {
    const query = item.query;
    const knownDomains = item.knownOfficialDomains || [];
    const expectedEntity = item.canonicalEntity;

    // 1. Entity Resolution
    const resolved = EntityResolutionService.resolveEntities(query);
    const resolvedEntityIds = resolved.map(r => r.entityId);
    const isEntityResolved = resolvedEntityIds.includes(expectedEntity) ||
                            resolved.some(r => r.allowedDomains.some(d => knownDomains.includes(d)));
    entityResolutionList.push(isEntityResolved ? 1 : 0);

    // 2. Retrieval Candidates Generation by Mode
    let candidateSources = [];

    if (modeName === "STATIC_KB") {
      // Static KB only
      const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      candidateSources = INSTITUTIONAL_KNOWLEDGE_BASE.filter(doc => {
        const text = `${doc.title} ${doc.content} ${doc.domain} ${doc.keywords?.join(" ")}`.toLowerCase();
        return queryTokens.some(t => text.includes(t));
      }).map(d => ({
        sourceId: d.docId,
        title: d.title,
        domain: d.domain,
        url: d.canonicalUrl,
        isPrimary: d.domain.endsWith(".edu.vn") || d.domain.endsWith(".gov.vn")
      }));
    } else if (modeName === "LIVE_WEB") {
      // Live web & portal discovery registry
      candidateSources = knownDomains.map((kd, idx) => ({
        sourceId: `live-web-${idx + 1}`,
        title: `Cổng thông tin ${kd}`,
        domain: kd,
        url: `https://${kd}/thong-bao`,
        isPrimary: kd.endsWith(".edu.vn") || kd.endsWith(".gov.vn") || kd.endsWith(".org.vn")
      }));
    } else if (modeName === "HYBRID") {
      // Hybrid: Static KB + Dynamic Portal Fallback + Authority Reranking
      const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const kbMatches = INSTITUTIONAL_KNOWLEDGE_BASE.filter(doc => {
        const text = `${doc.title} ${doc.content} ${doc.domain} ${doc.keywords?.join(" ")}`.toLowerCase();
        return queryTokens.some(t => text.includes(t));
      }).map(d => ({
        sourceId: d.docId,
        title: d.title,
        domain: d.domain,
        url: d.canonicalUrl,
        isPrimary: d.domain.endsWith(".edu.vn") || d.domain.endsWith(".gov.vn")
      }));

      // Augment with live portal discovery if unindexed or missing in static KB
      const dynamicSources = knownDomains.map((kd, idx) => ({
        sourceId: `portal-${idx + 1}`,
        title: `Cổng xác thực ${kd}`,
        domain: kd,
        url: `https://${kd}/thong-bao-2026`,
        isPrimary: kd.endsWith(".edu.vn") || kd.endsWith(".gov.vn") || kd.endsWith(".org.vn")
      }));

      candidateSources = [...kbMatches, ...dynamicSources];
    }

    // 3. Reranking via Authority Ladder
    const ranked = AuthorityLadderRanking.rankSources(candidateSources, resolved, 2026);
    const top5 = ranked.slice(0, 5);

    // Helper: is source matching ground truth official domains
    const isTargetMatch = (s) => knownDomains.some(kd => s.domain.toLowerCase().includes(kd.toLowerCase()));

    // Metrics computation
    const hasMatchAt1 = top5.slice(0, 1).some(isTargetMatch);
    const hasMatchAt3 = top5.slice(0, 3).some(isTargetMatch);
    const hasMatchAt5 = top5.slice(0, 5).some(isTargetMatch);

    recall1List.push(hasMatchAt1 ? 1 : 0);
    recall3List.push(hasMatchAt3 ? 1 : 0);
    recall5List.push(hasMatchAt5 ? 1 : 0);

    // Reciprocal Rank (MRR)
    let firstRank = 0;
    for (let r = 0; r < top5.length; r++) {
      if (isTargetMatch(top5[r])) {
        firstRank = r + 1;
        break;
      }
    }
    mrrList.push(firstRank > 0 ? (1 / firstRank) : 0);

    // Precision@5
    const matchCount5 = top5.filter(isTargetMatch).length;
    precision5List.push(top5.length > 0 ? (matchCount5 / 5) : 0);

    // Official Hit Rate & Top-3
    const hasOfficial5 = top5.some(s => s.isPrimary);
    const hasOfficial3 = top5.slice(0, 3).some(s => s.isPrimary);
    officialHitList.push(hasOfficial5 ? 1 : 0);
    officialTop3List.push(hasOfficial3 ? 1 : 0);

    // Irrelevant Top-1 Rate
    let isIrrelevantTop1 = false;
    if (top5.length > 0) {
      const top1 = top5[0];
      const isTop1Relevant = isTargetMatch(top1) || top1.domain.endsWith(".edu.vn") || top1.domain.endsWith(".gov.vn");
      if (!isTop1Relevant) isIrrelevantTop1 = true;
    }
    irrelevantTop1List.push(isIrrelevantTop1 ? 1 : 0);

    // NDCG@5
    let dcg = 0;
    let idcg = 0;
    for (let pos = 0; pos < Math.min(top5.length, 5); pos++) {
      const s = top5[pos];
      const rel = isTargetMatch(s) ? 3 : (s.isPrimary ? 2 : 1);
      dcg += rel / Math.log2(pos + 2);
    }
    const idealRels = [3, 3, 2, 2, 1];
    for (let pos = 0; pos < Math.min(top5.length, 5); pos++) {
      idcg += idealRels[pos] / Math.log2(pos + 2);
    }
    ndcg5List.push(idcg > 0 ? (dcg / idcg) : 0);
  }

  return {
    mode: modeName,
    sampleCount: n,
    recallAt1: bootstrapCI(recall1List),
    recallAt3: bootstrapCI(recall3List),
    recallAt5: bootstrapCI(recall5List),
    mrr: bootstrapCI(mrrList),
    ndcgAt5: bootstrapCI(ndcg5List),
    precisionAt5: bootstrapCI(precision5List),
    officialSourceHit: bootstrapCI(officialHitList),
    officialSourceTop3: bootstrapCI(officialTop3List),
    irrelevantTop1: bootstrapCI(irrelevantTop1List),
    entityResolutionAccuracy: bootstrapCI(entityResolutionList)
  };
}

test("HISTORICAL RETRIEVAL VALIDATION V1 — GOLD-DERIVED ORACLE (N=168 QUERIES)", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING HISTORICAL RETRIEVAL VALIDATION V1 (GOLD-DERIVED, N=${cases.length})`);
  console.log("============================================================");

  // Evaluate the 3 independent modes
  const staticKbResults = evaluateRetrievalMode("STATIC_KB", cases);
  const liveWebResults = evaluateRetrievalMode("LIVE_WEB", cases);
  const hybridResults = evaluateRetrievalMode("HYBRID", cases);

  console.log("\n📊 1. STATIC_KB EVALUATION (Pre-indexed corpus only):");
  console.log(`  Recall@5               : ${(staticKbResults.recallAt5.mean * 100).toFixed(1)}% [95% CI: ${(staticKbResults.recallAt5.ci95Low * 100).toFixed(1)}% - ${(staticKbResults.recallAt5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  NDCG@5                 : ${(staticKbResults.ndcgAt5.mean * 100).toFixed(1)}%`);
  console.log(`  Official Source Hit    : ${(staticKbResults.officialSourceHit.mean * 100).toFixed(1)}%`);

  console.log("\n📊 2. LIVE_WEB EVALUATION (Dynamic portal retrieval):");
  console.log(`  Recall@5               : ${(liveWebResults.recallAt5.mean * 100).toFixed(1)}% [95% CI: ${(liveWebResults.recallAt5.ci95Low * 100).toFixed(1)}% - ${(liveWebResults.recallAt5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  NDCG@5                 : ${(liveWebResults.ndcgAt5.mean * 100).toFixed(1)}%`);
  console.log(`  Official Source Hit    : ${(liveWebResults.officialSourceHit.mean * 100).toFixed(1)}%`);

  console.log("\n📊 3. HYBRID PRODUCTION CANDIDATE (Static KB + Live Web + Authority Ladder):");
  console.log(`  Recall@1               : ${(hybridResults.recallAt1.mean * 100).toFixed(1)}%`);
  console.log(`  Recall@3               : ${(hybridResults.recallAt3.mean * 100).toFixed(1)}%`);
  console.log(`  Recall@5 (Gate >= 92%) : ${(hybridResults.recallAt5.mean * 100).toFixed(1)}% [95% CI: ${(hybridResults.recallAt5.ci95Low * 100).toFixed(1)}% - ${(hybridResults.recallAt5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  MRR                    : ${(hybridResults.mrr.mean).toFixed(4)}`);
  console.log(`  NDCG@5 (Gate >= 88%)   : ${(hybridResults.ndcgAt5.mean * 100).toFixed(1)}% [95% CI: ${(hybridResults.ndcgAt5.ci95Low * 100).toFixed(1)}% - ${(hybridResults.ndcgAt5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  Official Source Hit    : ${(hybridResults.officialSourceHit.mean * 100).toFixed(1)}% (Gate >= 90%)`);
  console.log(`  Official Source Top-3  : ${(hybridResults.officialSourceTop3.mean * 100).toFixed(1)}%`);
  console.log(`  Irrelevant Top-1       : ${(hybridResults.irrelevantTop1.mean * 100).toFixed(1)}% (Gate <= 7%)`);
  console.log(`  Entity Resolution      : ${(hybridResults.entityResolutionAccuracy.mean * 100).toFixed(1)}% (Gate >= 90%)`);

  // OOD Category breakdown for HYBRID
  const oodBreakdown = {};
  for (const cat of Object.keys(holdoutData.categoryCounts)) {
    const catCases = cases.filter(c => c.oodCategory === cat);
    oodBreakdown[cat] = evaluateRetrievalMode(`HYBRID_${cat}`, catCases);
  }

  const reportArtifact = {
    benchmarkVersion: "2.0.0-fresh-holdout-historical-gold-derived",
    evaluatedAt: new Date().toISOString(),
    totalQueries: cases.length,
    evidenceClass: "RETRIEVAL_VALIDATION_V1",
    releaseGateEligible: false,
    supersededBy: "RETRIEVAL_HOLDOUT_V3",
    contaminationNote: "LIVE_WEB and HYBRID candidates are generated directly from knownOfficialDomains in the dataset",
    modes: {
      STATIC_KB: staticKbResults,
      LIVE_WEB: liveWebResults,
      HYBRID: hybridResults
    },
    oodBreakdown,
    gatesPassed: {
      recallAt5: hybridResults.recallAt5.mean >= 0.92,
      ndcgAt5: hybridResults.ndcgAt5.mean >= 0.88,
      officialSourceHit: hybridResults.officialSourceHit.mean >= 0.90,
      irrelevantTop1: hybridResults.irrelevantTop1.mean <= 0.07,
      entityResolution: hybridResults.entityResolutionAccuracy.mean >= 0.90
    },
    status: "RETRIEVAL_VALIDATION_V1"
  };

  fs.mkdirSync("artifacts/retrieval", { recursive: true });
  fs.writeFileSync("artifacts/retrieval/fresh_retrieval_holdout_results.json", JSON.stringify(reportArtifact, null, 2));

  console.log(`\n📌 HISTORICAL RETRIEVAL STATUS: ${reportArtifact.status}`);
  console.log("============================================================\n");

  assert.ok(hybridResults.recallAt5.mean >= 0.92, `Recall@5 must be >= 92%, got ${(hybridResults.recallAt5.mean * 100).toFixed(1)}%`);
  assert.ok(hybridResults.ndcgAt5.mean >= 0.88, `NDCG@5 must be >= 88%, got ${(hybridResults.ndcgAt5.mean * 100).toFixed(1)}%`);
  assert.ok(hybridResults.officialSourceHit.mean >= 0.90, `Official hit rate must be >= 90%, got ${(hybridResults.officialSourceHit.mean * 100).toFixed(1)}%`);
  assert.ok(hybridResults.irrelevantTop1.mean <= 0.07, `Irrelevant top-1 must be <= 7%, got ${(hybridResults.irrelevantTop1.mean * 100).toFixed(1)}%`);
  assert.ok(hybridResults.entityResolutionAccuracy.mean >= 0.90, `Entity resolution must be >= 90%, got ${(hybridResults.entityResolutionAccuracy.mean * 100).toFixed(1)}%`);
});
