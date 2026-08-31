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

const v5OperationStatusSchema = z.enum(["NOT_STARTED", "QUEUED", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED", "BLOCKED"]);
const v5StageSchema = z.object({
  schemaVersion: z.string().min(1),
  requestId: z.string().min(1),
  stageId: z.enum(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]),
  architecturalLayer: z.string().min(1),
  stageName: z.string().min(1),
  role: z.string().min(1),
  checking: z.string().min(1),
  operationStatus: v5OperationStatusSchema,
  finding: z.string().nullable(),
  severity: z.string().min(1),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  latencyMs: z.number().nonnegative().nullable(),
  providerStatus: z.string().min(1),
  providerId: z.string().nullable(),
  modelId: z.string().nullable(),
  modelVersion: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  confidenceKind: z.string().min(1),
  summary: z.string().min(1),
  reasons: z.array(z.string()),
  signals: z.array(z.unknown()),
  evidenceRefs: z.array(z.string()),
  meaning: z.string().min(1),
  notProve: z.string().min(1),
  limitations: z.array(z.string()).min(1),
  nextStage: z.string().nullable(),
  safeToContinue: z.boolean(),
  userAction: z.string().min(1),
  audit: z.object({ attempt: z.number().int().nonnegative(), attemptCount: z.number().int().nonnegative(), errorCode: z.string().nullable(), transition: z.string() }).passthrough(),
}).passthrough();

export const trustV5PipelineSchema = z.object({
  schemaVersion: z.literal("trust.v5"),
  pipelineVersion: z.string().min(1),
  requestId: z.string().min(1),
  pipelineStatus: z.enum(["IDLE", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]),
  currentStage: z.enum(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]).nullable(),
  stages: z.object({ l1: v5StageSchema, l2a: v5StageSchema, l2b: v5StageSchema, l2c: v5StageSchema, l3: v5StageSchema, l4: v5StageSchema, l5: v5StageSchema }),
  finalDecision: z.object({ security: z.string(), truth: z.string(), action: z.string(), securityClassification: z.string(), truthStatus: z.string(), enforcement: z.string(), presentedTruthStatus: z.string(), presentedEnforcement: z.string(), l4Decision: z.object({ security: z.string(), truth: z.string(), action: z.string() }).passthrough(), assuranceStatus: z.string(), assuranceApplied: z.boolean(), decisionAuthority: z.literal("L4_DETERMINISTIC_POLICY"), assuranceAuthority: z.literal("L5_DOWNGRADE_ONLY"), isHardNegative: z.boolean() }).passthrough().nullable(),
  assurance: z.object({ status: z.string(), anomalies: z.array(z.unknown()), assuranceReasons: z.array(z.string()), recommendedRechecks: z.array(z.string()), auditVersion: z.string(), downgradeOnly: z.literal(true) }).passthrough().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  audit: z.object({ requestId: z.string(), stageSequence: z.array(z.string()), stageAttempts: z.array(z.unknown()), hardNegativePropagation: z.array(z.unknown()), policyVersion: z.string(), assuranceVersion: z.string() }).passthrough(),
  layerResults: z.object({ layer1: z.unknown().nullable(), layer2A: z.unknown().nullable(), layer2B: z.unknown().nullable(), layer2C: z.unknown().nullable(), layer3: z.unknown().nullable(), layer4: z.unknown().nullable() }).passthrough().optional(),
}).passthrough();

export const trustV5ResponseSchema = z.object({
  success: z.literal(true),
  contractVersion: z.literal("trust.v5"),
  requestId: z.string().min(1),
  version: z.literal("v5"),
  demo: z.literal(false),
  data: trustV5PipelineSchema,
}).passthrough();

export type RelatedCase = z.infer<typeof relatedCaseSchema>;
export type ThreatProviderResult = z.infer<typeof threatProviderResultSchema>;
export type ExpertConsensus = z.infer<typeof expertConsensusSchema>;
export type TrustLayerResult = z.infer<typeof trustLayerResultSchema>;
export type CanonicalTrustResponse = z.infer<typeof canonicalTrustResponseSchema>;
export type TrustV5Pipeline = z.infer<typeof trustV5PipelineSchema>;
export type TrustV5Response = z.infer<typeof trustV5ResponseSchema>;
