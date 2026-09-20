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
  verdict: z.string().nullable().optional(),
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
  confidenceExplanation: z.string().min(1).optional(),
  explanation: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  summary: z.string().min(1),
  reasons: z.array(z.string()),
  signals: z.array(z.unknown()),
  evidenceRefs: z.array(z.string()),
  providers: z.array(z.unknown()).optional(),
  provider: z.unknown().nullable().optional(),
  checks: z.array(z.unknown()).optional(),
  checksPerformed: z.array(z.unknown()).optional(),
  sources: z.array(z.unknown()).optional(),
  evidence: z.array(z.unknown()).optional(),
  supportingEvidence: z.array(z.unknown()).optional(),
  contradictoryEvidence: z.array(z.unknown()).optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  sourceCount: z.number().int().nonnegative().nullable().optional(),
  evidenceCount: z.number().int().nonnegative().nullable().optional(),
  sourceQuality: z.number().min(0).max(1).nullable().optional(),
  evidenceAgreement: z.union([z.string(), z.number()]).nullable().optional(),
  verificationCompleteness: z.number().min(0).max(1).nullable().optional(),
  evidenceSummary: z.string().nullable().optional(),
  crossSourceAgreement: z.unknown().nullable().optional(),
  sourceIndependence: z.unknown().nullable().optional(),
  temporalAssessment: z.unknown().nullable().optional(),
  truthStatus: z.string().nullable().optional(),
  securityClassification: z.string().nullable().optional(),
  enforcement: z.string().nullable().optional(),
  recommendedAction: z.string().nullable().optional(),
  decisionConfidence: z.number().min(0).max(1).nullable().optional(),
  keyReasons: z.array(z.string()).optional(),
  claims: z.array(z.unknown()).optional(),
  entities: z.array(z.unknown()).optional(),
  semanticSignals: z.array(z.unknown()).optional(),
  riskSignals: z.array(z.unknown()).optional(),
  verificationTasks: z.array(z.unknown()).optional(),
  mediaForensics: z.unknown().nullable().optional(),
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
  responseContractVersion: z.string().optional(),
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

const fourLayerStageSchema = v5StageSchema.extend({
  pipelineModel: z.literal("FOUR_LAYER").optional(),
  stageId: z.enum(["l1", "l2", "l3", "l4"]),
});

const finalPredictSchema = z.object({
  status: z.string().optional(),
  verdict: z.string().optional(),
  truthVerdict: z.string().optional(),
  truthStatus: z.string().optional(),
  truthAssessment: z.string().optional(),
  security: z.string().optional(),
  securityClassification: z.string().optional(),
  securityRisk: z.string().optional(),
  recommendedAction: z.string().optional(),
  action: z.string().optional(),
  assessmentConfidence: z.number().min(0).max(1).optional(),
  decisionConfidence: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  confidenceKind: z.string().optional(),
  confidenceExplanation: z.string().optional(),
  reason: z.string().nullable().optional(),
  authoritativeComponent: z.string().optional(),
  evidenceAgreement: z.union([z.string(), z.number()]).nullable().optional(),
  sourceQuality: z.number().min(0).max(1).nullable().optional(),
  verificationCompleteness: z.number().min(0).max(1).nullable().optional(),
  evidenceSufficiency: z.string().optional(),
  securityEvidenceStatus: z.string().optional(),
  geminiVerdictSignal: z.string().optional(),
  geminiCitationCount: z.number().int().nonnegative().optional(),
  geminiCitationsValidated: z.boolean().optional(),
  independentSourceCount: z.number().int().nonnegative().optional(),
  evidenceCount: z.number().int().nonnegative().optional(),
  sourceCount: z.number().int().nonnegative().optional(),
  keyReasons: z.array(z.string()).default([]),
  remainingUncertainty: z.array(z.string()).default([]),
  keySources: z.array(z.unknown()).default([]),
  sources: z.array(z.unknown()).default([]),
  topEvidence: z.array(z.unknown()).default([]),
  uncertainties: z.array(z.string()).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  derivedFrom: z.array(z.string()).default([]),
  traceability: z.array(z.unknown()).default([]),
  calls: z.object({ tavily: z.number().int().nonnegative().optional(), ai: z.number().int().nonnegative().optional(), gemini: z.number().int().nonnegative().optional(), finalPredict: z.number().int().nonnegative().optional() }).passthrough().optional(),
}).passthrough();

export const fourLayerTrustPipelineSchema = z.object({
  schemaVersion: z.literal("trust.v5"),
  responseContractVersion: z.string().optional(),
  pipelineVersion: z.string().min(1),
  pipelineModel: z.literal("FOUR_LAYER"),
  publicLayerCount: z.literal(4),
  requestId: z.string().min(1),
  pipelineStatus: z.enum(["IDLE", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED"]),
  currentStage: z.enum(["l1", "l2", "l3", "l4"]).nullable(),
  stages: z.object({ l1: fourLayerStageSchema, l2: fourLayerStageSchema, l3: fourLayerStageSchema, l4: fourLayerStageSchema }),
  finalDecision: z.object({ security: z.string(), truth: z.string(), action: z.string(), securityClassification: z.string(), truthStatus: z.string(), enforcement: z.string(), decisionAuthority: z.literal("FINAL_PREDICT_DETERMINISTIC"), aiOverride: z.literal(false) }).passthrough().nullable(),
  finalPredict: finalPredictSchema.nullable(),
  assurance: z.null(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  audit: z.object({ requestId: z.string(), stageSequence: z.array(z.string()), stageAttempts: z.array(z.unknown()), hardNegativePropagation: z.array(z.unknown()), policyVersion: z.string(), assuranceVersion: z.null() }).passthrough(),
  layerResults: z.object({ layer1: z.unknown().nullable(), layer2: z.unknown().nullable(), layer3: z.unknown().nullable(), layer4: z.unknown().nullable() }).passthrough().optional(),
}).passthrough();

const trustPersistenceStatusSchema = z.enum(["PERSISTED", "EPHEMERAL", "UNAVAILABLE"]);
const trustPersistenceSchema = z.object({
  persisted: z.boolean(),
  idempotent: z.boolean(),
  status: trustPersistenceStatusSchema.optional(),
  errorCode: z.string().trim().min(1).max(120).optional(),
}).passthrough();

export const trustV5ResponseSchema = z.object({
  success: z.literal(true),
  contractVersion: z.literal("trust.v5"),
  requestId: z.string().min(1),
  caseId: z.string().min(1).nullable().optional(),
  caseRevision: z.number().int().positive().nullable().optional(),
  runId: z.string().min(1).nullable().optional(),
  persistence: trustPersistenceSchema.optional(),
  version: z.literal("v5"),
  demo: z.literal(false),
  data: z.union([fourLayerTrustPipelineSchema, trustV5PipelineSchema]),
}).passthrough();

export type RelatedCase = z.infer<typeof relatedCaseSchema>;
export type ThreatProviderResult = z.infer<typeof threatProviderResultSchema>;
export type ExpertConsensus = z.infer<typeof expertConsensusSchema>;
export type TrustLayerResult = z.infer<typeof trustLayerResultSchema>;
export type CanonicalTrustResponse = z.infer<typeof canonicalTrustResponseSchema>;
export type TrustV5Pipeline = z.infer<typeof trustV5PipelineSchema> | z.infer<typeof fourLayerTrustPipelineSchema>;
export type TrustV5Response = z.infer<typeof trustV5ResponseSchema>;
