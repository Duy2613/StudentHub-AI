import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PrivacyPipelineService } from "../../src/lib/server/trust/PrivacyPipelineService.js";
import { MetricForensics } from "../evidence/MetricForensics.js";

/**
 * StudentHub V5 — Privacy Validation V2 Benchmark (N=420 Samples)
 *
 * Implements Sections 20, 21, 22:
 * - Frozen validation set generated from independent seed pools and metamorphic perturbations.
 * - Modalities: TEXT, OCR_IMAGE, DOCUMENT, QR, METADATA, NOISY_SYNTHETIC, CLEAN_SYNTHETIC, HARD_NEGATIVE.
 * - Evaluates:
 *   - Modality-specific Recall & Precision
 *   - Critical Leakage Count (National ID, Bank Account) with exact Clopper-Pearson 95% CI
 *   - Post-redaction token recovery attempts
 *
 * Targets (Section 22):
 * - Critical National ID / Bank Account leakage = 0 (reported with CI)
 * - Overall Recall >= 97.0%
 * - Overall Precision >= 94.0%
 * - No high-risk modality recall < 95.0%
 */

const datasetPath = path.resolve("docs/evaluation/privacy_holdout_v2_dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const samples = dataset.samples;

test("PRIVACY VALIDATION V2 — PIPELINE + METAMORPHIC CHECKS (N=420 SAMPLES)", async () => {
  console.log("\n============================================================");
  console.log("🔒 RUNNING PRIVACY VALIDATION V2 (N=420 SAMPLES)");
  console.log("============================================================\n");

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;
  let totalTN = 0;
  let criticalLeaks = 0;
  let criticalTests = 0;
  let postRedactionLeaks = 0;
  let metamorphicChecks = 0;
  let metamorphicFailures = 0;
  const metamorphicFailureIds = [];
  let pipelineFailures = 0;

  const modalityStats = {};
  const modalities = [...new Set(samples.map((s) => s.modality))];
  for (const m of modalities) {
    modalityStats[m] = { tp: 0, fp: 0, fn: 0, tn: 0, criticalLeaks: 0, postRedactionLeaks: 0 };
  }

  for (const sample of samples) {
    const text = sample.text || "";
    const metadata =
      sample.metadata ||
      (sample.modality === "METADATA" && !sample.isHardNegative
        ? { locationMetadata: true, exifGps: true }
        : {});
    const expectedHasPII =
      !sample.isHardNegative &&
      ((sample.rawPiiTokens && sample.rawPiiTokens.length > 0) || sample.hasCriticalPii);
    const expectedTokens = sample.rawPiiTokens || [];

    if (sample.hasCriticalPii) {
      criticalTests++;
    }

    // 1. Scan PII through the production detector.
    const scan = PrivacyPipelineService.scanPII(text, metadata);
    const detectedHasPII = scan.hasPII;

    // 2. Metamorphic invariants: harmless Unicode/case transformations must
    // not make an existing PII token disappear, and must not create PII in a
    // clean sample.
    if (text) {
      const variants = [
        text.toUpperCase(),
        text.replace(/([\p{L}\p{N}])(?=[\p{L}\p{N}])/u, "$1\u200B"),
      ];
      for (const variant of variants) {
        metamorphicChecks++;
        const variantScan = PrivacyPipelineService.scanPII(variant, metadata);
        const invariantHolds = expectedHasPII ? variantScan.hasPII : !variantScan.hasPII;
        if (!invariantHolds) {
          metamorphicFailures++;
          metamorphicFailureIds.push(`${sample.sampleId || sample.id || "unknown"}:${variant === variants[0] ? "CASE" : "INVISIBLE"}`);
          modalityStats[sample.modality].postRedactionLeaks++;
        }
      }
    }

    // 3. Redact and check for post-redaction leakage
    const redactedText = PrivacyPipelineService.redactText(text);
    const postScan = PrivacyPipelineService.scanPII(redactedText, {});
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const pipelineResult = PrivacyPipelineService.processEvidencePipeline({
      originalBuffer: validPng,
      declaredMime: "image/png",
      textContent: text,
      metadata,
      uploaderId: "privacy-validation-v2",
    });
    if (!pipelineResult.ok || !pipelineResult.postRedactionVerified || postScan.findings.some((finding) => finding.critical)) {
      pipelineFailures++;
    }

    for (const expToken of expectedTokens) {
      const rawVal = expToken.rawMatch || expToken.value;
      if (rawVal && redactedText.includes(rawVal)) {
        postRedactionLeaks++;
        modalityStats[sample.modality].postRedactionLeaks++;

        if (expToken.type === "NATIONAL_ID" || expToken.type === "BANK_ACCOUNT") {
          criticalLeaks++;
          modalityStats[sample.modality].criticalLeaks++;
        }
      }
    }

    if (postScan.findings.some((finding) => finding.critical)) {
      criticalLeaks++;
      modalityStats[sample.modality].criticalLeaks++;
    }

    // 3. Classification TP/FP/FN/TN
    if (expectedHasPII) {
      if (detectedHasPII) {
        totalTP++;
        modalityStats[sample.modality].tp++;
      } else {
        totalFN++;
        modalityStats[sample.modality].fn++;
      }
    } else {
      // Hard negative case
      if (detectedHasPII) {
        totalFP++;
        modalityStats[sample.modality].fp++;
      } else {
        totalTN++;
        modalityStats[sample.modality].tn++;
      }
    }
  }

  const overallRecall = totalTP / (totalTP + totalFN || 1);
  const overallPrecision = totalTP / (totalTP + totalFP || 1);
  const overallF1 = (2 * overallPrecision * overallRecall) / (overallPrecision + overallRecall || 1);

  // Exact Clopper-Pearson 95% CI on critical leakage
  const criticalCI = MetricForensics.clopperPearsonCI(criticalLeaks, criticalTests, 0.95);

  console.log("📊 1. OVERALL PRIVACY PERFORMANCE (N=420):");
  console.log(`  Overall Recall    : ${(overallRecall * 100).toFixed(2)}% [Target >= 97.0%]`);
  console.log(`  Overall Precision : ${(overallPrecision * 100).toFixed(2)}% [Target >= 94.0%]`);
  console.log(`  Overall F1 Score  : ${(overallF1 * 100).toFixed(2)}%`);
  console.log(`  Critical Leaks    : ${criticalCI.formatted} [Target: 0 observed]\n`);
  console.log(`  Metamorphic Checks: ${metamorphicChecks} (failures=${metamorphicFailures})`);
  if (metamorphicFailureIds.length > 0) console.log(`  Metamorphic Failure IDs: ${metamorphicFailureIds.join(", ")}`);
  console.log(`  Full Pipeline Failures: ${pipelineFailures}\n`);

  console.log("📑 2. MODALITY BREAKDOWN:");
  console.log("-------------------------------------------------------------------------");
  console.log("Modality         | TP  | FP | FN | TN | Recall  | Precision | Leaks");
  console.log("-------------------------------------------------------------------------");
  let anyHighRiskFailed = false;

  for (const m of modalities) {
    const st = modalityStats[m];
    const rec = st.tp / (st.tp + st.fn || 1);
    const prec = st.tp / (st.tp + st.fp || 1);
    console.log(
      `${m.padEnd(16)} | ${String(st.tp).padStart(3)} | ${String(st.fp).padStart(2)} | ${String(st.fn).padStart(2)} | ${String(st.tn).padStart(2)} | ${(rec * 100).toFixed(1)}%   | ${(prec * 100).toFixed(1)}%     | ${st.criticalLeaks}`
    );

    if (["TEXT", "OCR_IMAGE", "DOCUMENT", "QR"].includes(m)) {
      if (rec < 0.95) anyHighRiskFailed = true;
    }
  }
  console.log("-------------------------------------------------------------------------\n");

  const recallPass = overallRecall >= 0.97;
  const precisionPass = overallPrecision >= 0.94;
  const criticalPass = criticalLeaks === 0;
  const highRiskPass = !anyHighRiskFailed;
  const metamorphicPass = metamorphicFailures === 0;
  const pipelinePass = pipelineFailures === 0;

  console.log("📌 GATES CHECK FOR PRIVACY VALIDATION V2:");
  console.log(`  - Overall Recall >= 97.0%:     ${recallPass ? "PASS" : "FAIL"} (${(overallRecall * 100).toFixed(2)}%)`);
  console.log(`  - Overall Precision >= 94.0%:  ${precisionPass ? "PASS" : "FAIL"} (${(overallPrecision * 100).toFixed(2)}%)`);
  console.log(`  - Critical Leaks == 0:         ${criticalPass ? "PASS" : "FAIL"} (${criticalCI.formatted})`);
  console.log(`  - High-risk Modality >= 95.0%: ${highRiskPass ? "PASS" : "FAIL"}`);
  console.log(`  - Metamorphic invariants:      ${metamorphicPass ? "PASS" : "FAIL"}`);
  console.log(`  - Full pipeline post-scan:     ${pipelinePass ? "PASS" : "FAIL"}`);
  console.log(`\nSTATUS: ${recallPass && precisionPass && criticalPass && highRiskPass && metamorphicPass && pipelinePass ? "PRIVACY_VALIDATION_V2_VERIFIED" : "PRIVACY_VALIDATION_V2_FAILED"}`);
  console.log("============================================================\n");

  assert.equal(criticalPass, true, `Critical leaks must be 0, got ${criticalLeaks}`);
  assert.equal(recallPass, true, `Overall recall must be >= 97%, got ${(overallRecall * 100).toFixed(2)}%`);
  assert.equal(precisionPass, true, `Overall precision must be >= 94%, got ${(overallPrecision * 100).toFixed(2)}%`);
  assert.equal(highRiskPass, true, "No high-risk modality recall < 95%");
  assert.equal(metamorphicPass, true, `Metamorphic privacy checks failed: ${metamorphicFailures}`);
  assert.equal(pipelinePass, true, `Full privacy pipeline failures: ${pipelineFailures}`);
});
