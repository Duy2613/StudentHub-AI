/**
 * StudentHub AI — SightengineForensicsAdapter
 * 
 * Specialist detector adapter for Sightengine Forensics:
 * - GENAI_DETECTION: calls Sightengine GenAI model (`models=genai`)
 * - DEEPFAKE_DETECTION: calls Sightengine Deepfake model (`models=deepfake`)
 * - IMAGE_MANIPULATION: returns NOT_SUPPORTED (abstained, not fabricated!)
 * 
 * STRICT INVARIANTS:
 * - GenAI detection and Deepfake detection are NEVER merged.
 * - If no face detected, Deepfake verdict is NOT_APPLICABLE.
 * - API credentials are never logged or exposed.
 * - Provider errors return DETECTOR_STATUS.FAILED / RATE_LIMITED without crashing L2.
 */

import {
  FORENSIC_DETECTOR_TYPES,
  GENAI_VERDICTS,
  DEEPFAKE_VERDICTS,
  MANIPULATION_VERDICTS,
  CONFIDENCE_TYPES,
  DETECTOR_STATUS,
  createProviderResult,
} from "./SpecialistDetectorAdapter.js";

const SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0/check.json";
const DEFAULT_TIMEOUT_MS = 6000;

export class SightengineForensicsAdapter {
  constructor(options = {}) {
    this.apiUser = options.apiUser || process.env.SIGHTENGINE_API_USER || "";
    this.apiSecret = options.apiSecret || process.env.SIGHTENGINE_API_SECRET || "";
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn || globalThis.fetch;
  }

  isConfigured() {
    return Boolean(this.apiUser && this.apiSecret);
  }

