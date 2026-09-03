/**
 * StudentHub AI — AiMemoryGuard V1
 * 
 * Multi-tiered memory architecture and memory-poisoning defense.
 * Segregates Short-Term, Long-Term, Academic Record, Saved Knowledge, and AI Memory.
 * Core Principle: Memory candidates must be validated and auditable before becoming permanent.
 * Backed by durable AiMemoryStore.
 */

import { SocialContentFirewall } from "./SocialContentFirewall.js";
import { AiMemoryStore } from "./AiMemoryStore.js";
import { createSecureId } from "../../security/secureId.js";

export const MEMORY_TIER = Object.freeze({
  SHORT_TERM_CONTEXT: "SHORT_TERM_CONTEXT",
  LONG_TERM_PREFERENCES: "LONG_TERM_PREFERENCES",
  ACADEMIC_RECORD: "ACADEMIC_RECORD",
  SAVED_KNOWLEDGE: "SAVED_KNOWLEDGE",
  AI_CONVERSATION_MEMORY: "AI_CONVERSATION_MEMORY"
});

export class AiMemoryGuard {
  /**
   * Proposes a new memory item for an authenticated subject
   * @param {string} subjectId 
   * @param {object} memoryInput
   * @param {string} memoryInput.text
   * @param {string} [memoryInput.category="PREFERENCE"]
   * @returns {object} ProposeMemoryResult
   */
  static proposeMemory(subjectId, memoryInput = {}) {
    if (!subjectId) throw new Error("[MEMORY_GUARD_ERROR] subjectId is required.");

    const text = (memoryInput.text || "").trim();
    if (!text) throw new Error("[MEMORY_GUARD_ERROR] Memory text cannot be empty.");

    // 1. Check for prompt injection / memory poisoning
    const injectionCheck = SocialContentFirewall.inspectPromptInjection(text);
    if (injectionCheck.hasInjection) {
      return Object.freeze({
        status: "REJECTED_POISONING_ATTEMPT",
        reason: "Nội dung ghi nhớ chứa câu lệnh can thiệp hệ thống bị cấm.",
        candidateId: null
      });
    }

    // 2. Propose as candidate memory
    const candidate = {
      candidateId: createSecureId("cand_mem"),
      subjectId,
      text: SocialContentFirewall.sanitizeText(text),
      category: memoryInput.category || "PREFERENCE",
      status: "PENDING_APPROVAL",
      createdAt: new Date().toISOString()
    };

    const record = AiMemoryStore.getMemoryRecord(subjectId);
    record.candidateMemories.push(candidate);
    AiMemoryStore.saveMemoryRecord(subjectId, record);

    return Object.freeze({
      status: "CANDIDATE_RECORDED",
      candidateId: candidate.candidateId,
      memory: candidate
    });
  }

  /**
   * Approves a candidate memory, promoting it to active AI Memory
   * @param {string} subjectId 
   * @param {string} candidateId 
   * @returns {object} ApprovedMemory
   */
  static approveMemory(subjectId, candidateId) {
    const record = AiMemoryStore.getMemoryRecord(subjectId);
    const candidateIndex = record.candidateMemories.findIndex(c => c.candidateId === candidateId);
    if (candidateIndex === -1) {
      throw new Error(`[MEMORY_GUARD_ERROR] Candidate '${candidateId}' not found.`);
    }

    const [candidate] = record.candidateMemories.splice(candidateIndex, 1);
    const approved = {
      memoryId: createSecureId("mem"),
      subjectId,
      text: candidate.text,
      category: candidate.category,
      approvedAt: new Date().toISOString()
    };

    record.approvedMemories.push(approved);
    AiMemoryStore.saveMemoryRecord(subjectId, record);
    return Object.freeze(approved);
  }

  /**
   * Retrieves all approved AI memories for a subject
   * @param {string} subjectId 
   * @returns {Array<object>}
   */
  static getApprovedMemories(subjectId) {
    const record = AiMemoryStore.getMemoryRecord(subjectId);
    return Object.freeze([...record.approvedMemories]);
  }

  /**
   * Revokes / deletes an approved memory
   * @param {string} subjectId 
   * @param {string} memoryId 
   * @returns {boolean}
   */
  static revokeMemory(subjectId, memoryId) {
    const record = AiMemoryStore.getMemoryRecord(subjectId);
    const initialLen = record.approvedMemories.length;
    record.approvedMemories = record.approvedMemories.filter(m => m.memoryId !== memoryId);
    AiMemoryStore.saveMemoryRecord(subjectId, record);
    return record.approvedMemories.length < initialLen;
  }

  /**
   * Clear all memories (for testing)
   */
  static clear() {
    AiMemoryStore.clear();
  }
}
