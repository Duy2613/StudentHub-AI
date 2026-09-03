/**
 * StudentHub AI — Provider Typed Errors
 */

export class ProviderError extends Error {
  constructor(message, { code = "PROVIDER_ERROR", provider = "unknown", statusCode = 502, cause = null } = {}) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.provider = provider;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message = "Provider request timed out", { provider = "unknown", timeoutMs = 5000 } = {}) {
    super(message, { code: "PROVIDER_TIMEOUT", provider, statusCode: 504 });
    this.name = "ProviderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class CircuitBreakerOpenError extends ProviderError {
  constructor(provider = "unknown", { resetAt = null } = {}) {
    super(`Circuit breaker is OPEN for provider '${provider}'. Request rejected to protect upstream.`, {
      code: "CIRCUIT_BREAKER_OPEN",
      provider,
      statusCode: 503,
    });
    this.name = "CircuitBreakerOpenError";
    this.resetAt = resetAt;
  }
}

export class BudgetExceededError extends ProviderError {
  constructor(provider = "unknown", { budgetLimit = 0, currentUsage = 0 } = {}) {
    super(`Rate or cost budget exceeded for provider '${provider}' (usage: ${currentUsage}, limit: ${budgetLimit}).`, {
      code: "BUDGET_EXCEEDED",
      provider,
      statusCode: 429,
    });
    this.name = "BudgetExceededError";
    this.budgetLimit = budgetLimit;
    this.currentUsage = currentUsage;
  }
}

export class ProviderCancelledError extends ProviderError {
  constructor(provider = "unknown") {
    super(`Provider execution for '${provider}' was cancelled via AbortSignal.`, {
      code: "PROVIDER_CANCELLED",
      provider,
      statusCode: 499,
    });
    this.name = "ProviderCancelledError";
  }
}
