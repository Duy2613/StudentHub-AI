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
  classifyGatewayFailure,
  isFailoverEligible,
  normalizeProviderErrorCode,
  createAttemptRecord,
  sanitizeAttemptRecord,
  createGatewayResult,
} from "./types.js";
export { IModelProvider } from "./providers/IModelProvider.js";
export { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
export { GeminiProvider, validateGeminiModelIdentifier } from "./providers/GeminiProvider.js";
export { ModelHealthStore } from "./ModelHealthStore.js";
export {
  GEMINI_PRODUCTION_MODEL_IDS,
  GEMMA_SHADOW_MODEL_IDS,
  isApprovedGeminiProductionModel,
  isGemmaShadowModel,
} from "./config/GeminiModelCatalog.js";
