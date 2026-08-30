/**
 * GlobalIntelligenceEngine
 * 
 * Unified Global Knowledge & Threat Intelligence Correlation Engine.
 * Integrates:
 * - International Standards (MITRE ATT&CK, NIST, IFCN, OWASP, ISO)
 * - 50+ Accredited Higher Education Digital Ecosystems & Subdomains
 * - Social Media Threat Surface Indicators (Facebook, Telegram, Zalo, TikTok)
 */

import { GLOBAL_SECURITY_STANDARDS } from "../standards/GlobalStandardsRegistry.js";
import { matchUniversityEcosystem } from "../ecosystem/UniversityEcosystemRegistry.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isExternalEvidence(item) {
  return Boolean(item &&
    item.liveEvidence === true &&
    item.sourceType !== "LOCAL_KNOWLEDGE_BASE" &&
    item.providerStatus === "SUCCESS" &&
    item.retrievalOutcome === "SUCCESS" &&
    typeof item.sourceFingerprint === "string" &&
    item.sourceFingerprint.trim());
}

export class GlobalIntelligenceEngine {
  /**
   * Correlates multi-layer signals and produces international standard mappings
   * @param {object} params
   * @param {object} params.fusedGraph
   * @param {string} params.url
   * @returns {object} Standard compliance profile & threat mappings
   */
  static correlate({ fusedGraph = {}, url = "" }) {
    fusedGraph = fusedGraph && typeof fusedGraph === "object" && !Array.isArray(fusedGraph) ? fusedGraph : {};
    const matchedStandards = [];
    const complianceNotes = [];
    let matchedUniversity = null;

    // 1. Match University Subdomain Ecosystem
    if (typeof url === "string" && url.trim()) {
      try {
        const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
        matchedUniversity = matchUniversityEcosystem(parsedUrl.hostname);
      } catch {
        // Invalid URL format
      }
    }

    // 2. Correlate with MITRE ATT&CK Techniques
    const hasPhishingSignals =
      asArray(fusedGraph.layer1Signals).some((s) => typeof s?.type === "string" && (s.type.includes("credential") || s.type.includes("otp") || s.type.includes("phishing"))) ||
      asArray(fusedGraph.layer2ContextSignals).some((s) => typeof s?.type === "string" && (s.type.includes("credential") || s.type.includes("account_takeover")));

    if (hasPhishingSignals) {
      matchedStandards.push({
        framework: "MITRE ATT&CK",
        techniqueId: GLOBAL_SECURITY_STANDARDS.MITRE_ATTCK.TECHNIQUES.T1589_001.id,
        name: GLOBAL_SECURITY_STANDARDS.MITRE_ATTCK.TECHNIQUES.T1589_001.name,
        risk: "CRITICAL",
      });

      matchedStandards.push({
        framework: "NIST SP 800-63B",
        section: "AAL2 / AAL3 Authentication Defense",
        directive: GLOBAL_SECURITY_STANDARDS.NIST.SP_800_63B.directive,
      });

      matchedStandards.push({
        framework: "OWASP LLM 2025",
        rule: GLOBAL_SECURITY_STANDARDS.OWASP_LLM.LLM09.id,
        mitigation: GLOBAL_SECURITY_STANDARDS.OWASP_LLM.LLM09.mitigation,
      });
    }

    // 3. Correlate with IFCN Fact-Checking Principles
    const hasSourcingEvidence = asArray(fusedGraph.layer3Evidence).some(isExternalEvidence);
    if (hasSourcingEvidence) {
      matchedStandards.push({
        framework: "IFCN Code of Principles",
        principle: "Principle 2: Standards and Transparency of Sources",
        status: "MAPPED_FOR_AUDIT",
      });
    }

    return {
      matchedStandards,
      matchedUniversity,
      frameworkCount: matchedStandards.length,
      isAccreditedEcosystem: Boolean(matchedUniversity),
      globalAuditSummary: matchedStandards.length > 0
        ? `Đã ánh xạ ${matchedStandards.length} khung tham chiếu cho mục đích audit; đây không phải chứng nhận tuân thủ.`
        : "Không có ánh xạ khung tham chiếu đủ điều kiện từ bằng chứng hiện tại.",
    };
  }
}
