/**
 * Layer 3 — Public Module Exports
 */

export * from "./types.js";
export * from "./config/Layer3Config.js";
export * from "./registry/SourceAuthorityRegistry.js";
export * from "./query/QueryGenerator.js";
export * from "./retrieval/IEvidenceRetriever.js";
export * from "./retrieval/KnowledgeBaseRetriever.js";
export * from "./retrieval/WebSearchRetriever.js";
export * from "./extractors/EvidenceExtractor.js";
export * from "./extractors/TemporalEvaluator.js";
export * from "./extractors/SourceIndependenceAnalyzer.js";
export * from "./extractors/ClaimEvidenceMatcher.js";
export * from "./engine/SourceConflictDetector.js";
export * from "./engine/CompletenessEngine.js";
export * from "./engine/Layer3DecisionEngine.js";
export * from "./Layer3EvidenceService.js";
export * from "./TrustBoundary.js";
