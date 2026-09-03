/**
 * StudentHub AI — TrustCasePassportBinder
 * 
 * Authoritatively binds authenticated Trust Cases to Living Evidence Passports.
 * Enforces Phase 3 of Master Backend Completion:
 * - Maps Trust Engine V5 verdicts to canonical PASSPORT_STATUS
 * - Creates/Appends immutable, append-only Passport events
 * - Persists into public.evidence_passports and public.evidence_passport_events
 * - Dispatches material change notifications when risk level shifts
 */

import crypto from "node:crypto";
import {
  PASSPORT_STATUS,
  PASSPORT_EVENT_TYPE,
  PROVENANCE_CLASS,
  createEvidencePassport,
  appendEvidenceEvent,
} from "./evidencePassportModel.js";
import { PostgresCrossSystemRepository } from "../crossSystem/PostgresCrossSystemRepository.js";

function mapVerdictToPassportStatus(verdict) {
  const v = String(verdict || "").toUpperCase();
  if (v === "CLEAR" || v === "SUPPORTED" || v === "PASS" || v === "ALLOW") {
    return PASSPORT_STATUS.SUPPORTED;
  }
  if (v === "BLOCK" || v === "MALICIOUS") {
    return PASSPORT_STATUS.DANGEROUS;
  }
  if (v === "SUSPICIOUS" || v === "FLAG" || v === "WARN") {
    return PASSPORT_STATUS.SUSPICIOUS;
  }
  return PASSPORT_STATUS.INSUFFICIENT_EVIDENCE;
}

export class TrustCasePassportBinder {
  /**
   * Binds an evaluated Trust Case to a durable Evidence Passport for the owner.
   * 
   * @param {object} params
   * @param {string} params.caseId - UUID of the trust_case
   * @param {string} params.ownerId - UUID of the authenticated owner
   * @param {object} params.pipelineResult - The V5 pipeline output
   * @param {object} params.input - Input payload { type, content, metadata }
   * @returns {Promise<object>} Persisted passport DTO
   */
  static async bindCaseToPassport({
    caseId,
    ownerId,
    pipelineResult = {},
    input = {},
  }) {
    if (!caseId || !ownerId) {
      throw new Error("BIND_PASSPORT_ERROR: caseId and ownerId are mandatory.");
    }

    const repository = new PostgresCrossSystemRepository();
    const verdict = pipelineResult.decision?.verdict
      || pipelineResult.finalDecision?.action
      || pipelineResult.state
      || "INSUFFICIENT_EVIDENCE";

    const targetStatus = mapVerdictToPassportStatus(verdict);
    const titleSnippet = input.type === "url"
      ? (input.content || input.metadata?.url || "Kiểm tra liên kết")
      : (input.content ? input.content.slice(0, 60) : "Đánh giá nội dung");
    const passportTitle = `Hồ sơ xác minh: ${titleSnippet}`;

    const timestamp = new Date().toISOString();

    // Collect references from pipeline evidence
    const rawRefs = pipelineResult.layers?.layer3?.sources || [];
    const references = rawRefs.slice(0, 5).map((s, idx) => ({
      id: `ref_${caseId}_${idx}`,
      label: s.title || s.url || `Nguồn đối chiếu ${idx + 1}`,
      sourceType: "EXTERNAL_WEB",
    }));

    // Check if passport already exists for this case
    const existingList = await repository.listPassports(ownerId);
    const existing = existingList.find((p) => p.subjectType === "TRUST_CASE" && p.subjectId === caseId);

    if (!existing) {
      // 1. Create fresh Passport with evaluated targetStatus at revision 1
      const passport = createEvidencePassport({
        id: crypto.randomUUID(),
        ownerId,
        title: passportTitle,
        subjectType: "TRUST_CASE",
        subjectId: caseId,
        initialStatus: targetStatus,
        createdAt: timestamp,
        demo: false,
      });

      const saved = await repository.createPassport(passport);
      return saved;
    }

    // If passport already exists and status changed, append new revision event
    if (existing.currentStatus !== targetStatus) {
      const fullExisting = await repository.getPassport(ownerId, existing.id);
      const updatedPassport = appendEvidenceEvent(fullExisting, {
        id: `${existing.id}:rev_${existing.revision + 1}`,
        type: PASSPORT_EVENT_TYPE.RESULT_CHANGED,
        provenanceClass: PROVENANCE_CLASS.TRUST_ENGINE,
        summary: `Trạng thái hồ sơ thay đổi từ ${existing.currentStatus} sang ${targetStatus}.`,
        occurredAt: timestamp,
        previousStatus: existing.currentStatus,
        newStatus: targetStatus,
        material: true,
        changeReason: pipelineResult.decision?.reasons?.[0] || "Cập nhật dữ liệu từ lần quét mới",
        references,
        metadata: {
          caseId,
          verdict,
          confidence: pipelineResult.decision?.confidence || null,
        },
      });

      const saved = await repository.appendPassportEvent(ownerId, updatedPassport);
      return saved;
    }

    return existing;
  }
}
