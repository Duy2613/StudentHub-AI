import test from "node:test";
import assert from "node:assert/strict";
import {
  deduplicateQuestionCandidates,
  normalizeModalityInputs,
  questionGenerationResponseSchema,
  redactQuestionForPreSubmit,
  validateQuestionCandidate,
} from "../../src/lib/server/expert/ExpertQuestionPipeline.js";
import { gradeExpertV5Question } from "../../src/lib/server/expert/ExpertV5Domain.js";

const sourceId = "11111111-1111-4111-8111-111111111111";
const claimId = "22222222-2222-4222-8222-222222222222";
const evidenceId = "33333333-3333-4333-8333-333333333333";
const scenario = { scenarioId: "44444444-4444-4444-8444-444444444444", modality: "TEXT_URL_IMAGE", inputFingerprint: "f".repeat(64) };
const packageData = {
  sources: [{ id: sourceId, contentHash: "a".repeat(64) }],
  claims: [{ id: claimId, statement: "The official notice gives the effective date.", evidenceIds: [evidenceId], sourceIds: [sourceId] }],
  evidence: [{ id: evidenceId, sourceId, sourceType: "OFFICIAL_NOTICE", provenance: { excerpt: "Effective from January 2026." } }],
};

function candidate(overrides = {}) {
  return {
    questionType: "SINGLE_CHOICE",
    prompt: "Which effective date is directly supported by the official notice?",
    choices: [{ id: "a", label: "January 2026" }, { id: "b", label: "January 2025" }],
    correctChoiceIds: ["a"],
    explanation: "The official notice explicitly states the effective date in its published text.",
    rubric: { criteria: ["Uses the date in the official notice."], gradingNote: "Choose only the directly supported date." },
    sourceIds: [sourceId],
    claimIds: [claimId],
    evidenceIds: [evidenceId],
    correctAnswerEvidenceIds: [evidenceId],
    difficulty: "EASY",
    reasoningComplexity: 0,
    temporalReasoning: false,
    uncertaintyMode: "CLEAR",
    skills: ["SOURCE_VERIFICATION"],
    limitations: [],
    ...overrides,
  };
}

test("four input types normalize only to the supported canonical combinations", () => {
  for (const [types, expected] of [
    [["TEXT"], "TEXT"], [["URL"], "URL"], [["IMAGE"], "IMAGE"], [["QR"], "QR"],
    [["URL", "TEXT"], "TEXT_URL"], [["IMAGE", "TEXT"], "TEXT_IMAGE"],
    [["URL", "IMAGE"], "IMAGE_URL"], [["QR", "URL"], "QR_URL"],
    [["IMAGE", "TEXT", "URL"], "TEXT_URL_IMAGE"],
  ]) {
    assert.deepEqual(normalizeModalityInputs(types.map((type) => ({ type }))), {
      valid: true, code: null, modality: expected, inputTypes: types,
    });
  }
  assert.equal(normalizeModalityInputs([{ type: "TEXT" }, { type: "QR" }]).valid, false);
  assert.equal(normalizeModalityInputs(Array.from({ length: 6 }, () => ({ type: "TEXT" }))).valid, false);
  assert.equal(questionGenerationResponseSchema(99).properties.questions.maxItems, 5);
});

test("candidate validation binds choices, sources, claims, evidence and answer support to the canonical package", () => {
  const result = validateQuestionCandidate(candidate(), { scenario, packageData });
  assert.equal(result.valid, true, result.reasons.join(", "));
  assert.equal(result.status, "AUTO_VALIDATED");
  assert.equal(result.question.answerKey, "a");

  const unresolved = validateQuestionCandidate(candidate({ evidenceIds: ["not-in-package"] }), { scenario, packageData });
  assert.ok(unresolved.reasons.includes("EVIDENCE_REFERENCE_UNRESOLVED"));
  assert.ok(unresolved.reasons.includes("ANSWER_EVIDENCE_NOT_MAPPED"));

  const wrongClaimEvidence = {
    ...packageData,
    claims: [{ ...packageData.claims[0], evidenceIds: ["other-evidence"] }],
  };
  const unsupported = validateQuestionCandidate(candidate(), { scenario, packageData: wrongClaimEvidence });
  assert.ok(unsupported.reasons.includes("CLAIM_EVIDENCE_MAPPING_INVALID"));
});

test("image, QR and redirect question types require a compatible scenario modality", () => {
  const image = validateQuestionCandidate(candidate({ questionType: "IMAGE_CONTEXT" }), { scenario, packageData });
  assert.equal(image.valid, true, image.reasons.join(", "));
  const qr = validateQuestionCandidate(candidate({ questionType: "QR_SAFETY" }), { scenario, packageData });
  assert.ok(qr.reasons.includes("QUESTION_TYPE_MODALITY_MISMATCH"));
  const redirect = validateQuestionCandidate(candidate({ questionType: "URL_REDIRECT" }), { scenario, packageData });
  assert.equal(redirect.valid, true, redirect.reasons.join(", "));
});

test("source ranking retains order while unordered multi-answer keys compare as sets", () => {
  const ranking = validateQuestionCandidate(candidate({
    questionType: "SOURCE_RANKING",
    choices: [{ id: "official", label: "Official notice" }, { id: "news", label: "News report" }, { id: "post", label: "Social post" }],
    correctChoiceIds: ["official", "news", "post"],
  }), { scenario, packageData });
  assert.equal(ranking.valid, true, ranking.reasons.join(", "));
  assert.deepEqual(ranking.question.answerKey, ["official", "news", "post"]);
  assert.equal(gradeExpertV5Question({ questionType: "SOURCE_RANKING", answerKey: ["official", "news"], answer: ["news", "official"] }).correct, false);
  assert.equal(gradeExpertV5Question({ questionType: "MULTI_SELECT", answerKey: ["a", "c"], answer: ["c", "a"] }).correct, true);
});

test("dedup rejects exact normalized prompts without blocking distinct questions on the same claims", () => {
  const first = validateQuestionCandidate(candidate(), { scenario, packageData });
  const sameTypeParaphrase = validateQuestionCandidate(candidate({
    prompt: "Which date does the official notice directly identify as the start date?",
  }), { scenario, packageData });
  const distinctTask = validateQuestionCandidate(candidate({
    questionType: "BEST_EVIDENCE",
    prompt: "Which evidence item most directly states the effective date?",
  }), { scenario, packageData });
  assert.equal(first.sourceClaimFingerprint, sameTypeParaphrase.sourceClaimFingerprint);
  assert.notEqual(first.sourceClaimFingerprint, distinctTask.sourceClaimFingerprint);
  const result = deduplicateQuestionCandidates([first, sameTypeParaphrase, distinctTask, first]);
  assert.equal(result.accepted.length, 2);
  assert.equal(result.rejected.length, 2);
  assert.deepEqual(result.rejected.map((entry) => entry.reason), ["DUPLICATE_SOURCE_CLAIM_TYPE", "DUPLICATE_NORMALIZED_PROMPT"]);
  assert.equal(result.semanticDedup, "NOT_CONFIGURED");
});

test("pre-submit projection omits answer key, answer evidence and grading rubric", () => {
  const safe = redactQuestionForPreSubmit({
    prompt: "Choose the supported date.", choices: [{ id: "a", label: "January" }],
    answerKey: "a", correctAnswerEvidenceIds: [evidenceId], rubric: { gradingNote: "private" },
  });
  assert.deepEqual(safe, { prompt: "Choose the supported date.", choices: [{ id: "a", label: "January" }] });
});
