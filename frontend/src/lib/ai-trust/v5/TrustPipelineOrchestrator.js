/**
 * Backward-compatible V5 orchestration entrypoint.
 *
 * The production sequential route uses TrustOrchestrator.js, whose Friend
 * Backend path is explicit and fail-closed. This compatibility export keeps
 * the original V5 service-injection contract available to existing modules
 * and regression tests; it is not a silent provider fallback for the route.
 */
export {
  TrustPipelineOrchestrator,
  TrustPipelineCancelledError,
  createTrustPipelineOrchestrator,
  isRetryEligible,
} from "./TrustPipelineOrchestratorLegacy.js";
