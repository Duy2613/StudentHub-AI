/**
 * StudentHub AI — AiMemoryRepository
 * Production repository abstraction for approved & candidate AI memories.
 */

import { DatabaseAdapter } from "../DatabaseAdapter.js";

export class AiMemoryRepository {
  static #adapter = new DatabaseAdapter("ai_memories");

  static async getMemoryRecord(subjectId) {
    if (!subjectId) return { approvedMemories: [], candidateMemories: [] };
    const found = await this.#adapter.findById(subjectId, "subjectId");
    return found || {
      subjectId,
      approvedMemories: [],
      candidateMemories: []
    };
  }

  static async saveMemoryRecord(subjectId, record) {
    const data = {
      ...record,
      subjectId
    };
    return this.#adapter.save(data, "subjectId");
  }

  static async clear() {
    return this.#adapter.clear();
  }
}
