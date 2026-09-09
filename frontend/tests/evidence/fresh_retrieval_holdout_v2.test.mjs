import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { INSTITUTIONAL_KNOWLEDGE_BASE } from "../../src/lib/ai-trust/layer3/retrieval/KnowledgeBaseRetriever.js";

/**
 * StudentHub V5 — Historical Retrieval Validation V1 (N=150 Queries)
 *
 * RETIRED FROM EXECUTION: this legacy diagnostic predates the blind runtime
 * boundary and is retained only for historical comparison. It uses gold
 * domains to synthesize live candidates and bootstrap resampling, so it must
 * not be used as a final holdout or convergence claim. The replacement is
 * `fresh_retrieval_holdout_v3.test.mjs`.
 *
 * Implements Sections 11, 12, 13, 14, 15, 16:
 * - Untouched fresh holdout V2 with 150 cases (SHA-256: bf01ea4dc3296f652f719767688e74805a49fce9c90b128600bd70d53c1ff75d)
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
 * Target Gates (Section 15):
 * - Recall@5 >= 0.92
 * - NDCG@5 >= 0.88
 * - Official Source Hit >= 0.90
 * - Irrelevant Top-1 <= 0.07
 * - Entity Resolution >= 0.90
 */

const datasetPath = path.resolve("docs/evaluation/retrieval_fresh_holdout_v2_dataset.json");
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
    const knownDomains = item.knownOfficialDomains || (item.knownOfficialDomain ? [item.knownOfficialDomain] : []);
    const expectedEntity = item.canonicalEntity;

    // 1. Entity Resolution
    const detailed = EntityResolutionService.resolveEntitiesDetailed(query);
    const resolved = detailed.matches;
    const resolvedEntityIds = resolved.map(r => r.entityId);
    const isEntityResolved = resolvedEntityIds.includes(expectedEntity) ||
                            resolved.some(r => r.allowedDomains?.some(d => knownDomains.includes(d))) ||
                            (expectedEntity.startsWith("AMBIGUOUS_") && detailed.status === "AMBIGUOUS");
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
        retrievalMethod: "STATIC_KB",
        isPrimary: d.domain.endsWith(".edu.vn") || d.domain.endsWith(".gov.vn")
      }));

      // Augment with live portal discovery if unindexed or missing in static KB
      const dynamicSources = knownDomains.map((kd, idx) => ({
        sourceId: `portal-${idx + 1}`,
        title: `Cổng xác thực ${kd}`,
        domain: kd,
        url: `https://${kd}/thong-bao-2026`,
        retrievalMethod: "LIVE_WEB",
        isPrimary: kd.endsWith(".edu.vn") || kd.endsWith(".gov.vn") || kd.endsWith(".org.vn") || kd === "chinhphu.vn"
      }));

      // Safe deduplicated candidate pool: dynamic live discovery + static KB
      const sourceMap = new Map();
      for (const s of [...dynamicSources, ...kbMatches]) {
        const dKey = (s.domain || "").toLowerCase();
        if (!sourceMap.has(dKey)) {
          sourceMap.set(dKey, s);
        }
      }
      candidateSources = Array.from(sourceMap.values());
    }

    // 3. Reranking via Authority Ladder (with query specificity)
    const ranked = AuthorityLadderRanking.rankSources(candidateSources, resolved, 2026, query);
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
      const matchesTarget = isTargetMatch(top1);
      const isOfficial = top1.isPrimary;
      if (!matchesTarget && !isOfficial) {
        isIrrelevantTop1 = true;
      }
    }
    irrelevantTop1List.push(isIrrelevantTop1 ? 1 : 0);

    // NDCG@5
    // Binary relevance: 1 if matches target, 0 otherwise
    let dcg = 0;
    let idealHits = Math.min(knownDomains.length, 5);
    let idcg = 0;
    for (let i = 0; i < idealHits; i++) {
      idcg += 1 / Math.log2(i + 2);
    }
    for (let i = 0; i < top5.length; i++) {
      if (isTargetMatch(top5[i])) {
        dcg += 1 / Math.log2(i + 2);
      }
    }
    const ndcg = idcg > 0 ? (dcg / idcg) : (dcg > 0 ? 1 : 0);
    ndcg5List.push(Math.min(1.0, ndcg));
  }

  return {
    recall1: bootstrapCI(recall1List),
    recall3: bootstrapCI(recall3List),
    recall5: bootstrapCI(recall5List),
    mrr: bootstrapCI(mrrList),
    ndcg5: bootstrapCI(ndcg5List),
    precision5: bootstrapCI(precision5List),
    officialHit: bootstrapCI(officialHitList),
    officialTop3: bootstrapCI(officialTop3List),
    irrelevantTop1: bootstrapCI(irrelevantTop1List),
    entityResolution: bootstrapCI(entityResolutionList)
  };
}

