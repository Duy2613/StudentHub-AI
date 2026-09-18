/**
 * StudentHub AI — ImageForensicsOrchestrator
 * 
 * Master orchestrator for Layer 2 Media Forensics:
 * - Coordinates Specialist Detectors (GenAI, Deepfake, Manipulation)
 * - Coordinates Deterministic Analyzers (EXIF, C2PA, JPEG, Resampling, OCR)
 * - Coordinates Multimodal AI Advisory (Gemini)
 * - Applies deterministic ImageForensicsPolicyV1
 * - Handles bounded parallelism & isolated provider failure
 * - Ensures images are referenced by mediaArtifactId, not duplicated base64
 */

import { MediaArtifactService } from "../../server/media/MediaArtifactService.js";
import { ExifForensicsAnalyzer } from "./deterministic/ExifForensicsAnalyzer.js";
import { C2paProvenanceAnalyzer } from "./deterministic/C2paProvenanceAnalyzer.js";
import { JpegRecompressionAnalyzer } from "./deterministic/JpegRecompressionAnalyzer.js";
import { ResamplingAnalyzer } from "./deterministic/ResamplingAnalyzer.js";
import { OcrForensicsExtractor } from "./deterministic/OcrForensicsExtractor.js";
import { SightengineForensicsAdapter } from "./providers/SightengineForensicsAdapter.js";
import { ImageAdvisoryService } from "./advisory/ImageAdvisoryService.js";
import { ImageForensicsPolicyV1, FORENSICS_VERSION } from "./policy/ImageForensicsPolicyV1.js";
import { ForensicCacheService } from "./cache/ForensicCacheService.js";
import { FORENSIC_DETECTOR_TYPES, createProviderResult, DETECTOR_STATUS } from "./providers/SpecialistDetectorAdapter.js";

export class ImageForensicsOrchestrator {
  constructor(options = {}) {
    this.specialistAdapter = options.specialistAdapter || new SightengineForensicsAdapter();
    this.advisoryService = options.advisoryService || new ImageAdvisoryService();
  }

