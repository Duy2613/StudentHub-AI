/**
 * Layer 3 — Comprehensive Automated Test Suite
 * 
 * Verifies all 8 core Layer 3 specifications:
 * 1. Case A — Strong Official Evidence (local fixture; PARTIAL until live retrieval)
 * 2. Case B — No Reliable Evidence Found (INSUFFICIENT_EVIDENCE, NEVER FALSE!)
 * 3. Case C — Contradictory Evidence (CONTESTED with conflict package)
 * 4. Case D — Old / Outdated Evidence (OUTDATED / INSUFFICIENT)
 * 5. Case E — Copied / Syndicated Sources (Clustered into 1 evidence lineage)
 * 6. Case F — Partial Support / Overstatement (PARTIALLY_SUPPORTED)
 * 7. Case G — SSRF & Fetch Safety (Blocks private IPs and cloud metadata)
 * 8. Case H — Provider Fallback Resilience
 */

import { Layer3EvidenceService } from "../../src/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { WebSearchRetriever } from "../../src/lib/ai-trust/layer3/retrieval/WebSearchRetriever.js";
import { LAYER_3_STATUS, CLAIM_EVIDENCE_RELATION } from "../../src/lib/ai-trust/layer3/types.js";

export const LAYER_3_TEST_CASES = [
  {
    id: "case-a-strong-official",
    name: "Case A: Strong Official Evidence — HCMUTE Tuition Policy 2026",
    claims: [
      {
        claimId: "claim-policy-1",
        subject: "HCMUTE",
        predicate: "điều chỉnh học phí",
        time: "2026",
        rawText: "Trường Đại học Sư phạm Kỹ thuật TP.HCM chính thức điều chỉnh học phí cho năm học 2026.",
      },
    ],
    candidateSources: [{ officialDomains: ["hcmute.edu.vn"] }],
    expectedStatus: LAYER_3_STATUS.PARTIAL,
    expectedClaimStatus: "SUPPORTED",
  },
  {
    id: "case-b-no-evidence",
    name: "Case B: No Evidence Found — Secret Scholarship Claim",
    claims: [
      {
        claimId: "claim-secret-1",
        subject: "HCMUTE",
        predicate: "bí mật tặng 1 tỷ đồng tiền mặt không công khai",
        time: "2026",
        rawText: "HCMUTE bí mật tặng 1 tỷ đồng tiền mặt không công khai cho toàn thể sinh viên.",
      },
    ],
    candidateSources: [{ officialDomains: ["hcmute.edu.vn"] }],
    expectedStatus: LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
    expectedClaimStatus: "UNVERIFIED",
  },
  {
    id: "case-c-contradictory-sources",
    name: "Case C: Contradictory Evidence — Job Fair Rescheduling",
    claims: [
      {
        claimId: "claim-event-conflict",
        subject: "HCMUTE",
        predicate: "ngày hội việc làm thứ Hai",
        time: "2026",
        rawText: "HCMUTE tổ chức ngày hội việc làm vào thứ Hai ngày 15/09",
      },
    ],
    candidateSources: [{ officialDomains: ["vnexpress.net", "tuoitre.vn"] }],
    expectedStatus: LAYER_3_STATUS.CONTESTED,
    mustHaveConflict: true,
  },
  {
    id: "case-d-outdated-evidence",
    name: "Case D: Outdated Evidence — 2022 Policy Document",
    claims: [
      {
        claimId: "claim-outdated-1",
        subject: "HCMUTE",
        predicate: "học phí 2022",
        time: "2026",
        rawText: "Quy định học phí 2022 áp dụng cho năm 2026",
      },
    ],
    candidateSources: [{ officialDomains: ["hcmute.edu.vn"] }],
    expectedStatus: LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
    expectedClaimStatus: "OUTDATED_EVIDENCE",
  },
  {
    id: "case-e-syndicated-press-releases",
    name: "Case E: Copied Sources — Press Release Lineage Clustering",
    claims: [
      {
        claimId: "claim-ai-major",
        subject: "HCMUTE",
        predicate: "mở ngành trí tuệ nhân tạo",
        time: "2026",
        rawText: "HCMUTE mở ngành trí tuệ nhân tạo năm 2026",
      },
    ],
    candidateSources: [{ officialDomains: ["dantri.com.vn", "thanhnien.vn"] }],
    expectedStatus: LAYER_3_STATUS.PARTIAL,
    expectedClusterCount: 1, // Must be clustered into 1 lineage, not 2 independent sources
  },
  {
    id: "case-f-partial-support",
    name: "Case F: Partial Support / Overstatement — Scholarship Scope",
    claims: [
      {
        claimId: "claim-partial-1",
        subject: "HCMUTE",
        predicate: "học bổng 10 triệu",
        time: "2026",
        rawText: "HCMUTE trao tặng học bổng 10 triệu cho mọi sinh viên",
      },
    ],
    candidateSources: [{ officialDomains: ["hcmute.edu.vn"] }],
    expectedStatus: LAYER_3_STATUS.PARTIAL,
    expectedClaimStatus: "PARTIALLY_SUPPORTED",
  },
];

