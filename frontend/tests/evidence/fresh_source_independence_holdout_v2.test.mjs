import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { EvidenceForensicsService } from "../../src/lib/server/trust/EvidenceForensicsService.js";
import { MetricForensics } from "./MetricForensics.js";

/**
 * StudentHub V5 — Source Independence Validation V2 (N=150 Clusters)
 *
 * Implements Sections 26, 27:
 * - 150 fresh multi-source challenge units:
 *   - WIRE_COPY_CHAIN
 *   - TRANSLATION_REPOST
 *   - PARTIAL_REWRITE_PARAPHRASE
 *   - SAME_PRIMARY_SOURCE_CHAIN
 *   - INDEPENDENT_INVESTIGATION_SAME_EVENT
 *   - SAME_DOMAIN_DISTINCT_OFFICIAL_DOCS
 *   - CROSS_DOMAIN_MIRROR
 *   - PRESS_RELEASE_SYNDICATION
 * - Measures:
 *   - Same-Origin Precision, Recall, F1
 *   - False Merge Rate (aggregating distinct origins together)
 *   - False Split Rate (failing to cluster syndication copies)
 *   - Exact Independent-Origin Count Accuracy
 *
 * Targets (Section 27):
 * - F1 >= 0.93
 * - False Merge <= 2.0%
 * - Origin-Count Accuracy >= 90.0%
 */

