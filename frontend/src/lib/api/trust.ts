import { apiRequest } from "./client";
import { trustEvidenceResultSchema, trustReasoningResultSchema, trustScreenResultSchema, trustSemanticResultSchema, type TrustLayerResult } from "./schemas/trust";

export type { ExpertConsensus, RelatedCase, ThreatProviderResult, TrustLayerResult } from "./schemas/trust";

export type TrustInput = {
  type: "text" | "url" | "image";
  content: string;
  metadata?: Record<string, unknown>;
};

export const trustApi = {
  screen(input: TrustInput, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/screen", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
      schema: trustScreenResultSchema,
    });
  },
  semantic(input: TrustInput, layer1Result: TrustLayerResult, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/semantic", {
      method: "POST",
      body: JSON.stringify({ ...input, layer1Result }),
      signal,
      schema: trustSemanticResultSchema,
    });
  },
  evidence(layer2Result: TrustLayerResult, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/evidence", {
      method: "POST",
      body: JSON.stringify({
        claims: layer2Result?.claims || [],
        candidateSources: layer2Result?.verificationPackage?.candidateSources || [],
        layer2Result,
      }),
      signal,
      schema: trustEvidenceResultSchema,
    });
  },
  reasoning(layer1Result: TrustLayerResult, layer2Result: TrustLayerResult | null, layer3Result: TrustLayerResult | null, signal?: AbortSignal) {
    return apiRequest<TrustLayerResult>("/api/ai-trust/reasoning", {
      method: "POST",
      body: JSON.stringify({ layer1Result, layer2Result, layer3Result }),
      signal,
      schema: trustReasoningResultSchema,
    });
  },
};
