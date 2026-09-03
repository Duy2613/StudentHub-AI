/**
 * AI Gateway — Public Barrel Export
 *
 * Import from "@/lib/ai-gateway" rather than reaching into internal files.
 */

export { AIGatewayService } from "./AIGatewayService.js";
export { ModelRouter } from "./ModelRouter.js";
export { AI_GATEWAY_CONFIG } from "./config/AIGatewayConfig.js";
export {
  AI_CAPABILITY,
  MODEL_TIER,
  PROVIDER_FAMILY,
  GATEWAY_ERROR_TYPE,
  createAttemptRecord,
  createGatewayResult,
  estimateModelUsage,
  estimatedCostCentsFor,
  mergeModelUsage,
  normalizeModelUsage,
} from "./types.js";
export { IModelProvider } from "./providers/IModelProvider.js";
export { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
export { GeminiProvider } from "./providers/GeminiProvider.js";
export {
  evidenceIdsFromRecords,
  sourceIdsFromRecords,
  validateEvidenceReferences,
  createEvidenceReferenceValidator,
} from "./evidenceBindings.js";
