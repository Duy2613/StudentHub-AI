/**
 * Golden evaluation fixture. It is intentionally data-only and never used as
 * production evidence. The two claims prevent the UI from collapsing “the
 * programme exists” into “a money transfer is legitimate”.
 */
export const GOLDEN_SCHOLARSHIP_CASE = Object.freeze({
  caseId: "golden-scholarship-transfer-2026",
  caseRevision: 1,
  title: "Thông báo học bổng yêu cầu chuyển tiền",
  claims: Object.freeze([
    Object.freeze({
      claimId: "claim-programme-exists",
      statement: "Chương trình học bổng được trường công bố là có tồn tại.",
      scope: "PROGRAM_EXISTENCE",
    }),
    Object.freeze({
      claimId: "claim-transfer-legitimate",
      statement: "Yêu cầu chuyển tiền vào tài khoản cá nhân là hợp pháp và bắt buộc.",
      scope: "MONEY_TRANSFER_LEGITIMACY",
    }),
  ]),
  evidence: Object.freeze([
    Object.freeze({ evidenceId: "evidence-official-notice-v1", claimId: "claim-programme-exists", relationship: "SUPPORTS", sourceType: "OFFICIAL_NOTICE" }),
    Object.freeze({ evidenceId: "evidence-bank-warning-v1", claimId: "claim-transfer-legitimate", relationship: "CONTRADICTS", sourceType: "BANK_WARNING" }),
  ]),
});

export function assertGoldenCaseSeparation(caseFixture = GOLDEN_SCHOLARSHIP_CASE) {
  const claimIds = new Set(caseFixture.claims.map((claim) => claim.claimId));
  return claimIds.size === 2
    && claimIds.has("claim-programme-exists")
    && claimIds.has("claim-transfer-legitimate")
    && caseFixture.evidence.every((evidence) => claimIds.has(evidence.claimId));
}

