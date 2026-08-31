/**
 * AI Gateway — IModelProvider
 *
 * Abstract adapter interface. Every vendor (OpenAI-compatible proxy, Gemini,
 * future Anthropic/local models, ...) implements this contract so the
 * ModelRouter and domain Layers never depend on vendor-specific request/
 * response shapes.
 */

export class IModelProvider {
  /**
   * @param {string} providerFamily - one of PROVIDER_FAMILY
   */
  constructor(providerFamily) {
    this.providerFamily = providerFamily;
  }

  /**
   * @param {object} catalogEntry - entry from AI_GATEWAY_CONFIG.MODEL_CATALOG
   * @returns {boolean} true if required secrets/config are present
   */
  isConfigured() {
    throw new Error(`isConfigured() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Executes a single-turn generation call against the given model.
   * @param {object} params
   * @param {object} params.catalogEntry - target model catalog entry
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {boolean} [params.jsonMode] - request structured JSON output
   * @param {number} [params.timeoutMs]
   * @param {number} [params.maxOutputTokens]
   * @param {AbortSignal} [params.signal] - caller cancellation signal
   * @returns {Promise<{ text: string }>} raw text content (JSON-mode text is still a string)
   */
  async generate() {
    throw new Error(`generate() must be implemented by ${this.constructor.name}`);
  }
}
