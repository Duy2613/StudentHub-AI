/**
 * StudentHub AI — ImageForensicsPolicyV1
 * 
 * Deterministic Server-Owned Media Forensics Policy Engine (Version: IMAGE_FORENSICS_V1):
 * - Evaluates specialist detectors (GenAI, Deepfake, Manipulation).
 * - Evaluates deterministic analyzers (EXIF, C2PA, JPEG recompression, Resampling, OCR).
 * - Evaluates multimodal AI advisory from Gemini.
 * - Enforces strict semantic separation between GenAI and Deepfake.
 * - Rejects single global "REAL/FAKE" verdicts.
 * - Enforces: "Green does not mean authentic" (NO_STRONG_SIGNAL_DETECTED with disclaimer).
 * - Differentiates providerScore from calibratedConfidence.
 * - Evaluates provider agreement (AGREEMENT, PARTIAL, DISAGREEMENT, INSUFFICIENT).
 * - Separates InternalForensicsMetadata from PublicMediaForensicsDTO (redacts GPS coordinates & storage paths).
 */

import {
  FORENSIC_DETECTOR_TYPES,
  GENAI_VERDICTS,
  DEEPFAKE_VERDICTS,
  MANIPULATION_VERDICTS,
  CONFIDENCE_TYPES,
  DETECTOR_STATUS,
} from "../providers/SpecialistDetectorAdapter.js";
import { C2PA_STATUS } from "../deterministic/C2paProvenanceAnalyzer.js";

export const FORENSICS_VERSION = "IMAGE_FORENSICS_V1";

export const FORENSIC_RISK_LEVEL = Object.freeze({
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  UNKNOWN: "UNKNOWN",
});

export const PROVIDER_AGREEMENT_STATUS = Object.freeze({
  AGREEMENT: "AGREEMENT",
  PARTIAL: "PARTIAL",
  DISAGREEMENT: "DISAGREEMENT",
  INSUFFICIENT: "INSUFFICIENT",
});

