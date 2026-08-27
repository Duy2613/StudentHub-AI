/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityContext V1
 * 
 * Manages request-scoped security context, correlation tracking,
 * client metadata, and security event correlation.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { SecurityPrincipal } from "./SecurityPrincipal.js";

const asyncLocalStorage = new AsyncLocalStorage();

export class SecurityContext {
  #correlationId;
  #principal;
  #clientIp;
  #userAgent;
  #purpose;
  #timestamp;
  #auditEvents;

  /**
   * @param {object} params
   * @param {string} [params.correlationId]
   * @param {SecurityPrincipal} [params.principal]
   * @param {string} [params.clientIp]
   * @param {string} [params.userAgent]
   * @param {string} [params.purpose]
   * @param {string} [params.timestamp]
   */
  constructor({
    correlationId = null,
    principal = null,
    clientIp = "127.0.0.1",
    userAgent = "Unknown",
    purpose = "GENERAL_OPERATION",
    timestamp = new Date().toISOString()
  } = {}) {
    this.#correlationId = correlationId || `sec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.#principal = principal instanceof SecurityPrincipal ? principal : SecurityPrincipal.anonymous();
    this.#clientIp = String(clientIp || "127.0.0.1").trim();
    this.#userAgent = String(userAgent || "Unknown").trim();
    this.#purpose = String(purpose || "GENERAL_OPERATION").trim().toUpperCase();
    this.#timestamp = timestamp;
    this.#auditEvents = [];
  }

  get correlationId() { return this.#correlationId; }
  get principal() { return this.#principal; }
  get clientIp() { return this.#clientIp; }
  get userAgent() { return this.#userAgent; }
  get purpose() { return this.#purpose; }
  get timestamp() { return this.#timestamp; }
  get auditEvents() { return Object.freeze([...this.#auditEvents]); }

  /**
   * Appends an audit event to the context
   * @param {object} event 
   */
  recordAuditEvent(event) {
    if (!event || typeof event !== "object") return;
    this.#auditEvents.push({
      ...event,
      correlationId: this.#correlationId,
      subjectId: this.#principal.subjectId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Executes an asynchronous function within this security context
   * @param {Function} callback 
   * @returns {Promise<any>}
   */
  run(callback) {
    return asyncLocalStorage.run(this, callback);
  }

  /**
   * Retrieves current security context from AsyncLocalStorage if active
   * @returns {SecurityContext|null}
   */
  static current() {
    return asyncLocalStorage.getStore() || null;
  }

  /**
   * Creates a context from an incoming HTTP Request
   * @param {Request} request 
   * @param {SecurityPrincipal} [principal]
   * @returns {SecurityContext}
   */
  static fromRequest(request, principal = null) {
    const headers = request?.headers;
    const correlationId = headers?.get("x-correlation-id") ||
                          headers?.get("x-request-id") ||
                          `sec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    
    const clientIp = headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     headers?.get("x-real-ip") ||
                     "127.0.0.1";
                     
    const userAgent = headers?.get("user-agent") || "Unknown";
    const purpose = headers?.get("x-security-purpose") || "GENERAL_OPERATION";

    return new SecurityContext({
      correlationId,
      principal: principal || SecurityPrincipal.anonymous(),
      clientIp,
      userAgent,
      purpose
    });
  }
}
