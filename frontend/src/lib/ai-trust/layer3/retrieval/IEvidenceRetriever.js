/**
 * Layer 3 — IEvidenceRetriever
 * 
 * Abstract interface for evidence retrieval engines.
 * Decouples Layer 3 verification from specific search engines or local repositories.
 */

export class IEvidenceRetriever {
  constructor(retrieverId = "abstract_retriever") {
    this.retrieverId = retrieverId;
  }

  /**
   * Searches for candidate sources across queries
   * @param {Array<object>} queries
   * @param {object} options
   * @returns {Promise<Array<object>>} Array of Candidate Source DTOs
   */
  async search(queries, options = {}) {
    throw new Error(`search() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Safely fetches content from a validated source URL
   * @param {string} url
   * @returns {Promise<object>} { html, textContent, status }
   */
  async fetch(url) {
    throw new Error(`fetch() must be implemented by ${this.constructor.name}`);
  }
}
