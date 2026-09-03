/**
 * StudentHub AI — Bulkhead
 * 
 * Concurrency limiter to isolate provider workloads and prevent socket exhaustion.
 */

import { ProviderError } from "./ProviderErrors.js";

export class Bulkhead {
  constructor({ maxConcurrent = 10, provider = "unknown" } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.provider = provider;
    this.activeCount = 0;
  }

  async acquire() {
    if (this.activeCount >= this.maxConcurrent) {
      throw new ProviderError(
        `Bulkhead limit of ${this.maxConcurrent} reached for provider '${this.provider}'. Request shed.`,
        { code: "BULKHEAD_SHED", provider: this.provider, statusCode: 503 }
      );
    }
    this.activeCount += 1;
  }

  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
  }

  async execute(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