const datasetPath = path.resolve("docs/evaluation/source_independence_holdout_v2_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const clusters = dataset.clusters;

test("SOURCE INDEPENDENCE VALIDATION V2 — BLIND ORIGIN FEATURES (N=150 CLUSTERS)", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING SOURCE INDEPENDENCE VALIDATION V2 (N=${clusters.length} CLUSTERS)`);
  console.log("============================================================\n");

  let truePositivePairs = 0;
  let falsePositivePairs = 0;
  let falseNegativePairs = 0;
  let trueNegativePairs = 0;

  let unitsEvaluated = 0;
  let exactCountMatches = 0;

  const typeBreakdown = {};

  for (const unit of clusters) {
    unitsEvaluated++;
    // Gold origin metadata is retained in `unit` for scoring only. The
    // production clustering input is intentionally blind to claimedOrigin,
    // clusterId and true-origin fields; it receives only observable source
    // content/identity fields and a digest computed from that content.
    const goldSources = unit.sources;
    const sources = goldSources.map((s) => {
      const content = String(s.text || s.content || s.snippet || "");
      return {
        sourceId: s.sourceId,
        domain: s.domain,
        publisher: s.publisher,
        title: s.title,
        content,
        snippet: content,
        contentDigest: crypto.createHash("sha256").update(content, "utf8").digest("hex"),
      };
    });
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
    const goldSameOriginPairs = new Set();
    for (let i = 0; i < goldSources.length; i++) {
      for (let j = i + 1; j < goldSources.length; j++) {
        const s1 = goldSources[i];
        const s2 = goldSources[j];

        if (expectedOriginCount === 1) {
          goldSameOriginPairs.add(`${s1.sourceId}::${s2.sourceId}`);
        } else if (expectedOriginCount === sources.length) {
          // completely distinct
        } else if (s1.claimedOrigin && s2.claimedOrigin && s1.claimedOrigin === s2.claimedOrigin) {
          goldSameOriginPairs.add(`${s1.sourceId}::${s2.sourceId}`);
        }
      }
    }

    // Build predicted pair lookup from engine output
    const predictedSameOriginPairs = new Set();
    for (const cl of predictedClusters) {
      const members = cl.members || [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const idA = members[i];
          const idB = members[j];
          const pairKey = [idA, idB].sort().join("::");
          predictedSameOriginPairs.add(pairKey);
        }
      }
    }

    // Evaluate all pairs in unit
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const pKey = [sources[i].sourceId, sources[j].sourceId].sort().join("::");
        const isGoldSame = goldSameOriginPairs.has(pKey);
        const isPredSame = predictedSameOriginPairs.has(pKey);

        if (isGoldSame && isPredSame) truePositivePairs++;
        else if (!isGoldSame && isPredSame) falsePositivePairs++;
        else if (isGoldSame && !isPredSame) falseNegativePairs++;
        else if (!isGoldSame && !isPredSame) trueNegativePairs++;
      }
    }
  }

  const precision = truePositivePairs / (truePositivePairs + falsePositivePairs || 1);
  const recall = truePositivePairs / (truePositivePairs + falseNegativePairs || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);

  const totalDistinctPairs = falsePositivePairs + trueNegativePairs;
  const falseMergeRate = totalDistinctPairs > 0 ? falsePositivePairs / totalDistinctPairs : 0;

  const totalSameOriginPairs = truePositivePairs + falseNegativePairs;
  const falseSplitRate = totalSameOriginPairs > 0 ? falseNegativePairs / totalSameOriginPairs : 0;

  const originCountAccuracy = exactCountMatches / unitsEvaluated;

  console.log("📊 1. CLUSTERING PAIRWISE METRICS (N=150):");
  console.log(`  Pairwise Precision : ${(precision * 100).toFixed(2)}%`);
  console.log(`  Pairwise Recall    : ${(recall * 100).toFixed(2)}%`);
  console.log(`  Pairwise F1 Score  : ${(f1 * 100).toFixed(2)}% [Target >= 93.0%]`);
  console.log(`  False Merge Rate   : ${(falseMergeRate * 100).toFixed(2)}% [Target <= 2.0%]`);
  console.log(`  False Split Rate   : ${(falseSplitRate * 100).toFixed(2)}%\n`);

  console.log("🎯 2. ORIGIN COUNT ACCURACY:");
  console.log(`  Exact Origin Count Matches : ${exactCountMatches} / ${unitsEvaluated} (${(originCountAccuracy * 100).toFixed(2)}%) [Target >= 90.0%]\n`);

  console.log("📑 3. BREAKDOWN BY CHALLENGE TYPE:");
  console.log("--------------------------------------------------------------------------------");
  console.log("Challenge Type                       | Units | Exact Matches | Accuracy");
  console.log("--------------------------------------------------------------------------------");
  for (const [t, st] of Object.entries(typeBreakdown)) {
    const acc = (st.exactMatches / st.count) * 100;
    console.log(`${t.padEnd(36)} | ${String(st.count).padStart(5)} | ${String(st.exactMatches).padStart(13)} | ${acc.toFixed(1)}%`);
  }
  console.log("--------------------------------------------------------------------------------\n");

  const f1Pass = f1 >= 0.93;
  const falseMergePass = falseMergeRate <= 0.02;
  const countAccPass = originCountAccuracy >= 0.90;

  console.log("📌 GATES CHECK FOR SOURCE INDEPENDENCE VALIDATION V2:");
  console.log(`  - F1 Score >= 93.0%:             ${f1Pass ? "PASS" : "FAIL"} (${(f1 * 100).toFixed(2)}%)`);
  console.log(`  - False Merge Rate <= 2.0%:      ${falseMergePass ? "PASS" : "FAIL"} (${(falseMergeRate * 100).toFixed(2)}%)`);
  console.log(`  - Origin Count Acc >= 90.0%:     ${countAccPass ? "PASS" : "FAIL"} (${(originCountAccuracy * 100).toFixed(2)}%)`);
  console.log(`\nSTATUS: ${f1Pass && falseMergePass && countAccPass ? "SOURCE_INDEPENDENCE_VALIDATION_V2_VERIFIED" : "SOURCE_INDEPENDENCE_VALIDATION_V2_FAILED"}`);
  console.log("============================================================\n");

  assert.equal(f1Pass, true, `F1 must be >= 93%, got ${(f1 * 100).toFixed(2)}%`);
  assert.equal(falseMergePass, true, `False merge must be <= 2%, got ${(falseMergeRate * 100).toFixed(2)}%`);
  assert.equal(countAccPass, true, `Origin count accuracy must be >= 90%, got ${(originCountAccuracy * 100).toFixed(2)}%`);
});
