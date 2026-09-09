import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EvidenceForensicsService } from "../../src/lib/server/trust/EvidenceForensicsService.js";

/**
 * StudentHub V5 — Historical Source Independence Validation V1 (N=100 Clusters)
 *
 * This inspected set is retained for validation history. It is not the
 * untouched final holdout; the canonical release evidence is V2.
 *
 * Implements Sections 17, 18:
 * - 100 fresh multi-source challenge units:
 *   - VERBATIM_SYNDICATION (15)
 *   - LIGHT_REWRITES (15)
 *   - TRANSLATION (10)
 *   - WIRE_SERVICE_ATTRIBUTION (15)
 *   - PRESS_RELEASE_MIRRORS (15)
 *   - SAME_EVENT_INDEPENDENT (15)
 *   - SAME_DOMAIN_DIFFERENT_DOCS (10)
 *   - CROSS_DOMAIN_COPIED (5)
 * - Measures:
 *   - Same-Origin Precision, Recall, F1
 *   - False Merge Rate
 *   - False Split Rate
 *   - Exact Independent-Origin Count Accuracy
 *
 * Targets (Section 18):
 * - F1 >= 0.93
 * - False Merge <= 2.0%
 * - Origin-Count Accuracy >= 92.0%
 */

const datasetPath = path.resolve("docs/evaluation/source_independence_fresh_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const clusters = dataset.clusters;

test("HISTORICAL SOURCE INDEPENDENCE VALIDATION V1 (N=100 UNITS)", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING HISTORICAL SOURCE INDEPENDENCE VALIDATION V1 (N=${clusters.length} UNITS)`);
  console.log("============================================================\n");

  let totalPredictedPairs = 0;
  let truePositivePairs = 0;
  let falsePositivePairs = 0;
  let falseNegativePairs = 0;
  let trueNegativePairs = 0;

  let unitsEvaluated = 0;
  let exactCountMatches = 0;

  const typeBreakdown = {};

  for (const unit of clusters) {
    unitsEvaluated++;
    const sources = unit.sources.map(s => ({
      ...s,
      content: s.text
    }));
    const expectedOriginCount = unit.trueOriginCount;
    const challengeType = unit.challengeType;

    if (!typeBreakdown[challengeType]) {
      typeBreakdown[challengeType] = { count: 0, exactMatches: 0 };
    }
    typeBreakdown[challengeType].count++;

    // Run clustering engine
    const predictedClusters = EvidenceForensicsService.clusterSources(sources);

    if (predictedClusters.length === expectedOriginCount) {
      exactCountMatches++;
      typeBreakdown[challengeType].exactMatches++;
    }

    // Build gold pair lookup for unit
    // If trueOriginCount === 1, all sources belong to same origin!
    // If trueOriginCount === sources.length, all sources are independent!
    // If sources have claimedOrigin, sources with matching claimedOrigin are same-origin.
    const goldSameOriginPairs = new Set();
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const sA = sources[i];
        const sB = sources[j];
        const key = [sA.sourceId, sB.sourceId].sort().join("::");

        let isSame = false;
        if (expectedOriginCount === 1) {
          isSame = true;
        } else if (expectedOriginCount === sources.length) {
          isSame = false;
        } else {
          // If claimedOrigin is identical, they are same origin
          if (sA.claimedOrigin && sB.claimedOrigin && sA.claimedOrigin === sB.claimedOrigin) {
            isSame = true;
          }
        }

        if (isSame) {
          goldSameOriginPairs.add(key);
        }
      }
    }

    // Build predicted pair lookup
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

    // Evaluate all pairs in this unit
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
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falseMergeRate = (falsePositivePairs + trueNegativePairs) > 0 ? (falsePositivePairs / (falsePositivePairs + trueNegativePairs)) : 0;
  const falseSplitRate = (truePositivePairs + falseNegativePairs) > 0 ? (falseNegativePairs / (truePositivePairs + falseNegativePairs)) : 0;
  const originAccuracy = exactCountMatches / unitsEvaluated;

  console.log("📊 OVERALL SOURCE INDEPENDENCE METRICS:");
  console.log(`  Units Evaluated            : ${unitsEvaluated}`);
  console.log(`  Exact Count Accuracy       : ${(originAccuracy * 100).toFixed(1)}% (Gate >= 92.0%)`);
  console.log(`  Same-Origin Precision      : ${(precision * 100).toFixed(1)}%`);
  console.log(`  Same-Origin Recall         : ${(recall * 100).toFixed(1)}%`);
  console.log(`  Same-Origin F1             : ${(f1 * 100).toFixed(1)}% (Gate >= 93.0%)`);
  console.log(`  False Merge Rate           : ${(falseMergeRate * 100).toFixed(2)}% (Gate <= 2.0%)`);
  console.log(`  False Split Rate           : ${(falseSplitRate * 100).toFixed(2)}%\n`);

  console.log("📈 CHALLENGE TYPE BREAKDOWN:");
  for (const [t, data] of Object.entries(typeBreakdown)) {
    console.log(`  - ${t.padEnd(28)} (N=${String(data.count).padStart(2)}): Accuracy=${(data.exactMatches * 100 / data.count).toFixed(1)}%`);
  }

  const f1Pass = f1 >= 0.93;
  const mergePass = falseMergeRate <= 0.02;
  const accPass = originAccuracy >= 0.92;

  const allPassed = f1Pass && mergePass && accPass;
  console.log(`\n📌 SOURCE INDEPENDENCE STATUS: ${allPassed ? "SOURCE_INDEPENDENCE_VALIDATION_V1" : "SOURCE_INDEPENDENCE_VALIDATION_V1_PARTIAL"}`);
  console.log("============================================================\n");

  assert.equal(f1Pass, true, `F1 must be >= 93.0%, got ${(f1 * 100).toFixed(1)}%`);
  assert.equal(mergePass, true, `False merge rate must be <= 2.0%, got ${(falseMergeRate * 100).toFixed(2)}%`);
  assert.equal(accPass, true, `Origin-count accuracy must be >= 92.0%, got ${(originAccuracy * 100).toFixed(1)}%`);
});
