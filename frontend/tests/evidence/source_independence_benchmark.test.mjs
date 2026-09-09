import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EvidenceForensicsService } from "../../src/lib/server/trust/EvidenceForensicsService.js";

const datasetPath = path.resolve("docs/evaluation/source_independence_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const units = dataset.units;

test("SOURCE INDEPENDENCE VALIDATION V1: 60 Reviewed Multi-Source Units", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING SOURCE INDEPENDENCE BENCHMARK (N=${units.length} UNITS)`);
  console.log("============================================================");

  let totalPredictedPairs = 0;
  let truePositivePairs = 0;
  let falsePositivePairs = 0;
  let falseNegativePairs = 0;
  let trueNegativePairs = 0;

  let unitsEvaluated = 0;
  let exactClusterCountMatches = 0;

  for (const unit of units) {
    unitsEvaluated++;
    const sources = unit.sources;
    const goldClusters = unit.goldClusters;

    // Run system under evaluation
    const predictedClusters = EvidenceForensicsService.clusterSources(sources);
    const indepGraph = EvidenceForensicsService.buildIndependenceGraph(sources, predictedClusters);

    // Verify explanation string requirement (e.g. "Đã gộp X bài viết...")
    const syndicatedGroup = indepGraph.find(g => g.syndicationCollapsed);
    if (syndicatedGroup) {
      assert.ok(syndicatedGroup.explanation.includes("Đã gộp"), "Syndicated group explanation must be clear");
    }

    if (predictedClusters.length === unit.expectedIndependentOriginsCount) {
      exactClusterCountMatches++;
    }

    // Build gold pair lookup: (sA, sB) -> are they in the same gold cluster?
    const goldSameOriginPairs = new Set();
    for (const gc of goldClusters) {
      const members = gc.memberSourceIds;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [members[i], members[j]].sort().join("::");
          goldSameOriginPairs.add(key);
        }
      }
    }

    // Build predicted pair lookup: (sA, sB) -> are they in the same predicted cluster?
    const predSameOriginPairs = new Set();
    for (const pc of predictedClusters) {
      const members = pc.members;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [members[i], members[j]].sort().join("::");
          predSameOriginPairs.add(key);
        }
      }
    }

    // All source pairs in this unit
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const pairKey = [sources[i].sourceId, sources[j].sourceId].sort().join("::");
        const isGoldSame = goldSameOriginPairs.has(pairKey);
        const isPredSame = predSameOriginPairs.has(pairKey);

        if (isPredSame && isGoldSame) {
          truePositivePairs++;
          totalPredictedPairs++;
        } else if (isPredSame && !isGoldSame) {
          falsePositivePairs++;
          totalPredictedPairs++;
        } else if (!isPredSame && isGoldSame) {
          falseNegativePairs++;
        } else {
          trueNegativePairs++;
        }
      }
    }
  }

  const precision = totalPredictedPairs > 0 ? (truePositivePairs / (truePositivePairs + falsePositivePairs)) : 1.0;
  const recall = (truePositivePairs + falseNegativePairs) > 0 ? (truePositivePairs / (truePositivePairs + falseNegativePairs)) : 1.0;
  const clusterF1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const totalDistinctPairs = truePositivePairs + falsePositivePairs + falseNegativePairs + trueNegativePairs;
  const falseMergeRate = (falsePositivePairs + trueNegativePairs) > 0 ? (falsePositivePairs / (falsePositivePairs + trueNegativePairs)) : 0;
  const missedSyndicationRate = (truePositivePairs + falseNegativePairs) > 0 ? (falseNegativePairs / (truePositivePairs + falseNegativePairs)) : 0;
  const originAccuracy = exactClusterCountMatches / unitsEvaluated;

  console.log(`\n📊 SOURCE INDEPENDENCE BENCHMARK RESULTS (N=${unitsEvaluated} UNITS):`);
  console.log(`  Same-Origin Precision      : ${(precision * 100).toFixed(1)}%`);
  console.log(`  Same-Origin Recall         : ${(recall * 100).toFixed(1)}%`);
  console.log(`  Cluster F1 Score           : ${(clusterF1 * 100).toFixed(1)}%`);
  console.log(`  False Merge Rate           : ${(falseMergeRate * 100).toFixed(2)}% (Target: < 2.0%)`);
  console.log(`  Missed Syndication Rate    : ${(missedSyndicationRate * 100).toFixed(2)}%`);
  console.log(`  Exact Origin Count Match   : ${(originAccuracy * 100).toFixed(1)}% (${exactClusterCountMatches}/${unitsEvaluated})`);
  console.log("============================================================\n");

  const resultsArtifact = {
    benchmarkVersion: "1.0.0-historical-validation",
    evaluatedAt: new Date().toISOString(),
    totalUnits: unitsEvaluated,
    evidenceClass: "SOURCE_INDEPENDENCE_VALIDATION_V1",
    releaseGateEligible: false,
    supersededBy: "SOURCE_INDEPENDENCE_HOLDOUT_V2",
    pairwiseMetrics: {
      truePositivePairs,
      falsePositivePairs,
      falseNegativePairs,
      trueNegativePairs,
      sameOriginPrecision: precision,
      sameOriginRecall: recall,
      clusterF1,
      falseMergeRate,
      missedSyndicationRate
    },
    exactOriginCountAccuracy: originAccuracy,
    status: "SOURCE_INDEPENDENCE_VALIDATION_V1"
  };

  fs.mkdirSync("artifacts/retrieval", { recursive: true });
  fs.writeFileSync("artifacts/retrieval/source_independence_benchmark_results.json", JSON.stringify(resultsArtifact, null, 2));

  assert.ok(resultsArtifact.pairwiseMetrics.clusterF1 >= 0.85, "Cluster F1 must be >= 85%");
  assert.ok(resultsArtifact.pairwiseMetrics.falseMergeRate <= 0.05, "False merge rate must be <= 5%");
  console.log(`📌 VALIDATION STATUS: ${resultsArtifact.status}`);
});