  /**
   * Performs multi-signal media forensics analysis on an image artifact or buffer.
   * 
   * @param {object} params
   * @param {string} [params.mediaArtifactId] - Canonical artifact reference
   * @param {Buffer|Uint8Array|string} [params.bytes] - Optional direct binary/base64
   * @param {object} [params.metadata={}] - OCR text, exif hints, claimed mimeType
   * @param {object} [params.options={}] - signal, requestId, useAIGateway, useCache
   * @returns {Promise<object>} { mediaForensics: PublicMediaForensicsDTO, internalMetadata }
   */
  async analyze({
    mediaArtifactId = null,
    bytes = null,
    metadata = {},
    options = {},
  } = {}) {
    const startedAt = Date.now();
    const requestId = options.requestId || "forensics-req";

    // 1. Resolve Artifact & Raw Bytes
    let resolvedBytes = null;
    let artifactInfo = null;

    if (mediaArtifactId) {
      resolvedBytes = MediaArtifactService.getArtifactBytes(mediaArtifactId);
      artifactInfo = MediaArtifactService.getArtifact(mediaArtifactId);
    }

    if (!resolvedBytes && bytes) {
      // Ingest on the fly
      const ingestRes = await MediaArtifactService.ingestImage({
        bytes,
        claimedMimeType: metadata.mimeType || "",
        ownerUserId: options.ownerUserId || null,
        caseId: options.caseId || null,
      });
      if (ingestRes.ok) {
        resolvedBytes = ingestRes.internal.buffer;
        artifactInfo = ingestRes.artifact;
        mediaArtifactId = ingestRes.artifact.mediaArtifactId;
      }
    }

    if (!resolvedBytes || resolvedBytes.length === 0) {
      // Return insufficient data policy result
      const fallback = ImageForensicsPolicyV1.evaluate({
        genAiResult: createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION, status: DETECTOR_STATUS.FAILED, reasonCode: "NO_BYTES" }),
        deepfakeResult: createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION, status: DETECTOR_STATUS.FAILED, reasonCode: "NO_BYTES" }),
        manipulationResult: createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.IMAGE_MANIPULATION, status: DETECTOR_STATUS.NOT_SUPPORTED }),
        artifact: {},
      });
      return {
        mediaForensics: fallback.publicDto,
        internalMetadata: fallback.internalMetadata,
      };
    }

    const imageHash = artifactInfo?.sha256 || null;
    const mimeType = artifactInfo?.mimeType || metadata.mimeType || "image/jpeg";
    const format = artifactInfo?.format || (mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpeg");

    // 2. Execute Deterministic Analyzers in Parallel
    const [exifResult, c2paResult, jpegResult, resamplingResult, ocrResult] = await Promise.all([
      Promise.resolve(ExifForensicsAnalyzer.analyze(resolvedBytes)),
      Promise.resolve(C2paProvenanceAnalyzer.analyze(resolvedBytes)),
      Promise.resolve(JpegRecompressionAnalyzer.analyze(resolvedBytes, format)),
      Promise.resolve(ResamplingAnalyzer.analyze(resolvedBytes, { width: artifactInfo?.width || 0, height: artifactInfo?.height || 0 })),
      Promise.resolve(OcrForensicsExtractor.extract({ ocrText: metadata.ocrText || "", regions: metadata.regions || [] })),
    ]);

    // 3. Execute Specialist Detectors (With Caching & Failure Isolation)
    const genAiCacheKey = ForensicCacheService.generateKey({
      imageHash,
      detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION,
      provider: "sightengine",
      policyVersion: FORENSICS_VERSION,
    });

    const deepfakeCacheKey = ForensicCacheService.generateKey({
      imageHash,
      detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION,
      provider: "sightengine",
      policyVersion: FORENSICS_VERSION,
    });

    let cachedGenAi = options.useCache !== false ? ForensicCacheService.get(genAiCacheKey) : null;
    let cachedDeepfake = options.useCache !== false ? ForensicCacheService.get(deepfakeCacheKey) : null;

    const [genAiResult, deepfakeResult, manipulationResult] = await Promise.all([
      cachedGenAi
        ? Promise.resolve(cachedGenAi)
        : this.specialistAdapter.detectGenAi({ bytes: resolvedBytes, mimeType }).then(res => {
            if (res.status === DETECTOR_STATUS.SUCCESS) ForensicCacheService.set(genAiCacheKey, res);
            return res;
          }).catch(err => createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.GENAI_DETECTION, status: DETECTOR_STATUS.FAILED, reasonCode: err.name || "FAILED" })),

      cachedDeepfake
        ? Promise.resolve(cachedDeepfake)
        : this.specialistAdapter.detectDeepfake({ bytes: resolvedBytes, mimeType }).then(res => {
            if (res.status === DETECTOR_STATUS.SUCCESS) ForensicCacheService.set(deepfakeCacheKey, res);
            return res;
          }).catch(err => createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.DEEPFAKE_DETECTION, status: DETECTOR_STATUS.FAILED, reasonCode: err.name || "FAILED" })),

      this.specialistAdapter.detectManipulation({ bytes: resolvedBytes, mimeType }).catch(() =>
        createProviderResult({ detector: FORENSIC_DETECTOR_TYPES.IMAGE_MANIPULATION, status: DETECTOR_STATUS.NOT_SUPPORTED })
      ),
    ]);

    // 4. Multimodal AI Advisory (Gemini) — Non-blocking, Advisory Only
    let advisoryResult = null;
    if (options.useAIGateway !== false) {
      try {
        advisoryResult = await this.advisoryService.advise({
          bytes: resolvedBytes,
          mimeType,
          ocrText: ocrResult.text || metadata.ocrText || "",
          requestId,
        });
      } catch {
        advisoryResult = null;
      }
    }

    // 5. Evaluate Deterministic Forensics Policy V1
    const evaluated = ImageForensicsPolicyV1.evaluate({
      genAiResult,
      deepfakeResult,
      manipulationResult,
      exifResult,
      c2paResult,
      jpegResult,
      resamplingResult,
      ocrResult,
      advisoryResult,
      artifact: {
        mediaArtifactId,
        sha256: imageHash,
        width: artifactInfo?.width || 0,
        height: artifactInfo?.height || 0,
        byteSize: resolvedBytes.length,
        privateStoragePath: artifactInfo?.privateStoragePath || null,
      },
    });

    const durationMs = Date.now() - startedAt;
    evaluated.publicDto.executionTimeMs = durationMs;

    return {
      mediaForensics: evaluated.publicDto,
      internalMetadata: evaluated.internalMetadata,
    };
  }
}