  /**
   * Executes GenAI detection.
   * 
   * @param {object} params
   * @param {Buffer|Uint8Array} params.bytes
   * @param {string} [params.mimeType="image/jpeg"]
   * @returns {Promise<object>} ProviderResult
   */
  async detectGenAi({ bytes, mimeType = "image/jpeg" }) {
    if (!this.isConfigured()) {
      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
        status: DETECTOR_STATUS.NOT_CONFIGURED,
        verdict: GENAI_VERDICTS.UNKNOWN,
        reasonCode: "PROVIDER_NOT_CONFIGURED",
        humanExplanation: "Chưa cấu hình API key cho Sightengine GenAI detector.",
      });
    }

    const start = Date.now();
    try {
      const formData = new FormData();
      formData.append("models", "genai");
      formData.append("api_user", this.apiUser);
      formData.append("api_secret", this.apiSecret);

      const blob = new Blob([bytes], { type: mimeType });
      formData.append("media", blob, "image.jpg");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchFn(SIGHTENGINE_API_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const durationMs = Date.now() - start;
      const httpStatus = response.status;

      if (!response.ok) {
        return createProviderResult({
          provider: "sightengine",
          detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
          status: httpStatus === 429 ? DETECTOR_STATUS.RATE_LIMITED : DETECTOR_STATUS.FAILED,
          verdict: GENAI_VERDICTS.UNKNOWN,
          durationMs,
          httpStatus,
          reasonCode: `HTTP_${httpStatus}`,
          humanExplanation: "Sightengine GenAI API trả về lỗi HTTP.",
        });
      }

      const data = await response.json();
      if (data.status !== "success") {
        return createProviderResult({
          provider: "sightengine",
          detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
          status: DETECTOR_STATUS.FAILED,
          verdict: GENAI_VERDICTS.UNKNOWN,
          durationMs,
          httpStatus,
          reasonCode: data.error?.type || "API_ERROR",
          humanExplanation: data.error?.message || "Sightengine trả về lỗi logic.",
        });
      }

      const score = Number(data.type?.ai_generated);
      const cleanScore = Number.isFinite(score) ? score : null;

      let verdict = GENAI_VERDICTS.UNKNOWN;
      let reasonCode = "EVALUATION_COMPLETE";
      let humanExplanation = "Đã hoàn thành đánh giá dấu hiệu AI generation.";

      if (cleanScore !== null) {
        if (cleanScore >= 0.8) {
          verdict = GENAI_VERDICTS.LIKELY_AI_GENERATED;
          reasonCode = "HIGH_AI_SYNTHESIS_SIGNALS";
          humanExplanation = `Phát hiện dấu hiệu mạnh của hình ảnh tạo bằng AI (${(cleanScore * 100).toFixed(1)}%).`;
        } else if (cleanScore >= 0.5) {
          verdict = GENAI_VERDICTS.POSSIBLY_AI_GENERATED;
          reasonCode = "MODERATE_AI_SYNTHESIS_SIGNALS";
          humanExplanation = `Có dấu hiệu trung bình của hình ảnh tạo bằng AI (${(cleanScore * 100).toFixed(1)}%).`;
        } else {
          verdict = GENAI_VERDICTS.NO_STRONG_AI_SIGNAL;
          reasonCode = "NO_STRONG_AI_SIGNALS";
          humanExplanation = `Chưa phát hiện dấu hiệu mạnh của ảnh tạo bằng AI (${(cleanScore * 100).toFixed(1)}%).`;
        }
      }

      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
        status: DETECTOR_STATUS.SUCCESS,
        verdict,
        providerScore: cleanScore,
        calibratedConfidence: null, // Uncalibrated vendor score
        confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
        reasonCode,
        humanExplanation,
        durationMs,
        httpStatus,
        modelVersion: "sightengine_genai_v1",
      });
    } catch (err) {
      const isTimeout = err?.name === "AbortError";
      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
        status: isTimeout ? DETECTOR_STATUS.TIMEOUT : DETECTOR_STATUS.FAILED,
        verdict: GENAI_VERDICTS.UNKNOWN,
        durationMs: Date.now() - start,
        reasonCode: isTimeout ? "TIMEOUT" : (err?.code || "NETWORK_ERROR"),
        humanExplanation: isTimeout ? "Yêu cầu tới Sightengine GenAI bị quá thời gian." : "Lỗi kết nối tới Sightengine.",
      });
    }
  }

  /**
   * Executes Deepfake detection.
   * 
   * @param {object} params
   * @param {Buffer|Uint8Array} params.bytes
   * @param {string} [params.mimeType="image/jpeg"]
   * @returns {Promise<object>} ProviderResult
   */
  async detectDeepfake({ bytes, mimeType = "image/jpeg" }) {
    if (!this.isConfigured()) {
      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
        status: DETECTOR_STATUS.NOT_CONFIGURED,
        verdict: DEEPFAKE_VERDICTS.UNKNOWN,
        reasonCode: "PROVIDER_NOT_CONFIGURED",
        humanExplanation: "Chưa cấu hình API key cho Sightengine Deepfake detector.",
      });
    }

    const start = Date.now();
    try {
      const formData = new FormData();
      formData.append("models", "deepfake");
      formData.append("api_user", this.apiUser);
      formData.append("api_secret", this.apiSecret);

      const blob = new Blob([bytes], { type: mimeType });
      formData.append("media", blob, "image.jpg");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchFn(SIGHTENGINE_API_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const durationMs = Date.now() - start;
      const httpStatus = response.status;

      if (!response.ok) {
        return createProviderResult({
          provider: "sightengine",
          detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
          status: httpStatus === 429 ? DETECTOR_STATUS.RATE_LIMITED : DETECTOR_STATUS.FAILED,
          verdict: DEEPFAKE_VERDICTS.UNKNOWN,
          durationMs,
          httpStatus,
          reasonCode: `HTTP_${httpStatus}`,
          humanExplanation: "Sightengine Deepfake API trả về lỗi HTTP.",
        });
      }

      const data = await response.json();
      if (data.status !== "success") {
        return createProviderResult({
          provider: "sightengine",
          detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
          status: DETECTOR_STATUS.FAILED,
          verdict: DEEPFAKE_VERDICTS.UNKNOWN,
          durationMs,
          httpStatus,
          reasonCode: data.error?.type || "API_ERROR",
          humanExplanation: data.error?.message || "Sightengine trả về lỗi logic.",
        });
      }

      // Check if faces were detected
      const faces = Array.isArray(data.faces) ? data.faces : [];
      if (faces.length === 0 && data.type?.deepfake === undefined) {
        return createProviderResult({
          provider: "sightengine",
          detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
          status: DETECTOR_STATUS.SUCCESS,
          verdict: DEEPFAKE_VERDICTS.NOT_APPLICABLE,
          providerScore: null,
          calibratedConfidence: null,
          confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
          reasonCode: "NO_FACES_DETECTED",
          humanExplanation: "Không phát hiện khuôn mặt trong ảnh để đánh giá deepfake.",
          durationMs,
          httpStatus,
          modelVersion: "sightengine_deepfake_v1",
        });
      }

      // If face detected, inspect highest deepfake probability score
      let maxScore = Number(data.type?.deepfake);
      if (!Number.isFinite(maxScore) && faces.length > 0) {
        const scores = faces.map(f => Number(f.deepfake)).filter(Number.isFinite);
        if (scores.length > 0) maxScore = Math.max(...scores);
      }

      const cleanScore = Number.isFinite(maxScore) ? maxScore : null;
      let verdict = DEEPFAKE_VERDICTS.UNKNOWN;
      let reasonCode = "EVALUATION_COMPLETE";
      let humanExplanation = "Đã hoàn thành đánh giá dấu hiệu deepfake khuôn mặt.";

      if (cleanScore !== null) {
        if (cleanScore >= 0.8) {
          verdict = DEEPFAKE_VERDICTS.LIKELY_DEEPFAKE;
          reasonCode = "HIGH_DEEPFAKE_SIGNALS";
          humanExplanation = `Có dấu hiệu deepfake / chỉnh sửa khuôn mặt mạnh (${(cleanScore * 100).toFixed(1)}%).`;
        } else if (cleanScore >= 0.5) {
          verdict = DEEPFAKE_VERDICTS.POSSIBLY_DEEPFAKE;
          reasonCode = "MODERATE_DEEPFAKE_SIGNALS";
          humanExplanation = `Có dấu hiệu nghi vấn deepfake khuôn mặt (${(cleanScore * 100).toFixed(1)}%).`;
        } else {
          verdict = DEEPFAKE_VERDICTS.NO_STRONG_DEEPFAKE_SIGNAL;
          reasonCode = "NO_STRONG_DEEPFAKE_SIGNALS";
          humanExplanation = `Chưa phát hiện dấu hiệu deepfake mạnh (${(cleanScore * 100).toFixed(1)}%).`;
        }
      }

      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
        status: DETECTOR_STATUS.SUCCESS,
        verdict,
        providerScore: cleanScore,
        calibratedConfidence: null,
        confidenceType: CONFIDENCE_TYPES.PROVIDER_SCORE,
        reasonCode,
        humanExplanation,
        durationMs,
        httpStatus,
        modelVersion: "sightengine_deepfake_v1",
      });
    } catch (err) {
      const isTimeout = err?.name === "AbortError";
      return createProviderResult({
        provider: "sightengine",
        detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
        status: isTimeout ? DETECTOR_STATUS.TIMEOUT : DETECTOR_STATUS.FAILED,
        verdict: DEEPFAKE_VERDICTS.UNKNOWN,
        durationMs: Date.now() - start,
        reasonCode: isTimeout ? "TIMEOUT" : (err?.code || "NETWORK_ERROR"),
        humanExplanation: isTimeout ? "Yêu cầu tới Sightengine Deepfake bị quá thời gian." : "Lỗi kết nối tới Sightengine.",
      });
    }
  }

  /**
   * Manipulation detection: NOT SUPPORTED in Sightengine basic tier.
   * STRICT HARDENING RULE: Do NOT fabricate capability! Return NOT_SUPPORTED.
   */
  async detectManipulation() {
    return createProviderResult({
      provider: "sightengine",
      detector: FORENSIC_DETECTOR_TYPES.IMAGE_MANIPULATION,
      status: DETECTOR_STATUS.NOT_SUPPORTED,
      verdict: MANIPULATION_VERDICTS.UNKNOWN,
      reasonCode: "CAPABILITY_NOT_SUPPORTED",
      humanExplanation: "Tính năng phát hiện cắt ghép cục bộ (splicing/inpainting) không được hỗ trợ bởi provider này.",
      durationMs: 0,
    });
  }
}
