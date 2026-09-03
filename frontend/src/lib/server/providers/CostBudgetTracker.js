/**
 * StudentHub AI — CostBudgetTracker
 * 
 * Tracks request counts and token budgets to prevent unbounded provider expenses.
 */

import { BudgetExceededError } from "./ProviderErrors.js";

export class CostBudgetTracker {
  constructor({
    maxRequestsPerWindow = 1000,
    maxTokensPerWindow = 500000,
    windowMs = 60 * 1000, // 1 minute
    now = () => Date.now(),
  } = {}) {
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.maxTokensPerWindow = maxTokensPerWindow;
    this.windowMs = windowMs;
    this.now = now;

    this.windowStart = this.now();
    this.requestCount = 0;
    this.tokenCount = 0;
  }

  _rotateWindow() {
    const current = this.now();
    if (current - this.windowStart >= this.windowMs) {
      this.windowStart = current;
      this.requestCount = 0;
      this.tokenCount = 0;
    }
  }

  assertBudget(provider, estimatedTokens = 0) {
    this._rotateWindow();
    if (this.requestCount + 1 > this.maxRequestsPerWindow) {
      throw new BudgetExceededError(provider, {
        budgetLimit: this.maxRequestsPerWindow,
        currentUsage: this.requestCount,
      });
    }
    if (this.tokenCount + estimatedTokens > this.maxTokensPerWindow) {
      throw new BudgetExceededError(provider, {
        budgetLimit: this.maxTokensPerWindow,
        currentUsage: this.tokenCount,
      });
    }
  }

  recordUsage(tokens = 0) {
    this._rotateWindow();
    this.requestCount += 1;
    this.tokenCount += Math.max(0, tokens);
  }

  getMetrics() {
    this._rotateWindow();
    return {
      requests: this.requestCount,
      tokens: this.tokenCount,
      maxRequests: this.maxRequestsPerWindow,
      maxTokens: this.maxTokensPerWindow,
    };
  }
}
