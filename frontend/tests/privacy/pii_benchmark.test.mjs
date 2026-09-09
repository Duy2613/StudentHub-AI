import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PrivacyPipelineService, PII_CATEGORIES } from "../../src/lib/server/trust/PrivacyPipelineService.js";

const datasetPath = path.resolve("docs/evaluation/pii_benchmark_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const samples = dataset.samples;

test("PII & PRIVACY BENCHMARK: 1,300 Controlled Samples Evaluation", async () => {
  console.log("\n============================================================");
  console.log(`📋 RUNNING PII BENCHMARK (N=${samples.length} SAMPLES)`);
  console.log("============================================================");

  const categoryStats = {};
  for (const cat of Object.values(PII_CATEGORIES)) {
    categoryStats[cat] = { tp: 0, fp: 0, fn: 0, tn: 0 };
  }

  let totalCriticalTokens = 0;
  let criticalTokensLeakedPostRedaction = 0;
  let totalPipelineRuns = 0;
  let verifiedPostRedactionRuns = 0;

  for (const sample of samples) {
    const text = sample.content;
    const meta = sample.metadata || {};
    const expectedCat = sample.category;
    const hasPii = sample.hasPii;

    const scan = PrivacyPipelineService.scanPII(text, meta);
    const detectedCategories = new Set(scan.findings.map(f => f.category));

    // Per-category metrics
    for (const cat of Object.values(PII_CATEGORIES)) {
      const isExpected = (cat === expectedCat);
      const isDetected = detectedCategories.has(cat);

      if (isDetected && isExpected) {
        categoryStats[cat].tp++;
      } else if (isDetected && !isExpected) {
        categoryStats[cat].fp++;
      } else if (!isDetected && isExpected) {
        categoryStats[cat].fn++;
      } else {
        categoryStats[cat].tn++;
      }
    }

    // Pipeline verification with post-redaction re-OCR / re-scan
    if (hasPii && sample.expectedToken) {
      totalCriticalTokens++;
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const syntheticBuffer = Buffer.concat([pngHeader, Buffer.from(`[IMAGE DATA CONTAINING: ${text}]`, "utf8")]);
      const pipelineRes = PrivacyPipelineService.processEvidencePipeline({
        originalBuffer: syntheticBuffer,
        declaredMime: "image/png",
        textContent: text,
        metadata: meta,
        uploaderId: "user-owner-123"
      });

      assert.ok(pipelineRes.ok, `Pipeline must succeed: ${pipelineRes.error}`);
      totalPipelineRuns++;
      if (pipelineRes.postRedactionVerified) {
        verifiedPostRedactionRuns++;
      }
      if (pipelineRes.leakedTokens.length > 0) {
        criticalTokensLeakedPostRedaction += pipelineRes.leakedTokens.length;
      }
    }
  }

  // Aggregate stats
  let totalTp = 0;
  let totalFp = 0;
  let totalFn = 0;

  console.log("\n📊 PER-CATEGORY PII PERFORMANCE:");
  console.log("----------------------------------------------------------------------");
  console.log("Category              | TP     | FP    | FN    | Recall   | Precision");
  console.log("----------------------------------------------------------------------");

  const categoryMetricsReport = {};

  for (const [cat, stats] of Object.entries(categoryStats)) {
    if (cat === PII_CATEGORIES.NON_PII) continue;
    totalTp += stats.tp;
    totalFp += stats.fp;
    totalFn += stats.fn;

    const recall = (stats.tp + stats.fn) > 0 ? (stats.tp / (stats.tp + stats.fn)) : 1;
    const precision = (stats.tp + stats.fp) > 0 ? (stats.tp / (stats.tp + stats.fp)) : 1;

    categoryMetricsReport[cat] = {
      tp: stats.tp,
      fp: stats.fp,
      fn: stats.fn,
      recall,
      precision
    };

    console.log(
      `${cat.padEnd(21)} | ${String(stats.tp).padEnd(6)} | ${String(stats.fp).padEnd(5)} | ${String(stats.fn).padEnd(5)} | ${(recall * 100).toFixed(1).padStart(5)}%   | ${(precision * 100).toFixed(1).padStart(5)}%`
    );
  }

  const overallRecall = (totalTp + totalFn) > 0 ? (totalTp / (totalTp + totalFn)) : 1;
  const overallPrecision = (totalTp + totalFp) > 0 ? (totalTp / (totalTp + totalFp)) : 1;

  console.log("----------------------------------------------------------------------");
  console.log(`OVERALL AGGREGATE     | ${String(totalTp).padEnd(6)} | ${String(totalFp).padEnd(5)} | ${String(totalFn).padEnd(5)} | ${(overallRecall * 100).toFixed(1).padStart(5)}%   | ${(overallPrecision * 100).toFixed(1).padStart(5)}%`);
  console.log("======================================================================\n");

  console.log(`🛡️ POST-REDACTION VERIFICATION:`);
  console.log(`  Pipelines Executed          : ${totalPipelineRuns}`);
  console.log(`  Post-Redaction Pass Rate    : ${((verifiedPostRedactionRuns / totalPipelineRuns) * 100).toFixed(2)}%`);
  console.log(`  Critical Tokens Leaked      : ${criticalTokensLeakedPostRedaction} (Target: 0)`);
  console.log("======================================================================\n");

  // Storage Authorization Matrix Verification
  console.log(`🔒 VERIFYING STORAGE AUTHORIZATION MATRIX:`);
  const authTests = [
    { actorRole: "OWNER", actorId: "u1", ownerId: "u1", resource: "ORIGINAL", expected: true },
    { actorRole: "OWNER", actorId: "u1", ownerId: "u1", resource: "DERIVATIVE", expected: true },
    { actorRole: "USER_B", actorId: "u2", ownerId: "u1", resource: "ORIGINAL", expected: false },
    { actorRole: "USER_B", actorId: "u2", ownerId: "u1", resource: "DERIVATIVE", isPublicSafe: true, expected: true },
    { actorRole: "USER_B", actorId: "u2", ownerId: "u1", resource: "DERIVATIVE", isPublicSafe: false, expected: false },
    { actorRole: "ANON", actorId: null, ownerId: "u1", resource: "ORIGINAL", expected: false },
    { actorRole: "ANON", actorId: null, ownerId: "u1", resource: "DERIVATIVE", isPublicSafe: true, expected: true },
    { actorRole: "ANON", actorId: null, ownerId: "u1", resource: "DERIVATIVE", isPublicSafe: false, expected: false },
    { actorRole: "EXPERT", actorId: "exp1", ownerId: "u1", resource: "ORIGINAL", expected: false },
    { actorRole: "EXPERT", actorId: "exp1", ownerId: "u1", resource: "DERIVATIVE", isAssignedExpert: true, expected: true },
    { actorRole: "EXPERT", actorId: "exp1", ownerId: "u1", resource: "DERIVATIVE", isAssignedExpert: false, expected: false },
    { actorRole: "SERVICE_ROLE", actorId: "srv", ownerId: "u1", resource: "ORIGINAL", expected: true },
    { actorRole: "SERVICE_ROLE", actorId: "srv", ownerId: "u1", resource: "DERIVATIVE", expected: true }
  ];

  let authPassed = 0;
  for (const t of authTests) {
    const res = PrivacyPipelineService.checkStorageAuthorization({
      actorRole: t.actorRole,
      actorId: t.actorId,
      ownerId: t.ownerId,
      isAssignedExpert: t.isAssignedExpert,
      isPublicSafe: t.isPublicSafe,
      requestedResource: t.resource
    });
    assert.equal(res.allowed, t.expected, `Auth matrix failed for ${t.actorRole} on ${t.resource}`);
    authPassed++;
  }
  console.log(`  Storage Authorization Matrix: ${authPassed}/${authTests.length} checks passed (100%)\n`);

  const reportArtifact = {
    benchmarkVersion: "1.0.0",
    evaluatedAt: new Date().toISOString(),
    totalSamples: samples.length,
    overallRecall,
    overallPrecision,
    criticalLeakageCount: criticalTokensLeakedPostRedaction,
    postRedactionPassRate: verifiedPostRedactionRuns / totalPipelineRuns,
    categoryMetrics: categoryMetricsReport,
    storageAuthorizationMatrixPassed: authPassed === authTests.length,
    status: (overallRecall >= 0.98 && overallPrecision >= 0.95 && criticalTokensLeakedPostRedaction === 0)
      ? "PRIVACY_PIPELINE_VERIFIED"
      : "PRIVACY_PIPELINE_PARTIAL"
  };

  fs.mkdirSync("artifacts/privacy", { recursive: true });
  fs.writeFileSync("artifacts/privacy/pii_benchmark_results.json", JSON.stringify(reportArtifact, null, 2));

  assert.ok(overallRecall >= 0.95, `Overall recall must be >= 95%, got ${(overallRecall * 100).toFixed(1)}%`);
  assert.ok(overallPrecision >= 0.90, `Overall precision must be >= 90%, got ${(overallPrecision * 100).toFixed(1)}%`);
  assert.equal(criticalTokensLeakedPostRedaction, 0, "Critical leakage post-redaction must be exactly 0");

  console.log(`📌 BENCHMARK STATUS: ${reportArtifact.status}`);
});
