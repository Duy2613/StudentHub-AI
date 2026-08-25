/**
 * Layer 1 — Fast & Deterministic Screening Module Exports
 */

export { Layer1ScreenService } from "./Layer1ScreenService.js";
export { LAYER_1_CONFIG } from "./config/Layer1Config.js";
export { LAYER_1_STATUS, LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal, createLayer1Result } from "./types.js";
export { NormalizationService } from "./normalization/NormalizationService.js";
export { BrandRegistry, BRAND_REGISTRY } from "./registry/BrandRegistry.js";
export { UrlDetector } from "./detectors/UrlDetector.js";
export { TextDetector } from "./detectors/TextDetector.js";
export { FileDetector } from "./detectors/FileDetector.js";
export { ImageDetector } from "./detectors/ImageDetector.js";
export { OcrDetector } from "./detectors/OcrDetector.js";
export { QrDetector } from "./detectors/QrDetector.js";
export { HardRuleEngine } from "./engine/HardRuleEngine.js";
export { SignalAggregator } from "./engine/SignalAggregator.js";
export { ConfidenceEngine } from "./engine/ConfidenceEngine.js";
export { DecisionEngine } from "./engine/DecisionEngine.js";
export { ITrustSignalModel, executeAuxiliaryModelSafe } from "./models/ITrustSignalModel.js";
export { SecurityLogger, redactSensitiveData } from "./observability/SecurityLogger.js";

// Legacy wrapper for backwards compatibility
export { screenLayer1 } from "./scanner.js";
