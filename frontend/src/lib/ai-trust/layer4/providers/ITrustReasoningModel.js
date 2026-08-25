/**
 * Layer 4 — ITrustReasoningModel
 * 
 * Abstract interface for Layer 4 reasoning providers.
 */

export class ITrustReasoningModel {
  constructor(providerId = "abstract_trust_model") {
    this.providerId = providerId;
  }

  /**
   * Reason over fused evidence to produce final verdict
   * @param {object} fusedGraph
   * @returns {Promise<object>}
   */
  async reason(fusedGraph) {
    throw new Error(`reason() must be implemented by ${this.constructor.name}`);
  }
}
