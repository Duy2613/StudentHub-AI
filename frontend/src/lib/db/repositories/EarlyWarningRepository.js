/**
 * StudentHub AI — EarlyWarningRepository
 * Production repository abstraction for campus early warnings and incident lifecycle.
 */

import { DatabaseAdapter } from "../DatabaseAdapter.js";

export class EarlyWarningRepository {
  static #adapter = new DatabaseAdapter("early_warnings");

  static async getAllWarnings() {
    return this.#adapter.findAll();
  }

  static async getWarningByKey(warningKey) {
    return this.#adapter.findById(warningKey, "warningKey");
  }

  static async saveWarning(warningKey, warning) {
    const record = {
      ...warning,
      warningKey
    };
    return this.#adapter.save(record, "warningKey");
  }

  static async deleteWarning(warningKey) {
    return this.#adapter.delete(warningKey, "warningKey");
  }

  static async clear() {
    return this.#adapter.clear();
  }
}
