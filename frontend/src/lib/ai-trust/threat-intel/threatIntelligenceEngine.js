/**
 * StudentHub AI — Master Threat Intelligence & Multimodal Fraud Orchestrator
 * 
 * Fuses:
 * 1. Live URLhaus (abuse.ch) Query Engine
 * 2. NCSC (Bộ TT&TT) Curated IOC Blacklists
 * 3. APWG (Anti-Phishing Working Group) Quishing & Combosquatting Vectors
 * 4. FTC Consumer Sentinel (2024 Data Book) Impersonation & Payment Modalities
 * 5. Fraud Knowledge Graph & Cross-Modal Contradiction Engine
 */

import { queryUrlhausUrl, queryUrlhausHost } from "./urlhausClient.js";
import { queryThreatIntelligence as queryNcscThreats } from "../../intelligence/fraud/threatIntelligenceFeed.js";
import { evaluateApwgThreatVectors } from "./apwgTaxonomy.js";
import { evaluateFtcSentinelIndicators } from "./ftcSentinelTaxonomy.js";
import { buildFraudEntityGraph } from "./fraudKnowledgeGraph.js";

/**
 * Executes a comprehensive multi-source threat intelligence investigation
 */
export async function investigateThreatIntelligence({
  url = null,
  domain = null,
  text = "",
  bankCode = null,
  accountNumber = null,
  accountHolder = null,
  claimedOrg = null,
  officialDomain = null,
  officialBeneficiary = null,
  qrPayload = null,
} = {}) {
  const startTime = performance.now();

  // 1. Query URLhaus Live Threat Intelligence
  let urlhausResult = null;
  if (url) {
    urlhausResult = await queryUrlhausUrl(url);
  } else if (domain) {
    urlhausResult = await queryUrlhausHost(domain);
  }

  // 2. Query NCSC Vietnam Curated Threat IOCs
  const ncscResult = queryNcscThreats({ domain, url, bankCode, accountNumber });

  // 3. Evaluate APWG Quishing & Combosquatting Vectors
  const apwgResult = evaluateApwgThreatVectors({
    text: text || "",
    qrUrl: qrPayload,
    domain: domain || (url ? new URL(url.startsWith("http") ? url : `https://${url}`).hostname : ""),
  });

  // 4. Evaluate FTC Consumer Sentinel Impersonation & Loss Indicators
  const ftcResult = evaluateFtcSentinelIndicators(text || "");

  // 5. Build Fraud Knowledge Graph & Check Cross-Entity Contradictions
  const entityGraph = buildFraudEntityGraph({
    claimedOrg,
    officialDomain,
    officialBeneficiary,
    observedDomain: domain,
    observedUrl: url,
    observedQr: qrPayload,
    observedBank: bankCode,
    observedAccount: accountNumber,
    observedHolder: accountHolder,
  });

  // 6. Evidence Fusion & Severity Calculation
  const isDirectlyMalicious =
    urlhausResult?.isMalicious ||
    ncscResult.isThreatDetected ||
    entityGraph.hasContradictions;

  const severity = isDirectlyMalicious ? "CRITICAL" : apwgResult.hasHighRiskVector || ftcResult.hasSevereFinancialRisk ? "HIGH" : "LOW";
  const confidence = urlhausResult?.isMalicious || ncscResult.isThreatDetected ? 0.98 : entityGraph.hasContradictions ? 0.92 : 0.75;

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    investigationTimestamp: new Date().toISOString(),
    isThreatDetected: isDirectlyMalicious || apwgResult.hasHighRiskVector,
    severity,
    confidence,
    sources: {
      urlhaus: urlhausResult,
      ncsc: ncscResult,
      apwg: apwgResult,
      ftcSentinel: ftcResult,
    },
    entityGraph: {
      nodeCount: entityGraph.nodeCount,
      edgeCount: entityGraph.edgeCount,
      contradictions: entityGraph.contradictions,
    },
    executionTimeMs,
    disclaimer: "StudentHub Threat Intelligence integrates live URLhaus community feeds, NCSC Vietnam IOCs, APWG trends, and FTC Sentinel loss matrices.",
  };
}
