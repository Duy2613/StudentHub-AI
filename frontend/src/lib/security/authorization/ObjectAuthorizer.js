/**
 * StudentHub AI — Zero-Trust Security Fabric
 * ObjectAuthorizer & FunctionAuthorizer V1
 * 
 * Object-Level (BOLA defense) & Function-Level (BFLA defense) security boundaries.
 */

import { ReBACPolicy, RELATIONSHIPS } from "./ReBACPolicy.js";
import { RBACPolicy } from "./RBACPolicy.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export class ObjectAuthorizer {
  /**
   * Asserts ownership or authorized relationship to a target resource
   * @param {SecurityPrincipal} principal 
   * @param {object} resource 
   * @param {string} [relationship]
   * @throws {SecurityError} 403 Forbidden if check fails
   */
  static assertAccess(principal, resource, relationship = RELATIONSHIPS.OWNS) {
    if (!principal || !principal.isAuthenticated) {
      throw SecurityError.unauthorized("Authentication required to access this resource.");
    }

    if (!resource) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.FORBIDDEN,
        message: "Target resource not found or access is prohibited.",
        statusCode: 404
      });
    }

    const evaluation = ReBACPolicy.evaluate({
      principal,
      resource,
      requiredRelationship: relationship
    });

    if (!evaluation.allowed) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.OBJECT_NOT_OWNED,
        message: "You are not authorized to view or mutate this resource.",
        statusCode: 403,
        details: { reason: evaluation.reason }
      });
    }

    return true;
  }
}

export class FunctionAuthorizer {
  /**
   * Asserts function-level permission (BFLA Defense)
   * @param {SecurityPrincipal} principal 
   * @param {string} requiredPermission 
   * @throws {SecurityError} 403 Forbidden if missing permission
   */
  static assertPermission(principal, requiredPermission) {
    if (!principal || !principal.isAuthenticated) {
      throw SecurityError.unauthorized("Authentication required to execute this operation.");
    }

    const hasPerm = RBACPolicy.hasPermission(principal.roles, requiredPermission);
    if (!hasPerm) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.INSUFFICIENT_PERMISSION,
        message: `Missing required function permission: '${requiredPermission}'.`,
        statusCode: 403
      });
    }

    return true;
  }
}