async function runLayer3Tests() {
  console.log("\n======================================================================");
  console.log("🔍 LAYER 3 — EXTERNAL EVIDENCE & SOURCE VERIFICATION TEST SUITE");
  console.log("======================================================================\n");

  let passedCount = 0;
  let totalLatency = 0;

  for (const test of LAYER_3_TEST_CASES) {
    const result = await Layer3EvidenceService.verify({
      claims: test.claims,
      candidateSources: test.candidateSources,
    });

    totalLatency += result.metrics.executionTimeMs;

    const isStatusMatch = result.status === test.expectedStatus;
    const isClaimStatusMatch = !test.expectedClaimStatus || result.claimStatuses[test.claims[0].claimId] === test.expectedClaimStatus;
    const isConflictMatch = !test.mustHaveConflict || result.conflicts.length > 0;
    const isClusterMatch = test.expectedClusterCount === undefined || result.sourceIndependence.totalClusters === test.expectedClusterCount;

    const isPass = isStatusMatch && isClaimStatusMatch && isConflictMatch && isClusterMatch;

    if (isPass) {
      passedCount++;
      console.log(`✅ [PASS] ${test.name}`);
      console.log(`   Status: ${result.status} | Completeness: ${result.verificationCompleteness} | Latency: ${result.metrics.executionTimeMs}ms`);
      if (result.conflicts.length > 0) {
        console.log(`   Detected Conflict: ${result.conflicts[0].conflictType} (${result.conflicts[0].supportingSourcesCount} support vs ${result.conflicts[0].contradictingSourcesCount} contradict)`);
      }
    } else {
      console.error(`❌ [FAIL] ${test.name}`);
      console.error(`   Expected Status: ${test.expectedStatus} | Received: ${result.status}`);
      console.error(`   Expected Claim: ${test.expectedClaimStatus} | Received: ${JSON.stringify(result.claimStatuses)}`);
      console.error(`   Expected Clusters: ${test.expectedClusterCount} | Received: ${result.sourceIndependence?.totalClusters} (Sources: ${result.sources.length})`);
    }
  }

  // Test Case G: SSRF & Safety Protection
  console.log("\n--- SSRF & Fetch Safety Verification ---");
  const webRetriever = new WebSearchRetriever();
  const ssrf1 = await webRetriever.fetch("http://127.0.0.1:8080/admin");
  const ssrf2 = await webRetriever.fetch("http://169.254.169.254/latest/meta-data");

  const isSsrfPassed = ssrf1.status === 403 && ssrf2.status === 403;
  if (isSsrfPassed) {
    passedCount++;
    console.log("✅ [PASS] SSRF Protection Guard: Successfully blocked private IP (127.0.0.1) and cloud metadata (169.254.169.254).");
  } else {
    console.error("❌ [FAIL] SSRF Protection failed to block unsafe targets.");
  }

  // Test Case H: Provider Fallback
  console.log("\n--- Provider Resilience Verification ---");
  const fallbackResult = await Layer3EvidenceService.verify({
    claims: LAYER_3_TEST_CASES[0].claims,
    options: {
      retriever: {
        retrieverId: "mock_failing_retriever",
        search: async () => { throw new Error("Simulated Search Gateway Timeout"); },
        fetch: async () => ({ html: "", textContent: "", status: 504 }),
      },
    },
  });

  const isFallbackPassed = fallbackResult.status === LAYER_3_STATUS.PARTIAL &&
    fallbackResult.externalEvidence === false &&
    fallbackResult.limitations.some((item) => item.includes("cục bộ") || item.includes("fallback"));
  if (isFallbackPassed) {
    passedCount++;
    console.log("✅ [PASS] Fallback Resilience: Caught simulated retriever error and fell back to explicitly non-live Knowledge Base evidence.");
  } else {
    console.error("❌ [FAIL] Fallback Resilience test failed.");
  }

  const totalTests = LAYER_3_TEST_CASES.length + 2;
  const avgLatency = (totalLatency / LAYER_3_TEST_CASES.length).toFixed(2);

  console.log("\n======================================================================");
  console.log("🎯 LAYER 3 FINAL EVALUATION SUMMARY");
  console.log("======================================================================");
  console.log(`Total Test Scenarios Evaluated : ${totalTests}`);
  console.log(`Passed                         : ${passedCount} / ${totalTests}`);
  console.log(`Failed                         : ${totalTests - passedCount}`);
  console.log(`Average Evidence Latency       : ${avgLatency} ms`);
  console.log(`Overall Accuracy               : ${((passedCount / totalTests) * 100).toFixed(1)}%`);
  console.log("======================================================================\n");

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

// Execute Test Suite only when run directly from command line
if (typeof process !== "undefined" && process.argv[1] && (process.argv[1].endsWith("layer3.test.mjs") || process.argv[1].includes("layer3.test"))) {
  runLayer3Tests().catch((err) => {
    console.error("Layer 3 Test Suite execution error:", err);
    process.exit(1);
  });
}
