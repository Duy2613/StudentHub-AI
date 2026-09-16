import fs from "fs";
import { resolve } from "node:path";

const rootDir = process.cwd();

function readEvidence(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(resolve(rootDir, relativePath), "utf8"));
  } catch {
    return null;
  }
}

const auth = readEvidence("artifacts/final-product-certification/main-auth-snapshot-pre.json");
const rls = readEvidence("artifacts/final-product-certification/main-rls-probe.json");
const providerHealth = readEvidence("docs/reports/canonical_provider_health_snapshot.json");
const generatedAt = new Date().toISOString();
const evidenceInputs = [
  "artifacts/final-product-certification/main-auth-snapshot-pre.json",
  "artifacts/final-product-certification/main-rls-probe.json",
  "docs/reports/canonical_provider_health_snapshot.json",
].filter((relativePath) => fs.existsSync(resolve(rootDir, relativePath)));

const databaseEvidenceReady = Boolean(auth && rls);
const providerEvidenceReady = Boolean(providerHealth?.providers);
const gemini = providerHealth?.providers?.gemini;
const databaseBlockers = [];
const aiBlockers = [];

if (!databaseEvidenceReady) {
  databaseBlockers.push("Current main auth/RLS evidence artifacts are not available.");
}
if (!providerEvidenceReady) {
  aiBlockers.push("Current Gemini live provider evidence is not available.");
} else if (gemini?.status !== "VERIFIED") {
  aiBlockers.push("Gemini live provider evidence is not verified by the current smoke.");
}

const statusRegistry = {
  candidateId: "studenthub-ai-current-source",
  sourceState: "UNCOMMITTED_WORKTREE",
  generatedAt,
  environmentClass: "HYBRID_LOCAL_AND_SUPABASE_PROD_READONLY",
  evidenceInputs,
  subsystems: {
    database: {
      status: databaseEvidenceReady ? "VERIFIED_WITH_WARNINGS" : "PENDING_EVIDENCE",
      measuredAt: auth?.generatedAt || rls?.generatedAt || null,
      metrics: databaseEvidenceReady
        ? {
          authUsers: auth.identity.authUsers,
          profiles: auth.counts?.["public.profiles"]?.count ?? null,
          missingProfiles: auth.identity.missingProfiles,
          orphanProfiles: auth.identity.orphanProfiles,
          duplicateProfileKeys: auth.identity.duplicateProfileKeys,
          missingRoleAssignments: auth.identity.missingRoleAssignments,
          rlsProbe: rls.summary,
        }
        : {},
      limitations: [
        "Supabase advisor output still contains fail-closed no-policy INFO findings and performance findings; review each intended private/public boundary before certification.",
      ],
      blockers: databaseBlockers,
    },
    retrieval: {
      status: "NOT_REASSESSED",
      measuredAt: null,
      metrics: {},
      limitations: ["No current retrieval benchmark was run in this closure continuation."],
      blockers: [],
    },
    privacy: {
      status: "NOT_REASSESSED",
      measuredAt: null,
      metrics: {},
      limitations: ["No current storage privacy benchmark was run in this closure continuation."],
      blockers: [],
    },
    aiOrchestration: {
      status: providerEvidenceReady
        ? (gemini?.status === "VERIFIED" ? "VERIFIED" : "PARTIAL")
        : "PENDING_EVIDENCE",
      measuredAt: providerHealth?.timestamp || null,
      metrics: providerEvidenceReady
        ? {
          gemini: {
            status: gemini.status,
            requestedModels: gemini.requestedModels,
            actualReturnedModel: gemini.actualReturnedModel,
            successCount: gemini.successCount,
            nSamples: gemini.nSamples,
            p50Ms: gemini.p50Ms,
            p95Ms: gemini.p95Ms,
          },
        }
        : {},
      limitations: [
        "Live health is a point-in-time probe; it does not establish production quota, latency SLA, or end-to-end user-flow closure.",
      ],
      blockers: aiBlockers,
    },
    aiEvaluation: {
      status: "NOT_REASSESSED",
      measuredAt: null,
      metrics: {},
      limitations: ["No statistical holdout accuracy claim is made by this status registry."],
      blockers: [],
    },
  },
};

const outputPath = resolve(rootDir, "docs/reports/STUDENTHUB_CANONICAL_VERIFICATION_STATUS.json");
fs.writeFileSync(outputPath, `${JSON.stringify(statusRegistry, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