export class ImageForensicsPolicyV1 {
  /**
   * Applies deterministic policy over all forensic signals to produce canonical public & internal DTOs.
   * 
   * @param {object} params
   * @param {object} params.genAiResult - ProviderResult from GenAI detector
   * @param {object} params.deepfakeResult - ProviderResult from Deepfake detector
   * @param {object} params.manipulationResult - ProviderResult from Manipulation detector
   * @param {object} params.exifResult - Result from ExifForensicsAnalyzer
   * @param {object} params.c2paResult - Result from C2paProvenanceAnalyzer
   * @param {object} params.jpegResult - Result from JpegRecompressionAnalyzer
   * @param {object} params.resamplingResult - Result from ResamplingAnalyzer
   * @param {object} params.ocrResult - Result from OcrForensicsExtractor
   * @param {object} params.advisoryResult - Result from ImageAdvisoryService
   * @param {object} params.artifact - Canonical artifact reference
   * @returns {{ publicDto: object, internalMetadata: object }}
   */
  static evaluate({
    genAiResult = null,
    deepfakeResult = null,
    manipulationResult = null,
    exifResult = null,
    c2paResult = null,
    jpegResult = null,
    resamplingResult = null,
    ocrResult = null,
    advisoryResult = null,
    artifact = {},
  }) {
    const primarySignals = [];
    const conflicts = [];
    let requiresHumanReview = false;

    // 1. Evaluate Specialist Status & Partial Handling
    const specialistResults = [genAiResult, deepfakeResult, manipulationResult].filter(Boolean);
    const completedSpecialists = specialistResults.filter(r => r.status === DETECTOR_STATUS.SUCCESS);
    const failedSpecialists = specialistResults.filter(r => [DETECTOR_STATUS.FAILED, DETECTOR_STATUS.TIMEOUT, DETECTOR_STATUS.RATE_LIMITED].includes(r.status));
    const isPartial = failedSpecialists.length > 0 && completedSpecialists.length > 0;
    const isAllFailed = specialistResults.length > 0 && completedSpecialists.length === 0;

    let overallStatus = "COMPLETED";
    if (isAllFailed) overallStatus = "FAILED";
    else if (isPartial) overallStatus = "PARTIAL";

    // 2. Evaluate GenAI Findings
    const genAiScore = genAiResult?.providerScore ?? null;
    const genAiVerdict = genAiResult?.verdict || GENAI_VERDICTS.UNKNOWN;
    const isGenAiHigh = genAiVerdict === GENAI_VERDICTS.LIKELY_AI_GENERATED || (genAiScore !== null && genAiScore >= 0.8);
    const isGenAiModerate = genAiVerdict === GENAI_VERDICTS.POSSIBLY_AI_GENERATED || (genAiScore !== null && genAiScore >= 0.5 && genAiScore < 0.8);

    if (isGenAiHigh) {
      primarySignals.push("Dấu hiệu hình ảnh được tạo bằng AI mức cao");
    } else if (isGenAiModerate) {
      primarySignals.push("Dấu hiệu hình ảnh có thể được tạo bằng AI");
    }

    // 3. Evaluate Deepfake Findings (FACIAL MEDIA ONLY)
    const deepfakeScore = deepfakeResult?.providerScore ?? null;
    const deepfakeVerdict = deepfakeResult?.verdict || DEEPFAKE_VERDICTS.UNKNOWN;
    const isDeepfakeHigh = deepfakeVerdict === DEEPFAKE_VERDICTS.LIKELY_DEEPFAKE || (deepfakeScore !== null && deepfakeScore >= 0.8);
    const isDeepfakeModerate = deepfakeVerdict === DEEPFAKE_VERDICTS.POSSIBLY_DEEPFAKE || (deepfakeScore !== null && deepfakeScore >= 0.5 && deepfakeScore < 0.8);

    if (isDeepfakeHigh) {
      primarySignals.push("Dấu hiệu chỉnh sửa / hoán đổi khuôn mặt (deepfake) mức cao");
    } else if (isDeepfakeModerate) {
      primarySignals.push("Dấu hiệu nghi vấn deepfake khuôn mặt");
    }

    // 4. CRITICAL SEMANTIC INVARIANT:
    // If GenAI is HIGH and Deepfake is LOW / NO_SIGNAL,
    // GenAI stays HIGH SUSPICIOUS SIGNAL, Deepfake stays NO STRONG DEEPFAKE SIGNAL.
    // It must NEVER output "LIKELY_REAL" or "99.9% real"!
    if (isGenAiHigh && deepfakeVerdict === DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL) {
      // Distinct questions: Image is likely synthetic, even if face-swap was not the mechanism.
      conflicts.push("Phát hiện hình ảnh tạo bởi AI (GenAI), nhưng không phát hiện dấu hiệu hoán đổi mặt (Deepfake). Đây là hai cơ chế độc lập.");
      requiresHumanReview = true;
    }

    // 5. Evaluate Manipulation Findings
    const manipVerdict = manipulationResult?.verdict || MANIPULATION_VERDICTS.UNKNOWN;
    const isManipulatedHigh = manipVerdict === MANIPULATION_VERDICTS.LIKELY_MANIPULATED;
    if (isManipulatedHigh) {
      primarySignals.push("Dấu hiệu cắt ghép / chỉnh sửa cấu trúc hình ảnh");
    }

    // 6. Evaluate Deterministic Findings
    // EXIF software tag is a signal, not proof!
    if (exifResult?.software?.editorDetected) {
      primarySignals.push(`Chữ ký phần mềm biên tập (${exifResult.software.editorName})`);
    }

    // C2PA Status
    const c2paStatus = c2paResult?.c2paStatus || C2PA_STATUS.UNKNOWN;
    if (c2paStatus === C2PA_STATUS.PRESENT_UNVERIFIED) {
      primarySignals.push("Có Content Credentials (C2PA) chưa đối soát mật mã");
    }

    // Quality check
    const isLowQuality = jpegResult?.qualityEstimate !== null && jpegResult?.qualityEstimate < 60;
    if (isLowQuality) {
      requiresHumanReview = true;
    }

    // 7. Provider Agreement Determination
    let agreementStatus = PROVIDER_AGREEMENT_STATUS.AGREEMENT;
    if (conflicts.length > 0) {
      agreementStatus = PROVIDER_AGREEMENT_STATUS.DISAGREEMENT;
    } else if (isPartial) {
      agreementStatus = PROVIDER_AGREEMENT_STATUS.PARTIAL;
    } else if (specialistResults.every(r => r.verdict === "UNKNOWN")) {
      agreementStatus = PROVIDER_AGREEMENT_STATUS.INSUFFICIENT;
    }

    // 8. Deterministic Risk Level (FORENSIC SIGNAL SUMMARY ONLY, NOT TRUTH STATUS)
    let riskLevel = FORENSIC_RISK_LEVEL.LOW;
    if (isGenAiHigh || isDeepfakeHigh || isManipulatedHigh) {
      riskLevel = FORENSIC_RISK_LEVEL.HIGH;
    } else if (isGenAiModerate || isDeepfakeModerate || manipVerdict === MANIPULATION_VERDICTS.POSSIBLY_MANIPULATED) {
      riskLevel = FORENSIC_RISK_LEVEL.MEDIUM;
    } else if (isAllFailed || specialistResults.length === 0) {
      riskLevel = FORENSIC_RISK_LEVEL.UNKNOWN;
    }

    if (riskLevel === FORENSIC_RISK_LEVEL.HIGH) {
      requiresHumanReview = true;
    }

    // 9. Construct PublicMediaForensicsDTO (Strictly Redacted)
    const publicDto = {
      version: FORENSICS_VERSION,
      status: overallStatus,

      summary: {
        riskLevel,
        requiresHumanReview,
        primarySignals,
        disclaimer: "Kết quả phân tích hình ảnh cung cấp các chỉ số kỹ thuật độc lập; không xác nhận toàn bộ ảnh là ảnh thật và không thay thế phán quyết của Hội đồng thẩm định L5.",
      },

      aiGeneration: {
        status: genAiResult?.status || DETECTOR_STATUS.NOT_CONFIGURED,
        verdict: genAiVerdict,
        providerScore: genAiScore,
        calibratedConfidence: null, // Uncalibrated vendor score
        confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
        reason: genAiResult?.humanExplanation || "Chưa có đánh giá GenAI.",
        providers: genAiResult ? [{
          provider: genAiResult.provider,
          status: genAiResult.status,
          verdict: genAiResult.verdict,
          providerScore: genAiResult.providerScore,
        }] : [],
      },

      deepfake: {
        status: deepfakeResult?.status || DETECTOR_STATUS.NOT_CONFIGURED,
        verdict: deepfakeVerdict,
        providerScore: deepfakeScore,
        calibratedConfidence: null,
        confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
        reason: deepfakeResult?.humanExplanation || "Chưa có đánh giá Deepfake.",
        providers: deepfakeResult ? [{
          provider: deepfakeResult.provider,
          status: deepfakeResult.status,
          verdict: deepfakeResult.verdict,
          providerScore: deepfakeResult.providerScore,
        }] : [],
      },

      manipulation: {
        status: manipulationResult?.status || DETECTOR_STATUS.NOT_SUPPORTED,
        verdict: manipVerdict,
        providerScore: manipulationResult?.providerScore || null,
        calibratedConfidence: null,
        confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
        reason: manipulationResult?.humanExplanation || "Tính năng phát hiện cắt ghép cục bộ chưa được hỗ trợ bởi detector hiện tại.",
        providers: manipulationResult ? [{
          provider: manipulationResult.provider,
          status: manipulationResult.status,
          verdict: manipulationResult.verdict,
          providerScore: manipulationResult.providerScore,
        }] : [],
      },

      metadata: {
        status: exifResult?.status || "NO_EXIF",
        exifPresent: Boolean(exifResult?.exifPresent),
        camera: {
          make: exifResult?.camera?.make || null,
          model: exifResult?.camera?.model || null,
        },
        software: {
          editorDetected: Boolean(exifResult?.software?.editorDetected),
          editorName: exifResult?.software?.editorName || null,
        },
        timestamps: {
          creationTime: exifResult?.timestamps?.creationTime || null,
        },
        hasGps: Boolean(exifResult?.hasGps), // Boolean ONLY! Coordinates redacted!
        warnings: exifResult?.warnings || [],
      },

      provenance: {
        c2paStatus,
        claimGenerator: c2paResult?.claimGenerator || null,
        isVerified: Boolean(c2paResult?.isVerified),
        warnings: c2paResult?.warnings || [],
      },

      compression: {
        signal: jpegResult?.signal || "NORMAL",
        qualityEstimate: jpegResult?.qualityEstimate || null,
        warnings: jpegResult?.warnings || [],
      },

      resampling: {
        signal: resamplingResult?.signal || "NORMAL",
        hasResamplingSignal: Boolean(resamplingResult?.hasResamplingSignal),
        warnings: resamplingResult?.warnings || [],
      },

      ocr: {
        status: ocrResult?.status || "NO_TEXT_DETECTED",
        text: ocrResult?.text || "",
        regions: ocrResult?.regions || [],
        warnings: ocrResult?.warnings || [],
      },

      visibleUrls: Array.isArray(ocrResult?.visibleUrls) ? ocrResult.visibleUrls : [],

      quality: {
        width: artifact.width || 0,
        height: artifact.height || 0,
        byteSize: artifact.byteSize || 0,
        isDegraded: Boolean(isLowQuality),
      },

      advisory: advisoryResult?.advisory ? {
        role: "ADVISORY",
        visualContext: advisoryResult.advisory.visualContext,
        ocrInterpretation: advisoryResult.advisory.ocrInterpretation,
        semanticExplanation: advisoryResult.advisory.semanticExplanation,
        sceneElements: advisoryResult.advisory.sceneElements,
      } : null,

      providerAgreement: {
        status: agreementStatus,
        conflicts,
      },
    };

    // 10. Construct InternalForensicsMetadata (Never sent to client)
    const internalMetadata = {
      mediaArtifactId: artifact.mediaArtifactId || null,
      imageHash: artifact.sha256 || null,
      privateStoragePath: artifact.privateStoragePath || null,
      rawExif: exifResult?.rawExifInternal || null,
      rawGenAiResponse: genAiResult || null,
      rawDeepfakeResponse: deepfakeResult || null,
      rawAdvisory: advisoryResult || null,
    };

    return {
      publicDto,
      internalMetadata,
    };
  }
}
