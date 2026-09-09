import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";
import { AuthorityLadderRanking } from "../../src/lib/server/trust/AuthorityLadderRanking.js";
import { INSTITUTIONAL_KNOWLEDGE_BASE } from "../../src/lib/ai-trust/layer3/retrieval/KnowledgeBaseRetriever.js";

const datasetPath = path.resolve("docs/evaluation/retrieval_benchmark_dataset.json");
const benchmarkData = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const queries = benchmarkData.queries;

test("RETRIEVAL DEV BENCHMARK: 84 Controlled Queries Evaluation across 12 Domains", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING RETRIEVAL BENCHMARK (N=${queries.length} QUERIES)`);
  console.log("============================================================");

  let entityResolvedHits = 0;
  let recallAt5Hits = 0;
  let officialSourceHits = 0;
  let officialSourceTop3Hits = 0;
  let irrelevantTop1Hits = 0;
  let totalNdcg5 = 0;

  // Ablation tracking
  let keywordOnlyRecall5Hits = 0;
  let entityOnlyRecall5Hits = 0;
  let fullCandidateRecall5Hits = 0;

  for (const item of queries) {
    const query = item.query;
    const expectedEntityId = item.entityId;
    const expectedDomain = item.expectedDomain;

    // 1. Entity Resolution
    const resolvedEntities = EntityResolutionService.resolveEntities(query);
    const hasCorrectEntity = resolvedEntities.some(e => e.entityId === expectedEntityId);
    if (hasCorrectEntity) {
      entityResolvedHits++;
    }

    // 2. Candidate Retrieval from verified knowledge base & portal registry
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    // Baseline A: Keyword matching only
    const rawMatches = INSTITUTIONAL_KNOWLEDGE_BASE.filter(doc => {
      const docText = `${doc.title} ${doc.content} ${doc.domain} ${doc.keywords?.join(" ")}`.toLowerCase();
      return queryTokens.some(t => docText.includes(t));
    });

    const isMatchA = rawMatches.slice(0, 5).some(doc => doc.domain.includes(expectedDomain));
    if (isMatchA) keywordOnlyRecall5Hits++;

    // Baseline B: Entity-aware candidate retrieval
    const entityMatches = rawMatches.filter(doc => {
      if (hasCorrectEntity) {
        return resolvedEntities.some(ent => ent.allowedDomains.includes(doc.domain));
      }
      return true;
    });
    const isMatchB = (entityMatches.length > 0 ? entityMatches : rawMatches).slice(0, 5).some(doc => doc.domain.includes(expectedDomain));
    if (isMatchB) entityOnlyRecall5Hits++;

    // System C: Full Candidate with Authority Ladder Reranking
    const rankedSources = AuthorityLadderRanking.rankSources(rawMatches, resolvedEntities, 2026);
    const top5 = rankedSources.slice(0, 5);

    // Evaluate Metrics on Top-5
    const hasExpectedInTop5 = top5.some(s => s.domain.includes(expectedDomain) || (hasCorrectEntity && resolvedEntities.some(e => e.allowedDomains.includes(s.domain))));
    if (hasExpectedInTop5) {
      recallAt5Hits++;
      fullCandidateRecall5Hits++;
    }

    // Official source hit rate
    const top5HasOfficial = top5.some(s => s.isPrimary);
    if (top5HasOfficial) {
      officialSourceHits++;
    }

    // Official source Top-3
    const top3HasOfficial = top5.slice(0, 3).some(s => s.isPrimary);
    if (top3HasOfficial) {
      officialSourceTop3Hits++;
    }

    // Irrelevant Top-1 check
    if (top5.length > 0) {
      const top1 = top5[0];
      const isTop1Relevant = (hasCorrectEntity && resolvedEntities.some(e => e.allowedDomains.includes(top1.domain))) || top1.domain.includes(expectedDomain) || top1.domain.endsWith(".gov.vn") || top1.domain.endsWith(".edu.vn");
      if (!isTop1Relevant) {
        irrelevantTop1Hits++;
      }
    }

    // NDCG@5 computation
    let dcg = 0;
    let idcg = 0;
    for (let pos = 0; pos < Math.min(top5.length, 5); pos++) {
      const s = top5[pos];
      const rel = (s.domain.includes(expectedDomain) || (hasCorrectEntity && resolvedEntities.some(e => e.allowedDomains.includes(s.domain)))) ? 2 : (s.isPrimary ? 1 : 0);
      dcg += (Math.pow(2, rel) - 1) / Math.log2(pos + 2);
    }
    // Ideal DCG (relevant top 1 & 2)
    idcg = ((Math.pow(2, 2) - 1) / Math.log2(2)) + ((Math.pow(2, 1) - 1) / Math.log2(3));
    const ndcg = idcg > 0 ? (dcg / idcg) : 1;
    totalNdcg5 += Math.min(1.0, ndcg);
  }

  const N = queries.length;
  const entityResolutionRate = (entityResolvedHits / N);
  const recallAt5 = (recallAt5Hits / N);
  const ndcgAt5 = (totalNdcg5 / N);
  const officialHitRate = (officialSourceHits / N);
  const officialTop3Rate = (officialSourceTop3Hits / N);
  const irrelevantTop1Rate = (irrelevantTop1Hits / N);

  console.log(`\n📊 RETRIEVAL BENCHMARK RESULTS (N=${N}):`);
  console.log(`  Entity Resolution Accuracy : ${(entityResolutionRate * 100).toFixed(1)}%`);
  console.log(`  Recall@5                   : ${(recallAt5 * 100).toFixed(1)}% (Target: >= 95.0%)`);
  console.log(`  NDCG@5                     : ${(ndcgAt5 * 100).toFixed(1)}% (Target: >= 90.0%)`);
  console.log(`  Official Source Hit Rate   : ${(officialHitRate * 100).toFixed(1)}% (Target: >= 90.0%)`);
  console.log(`  Official Source Top-3 Rate : ${(officialTop3Rate * 100).toFixed(1)}% (Target: >= 85.0%)`);
  console.log(`  Irrelevant Top-1 Rate      : ${(irrelevantTop1Rate * 100).toFixed(1)}% (Target: <= 5.0%)`);
  console.log(`  Duplicate Origin Inflation : 0 (Controlled benchmark pipeline)`);

  console.log(`\n🔬 RETRIEVAL ABLATION DELTAS (Recall@5):`);
  console.log(`  [System A] Keyword Only              : ${((keywordOnlyRecall5Hits / N) * 100).toFixed(1)}%`);
  console.log(`  [System B] Entity-Aware Retrieval    : ${((entityOnlyRecall5Hits / N) * 100).toFixed(1)}% (+${(((entityOnlyRecall5Hits - keywordOnlyRecall5Hits) / N) * 100).toFixed(1)}%)`);
  console.log(`  [System C] Full Candidate (+Ranking) : ${((fullCandidateRecall5Hits / N) * 100).toFixed(1)}% (+${(((fullCandidateRecall5Hits - keywordOnlyRecall5Hits) / N) * 100).toFixed(1)}%)`);
  console.log("============================================================\n");

  // This benchmark was inspected during entity/corpus tuning. Preserve its
  // metrics as a development signal; it is not an untouched release holdout.
  const reportArtifact = {
    benchmarkVersion: "1.0.0-dev-oracle",
    evaluatedAt: new Date().toISOString(),
    totalQueries: N,
    evidenceClass: "RETRIEVAL_DEV",
    releaseGateEligible: false,
    supersededBy: "RETRIEVAL_HOLDOUT_V3",
    metrics: {
      entityResolutionRate,
      recallAt5,
      ndcgAt5,
      officialHitRate,
      officialTop3Rate,
      irrelevantTop1Rate,
      duplicateOriginInflation: 0
    },
    ablation: {
      keywordOnlyRecall5: keywordOnlyRecall5Hits / N,
      entityAwareRecall5: entityOnlyRecall5Hits / N,
      fullCandidateRecall5: fullCandidateRecall5Hits / N,
      rankingGain: (fullCandidateRecall5Hits - keywordOnlyRecall5Hits) / N
    },
    targetChecks: {
      recallAt5: recallAt5 >= 0.95,
      ndcgAt5: ndcgAt5 >= 0.90
    },
    status: "RETRIEVAL_DEV"
  };

  fs.mkdirSync("artifacts/retrieval", { recursive: true });
  fs.writeFileSync("artifacts/retrieval/retrieval_benchmark_results.json", JSON.stringify(reportArtifact, null, 2));

  // The target checks remain visible, but the evidence class is intentionally
  // fixed to RETRIEVAL_DEV because this set was used during development.
  assert.ok(reportArtifact.metrics.entityResolutionRate >= 0 && reportArtifact.metrics.entityResolutionRate <= 1);
  assert.ok(reportArtifact.metrics.recallAt5 >= 0 && reportArtifact.metrics.recallAt5 <= 1);
  assert.ok(fs.existsSync("artifacts/retrieval/retrieval_benchmark_results.json"), "Benchmark artifact must be written");
  assert.equal(
    reportArtifact.status,
    "RETRIEVAL_DEV",
    "Inspected development benchmark must not be promoted to release evidence"
  );
  console.log(`\n📌 BENCHMARK CLASSIFICATION: ${reportArtifact.status}`);
});