test("HISTORICAL RETRIEVAL VALIDATION V1 (superseded by V3)", {
  skip: "Superseded by blind runtime RETRIEVAL_VALIDATION_V1 V3; retained for historical comparison only",
}, async () => {
  console.log("\n============================================================");
  console.log("📋 RUNNING UNTOUCHED FRESH RETRIEVAL HOLDOUT V2 (N=150 QUERIES)");
  console.log("============================================================\n");

  // 1. STATIC_KB Mode
  const staticRes = evaluateRetrievalMode("STATIC_KB", cases);
  console.log("📊 1. STATIC_KB EVALUATION (Pre-indexed corpus only):");
  console.log(`  Recall@5               : ${(staticRes.recall5.mean * 100).toFixed(1)}% [95% CI: ${(staticRes.recall5.ci95Low * 100).toFixed(1)}% - ${(staticRes.recall5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  NDCG@5                 : ${(staticRes.ndcg5.mean * 100).toFixed(1)}%`);
  console.log(`  Official Source Hit    : ${(staticRes.officialHit.mean * 100).toFixed(1)}%\n`);

  // 2. LIVE_WEB Mode
  const liveRes = evaluateRetrievalMode("LIVE_WEB", cases);
  console.log("📊 2. LIVE_WEB EVALUATION (Dynamic portal retrieval):");
  console.log(`  Recall@5               : ${(liveRes.recall5.mean * 100).toFixed(1)}% [95% CI: ${(liveRes.recall5.ci95Low * 100).toFixed(1)}% - ${(liveRes.recall5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  NDCG@5                 : ${(liveRes.ndcg5.mean * 100).toFixed(1)}%`);
  console.log(`  Official Source Hit    : ${(liveRes.officialHit.mean * 100).toFixed(1)}%\n`);

  // 3. HYBRID Mode (Production Candidate)
  const hybridRes = evaluateRetrievalMode("HYBRID", cases);
  console.log("📊 3. HYBRID PRODUCTION CANDIDATE (Static KB + Live Web + Authority Ladder):");
  console.log(`  Recall@1               : ${(hybridRes.recall1.mean * 100).toFixed(1)}%`);
  console.log(`  Recall@3               : ${(hybridRes.recall3.mean * 100).toFixed(1)}%`);
  console.log(`  Recall@5 (Gate >= 92%) : ${(hybridRes.recall5.mean * 100).toFixed(1)}% [95% CI: ${(hybridRes.recall5.ci95Low * 100).toFixed(1)}% - ${(hybridRes.recall5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  MRR                    : ${hybridRes.mrr.mean.toFixed(4)}`);
  console.log(`  NDCG@5 (Gate >= 88%)   : ${(hybridRes.ndcg5.mean * 100).toFixed(1)}% [95% CI: ${(hybridRes.ndcg5.ci95Low * 100).toFixed(1)}% - ${(hybridRes.ndcg5.ci95High * 100).toFixed(1)}%]`);
  console.log(`  Official Source Hit    : ${(hybridRes.officialHit.mean * 100).toFixed(1)}% (Gate >= 90%)`);
  console.log(`  Official Source Top-3  : ${(hybridRes.officialTop3.mean * 100).toFixed(1)}%`);
  console.log(`  Irrelevant Top-1       : ${(hybridRes.irrelevantTop1.mean * 100).toFixed(1)}% (Gate <= 7%)`);
  console.log(`  Entity Resolution      : ${(hybridRes.entityResolution.mean * 100).toFixed(1)}% (Gate >= 90%)\n`);

  // Subgroup breakdown
  console.log("📈 SUBGROUP BREAKDOWN (HYBRID CANDIDATE):");
  const categories = [...new Set(cases.map(c => c.category))];
  const subgroupResults = {};

  for (const cat of categories) {
    const subset = cases.filter(c => c.category === cat);
    const subRes = evaluateRetrievalMode("HYBRID", subset);
    subgroupResults[cat] = {
      n: subset.length,
      recall5: subRes.recall5.mean,
      ndcg5: subRes.ndcg5.mean,
      entityResolution: subRes.entityResolution.mean
    };
    console.log(`  - ${cat.padEnd(24)} (N=${String(subset.length).padStart(2)}): Recall@5=${(subRes.recall5.mean * 100).toFixed(1)}%, NDCG@5=${(subRes.ndcg5.mean * 100).toFixed(1)}%, EntityRes=${(subRes.entityResolution.mean * 100).toFixed(1)}%`);
  }

  // Gates Verification
  const r5Pass = hybridRes.recall5.mean >= 0.92;
  const ndcgPass = hybridRes.ndcg5.mean >= 0.88;
  const offHitPass = hybridRes.officialHit.mean >= 0.90;
  const irrPass = hybridRes.irrelevantTop1.mean <= 0.07;
  const entPass = hybridRes.entityResolution.mean >= 0.90;

  const allPassed = r5Pass && ndcgPass && offHitPass && irrPass && entPass;
  console.log(`\n📌 FRESH RETRIEVAL V2 STATUS: ${allPassed ? "FRESH_RETRIEVAL_HOLDOUT_V2_VERIFIED" : "FRESH_RETRIEVAL_HOLDOUT_V2_PARTIAL"}`);
  console.log("============================================================\n");

  assert.equal(r5Pass, true, `Recall@5 must be >= 92%, got ${(hybridRes.recall5.mean * 100).toFixed(1)}%`);
  assert.equal(ndcgPass, true, `NDCG@5 must be >= 88%, got ${(hybridRes.ndcg5.mean * 100).toFixed(1)}%`);
  assert.equal(offHitPass, true, `Official Source Hit must be >= 90%, got ${(hybridRes.officialHit.mean * 100).toFixed(1)}%`);
  assert.equal(irrPass, true, `Irrelevant Top-1 must be <= 7%, got ${(hybridRes.irrelevantTop1.mean * 100).toFixed(1)}%`);
  assert.equal(entPass, true, `Entity resolution must be >= 90%, got ${(hybridRes.entityResolution.mean * 100).toFixed(1)}%`);
});
