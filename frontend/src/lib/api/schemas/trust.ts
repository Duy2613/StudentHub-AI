import { z } from "zod";

export const relatedCaseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  similarity: z.number().min(0).max(1),
  sharedSignals: z.array(z.string()).default([]),
  observedAt: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

export const threatProviderResultSchema = z.object({
  provider: z.string(),
  status: z.enum(["clean", "findings", "unknown", "error", "unavailable"]),
  observedAt: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
  signals: z.array(z.string()).default([]),
  reference: z.string().optional(),
}).passthrough();

export const expertConsensusSchema = z.object({
  reviewCount: z.number().int().nonnegative(),
  agreement: z.string().optional(),
  disagreementLevel: z.string(),
  assessments: z.array(z.object({
    expertId: z.string().optional(),
    status: z.string(),
    rationale: z.string().optional(),
  }).passthrough()).optional(),
}).passthrough();

const claimSchema = z.object({
  text: z.string().optional(),
  claim: z.string().optional(),
  statement: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

export const trustLayerResultSchema = z.object({
  status: z.string().optional(),
  claims: z.array(claimSchema).optional(),
  verificationPackage: z.object({ candidateSources: z.array(z.unknown()).optional() }).passthrough().optional(),
  verificationCompleteness: z.number().optional(),
  evidenceCompleteness: z.number().optional(),
  sourceAgreement: z.string().optional(),
  riskLevel: z.string().optional(),
  riskAssessment: z.object({ level: z.string().optional(), confidence: z.number().optional() }).passthrough().optional(),
  confidence: z.number().optional(),
  confidenceScore: z.number().optional(),
  userExplanation: z.object({ verdictTitle: z.string().optional(), why: z.string().optional(), riskSummary: z.string().optional(), recommendedActionNote: z.string().optional() }).passthrough().optional(),
  relatedCases: z.array(relatedCaseSchema).optional(),
  providerResults: z.array(threatProviderResultSchema).optional(),
  expertConsensus: expertConsensusSchema.optional(),
}).passthrough();

export const trustScreenResultSchema = trustLayerResultSchema.extend({ status: z.string().min(1) });
export const trustSemanticResultSchema = trustLayerResultSchema.extend({ status: z.string().min(1) });
export const trustEvidenceResultSchema = trustLayerResultSchema.extend({ status: z.string().min(1) });
export const trustReasoningResultSchema = trustLayerResultSchema.extend({ status: z.string().min(1) });

export const canonicalTrustResponseSchema = z.object({
  success: z.literal(true),
  contractVersion: z.literal("trust.v1"),
  requestId: z.string().min(1),
  depth: z.literal("full"),
  demo: z.literal(false),
  data: z.object({
    input: z.object({ type: z.string().min(1) }).passthrough(),
    layer1: trustLayerResultSchema,
    layer2A: trustLayerResultSchema.nullable().optional(),
    layer2: trustLayerResultSchema.nullable().optional(),
    layer3: trustLayerResultSchema.nullable().optional(),
    layer4: trustLayerResultSchema.nullable().optional(),
  }).passthrough(),
}).passthrough();

export type RelatedCase = z.infer<typeof relatedCaseSchema>;
export type ThreatProviderResult = z.infer<typeof threatProviderResultSchema>;
export type ExpertConsensus = z.infer<typeof expertConsensusSchema>;
export type TrustLayerResult = z.infer<typeof trustLayerResultSchema>;
export type CanonicalTrustResponse = z.infer<typeof canonicalTrustResponseSchema>;
