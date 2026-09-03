/**
 * Layer 2 — ISemanticVerificationProvider
 * 
 * Abstract interface for multimodal semantic verification providers.
 * Decouples Layer 2 reasoning from specific AI vendors (Gemini, Anthropic, OpenAI, Local models).
 */

export class ISemanticVerificationProvider {
  /**
   * @param {string} providerId
   */
  constructor(providerId = "abstract_provider") {
    this.providerId = providerId;
  }

  /**
   * Performs semantic & contextual reasoning over multimodal bundle
   * @param {object} params
   * @param {string} params.text
   * @param {string} params.url
   * @param {string} params.ocrText
   * @param {string} params.qrPayload
   * @param {object} params.layer1Result
   * @param {object} params.options
   * @returns {Promise<object>} Structured semantic analysis object
   */
  async analyzeSemantics({ text, url, ocrText, qrPayload, layer1Result, options }) {
    throw new Error(`analyzeSemantics() must be implemented by ${this.constructor.name}`);
  }
}
