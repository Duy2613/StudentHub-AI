/**
 * StudentHub AI — Device Management & Cross-Device Sync Engine V1
 * Manages authorized user devices, session synchronization, and server-authoritative conflict resolution.
 * Backed by durable DeviceSyncStore.
 */

import crypto from "node:crypto";
import { SessionManager } from "../security/identity/SessionManager.js";
import { DeviceSyncStore } from "./DeviceSyncStore.js";

export const DEVICE_PLATFORM = Object.freeze({
  DESKTOP_WEB: "DESKTOP_WEB",
  MOBILE_IOS: "MOBILE_IOS",
  MOBILE_ANDROID: "MOBILE_ANDROID",
  TABLET: "TABLET",
  UNKNOWN: "UNKNOWN"
});

export const DEVICE_SECURITY_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  STEP_UP_REQUIRED: "STEP_UP_REQUIRED",
  REVOKED: "REVOKED",
  SUSPICIOUS: "SUSPICIOUS"
});

export const SYNC_TIER = Object.freeze({
  REAL_TIME: "REAL_TIME",
  NEAR_REAL_TIME: "NEAR_REAL_TIME",
  ON_DEMAND: "ON_DEMAND"
});

export class DeviceSyncEngine {
  /**
   * Registers or updates a device record for an authorized subject
   * @param {object} params
   * @returns {object} Registered Device Object
   */
  static registerDevice({
    subjectId,
    deviceId = null,
    platform = DEVICE_PLATFORM.DESKTOP_WEB,
    deviceName = "Personal Device",
    userAgent = "Unknown Client",
    ipAddress = "127.0.0.1"
  }) {
    if (!subjectId) throw new Error("registerDevice requires subjectId.");

    const id = deviceId || `dev_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const existing = DeviceSyncStore.getDevice(id);
    if (existing && existing.subjectId !== subjectId) {
      throw new Error("DEVICE_COLLISION: Device identifier belongs to another subject.");
    }

    const deviceRecord = {
      deviceId: id,
      subjectId,
      platform,
      deviceName,
      userAgent,
      ipAddress,
      lastSeenAt: now,
      securityStatus: existing?.securityStatus || DEVICE_SECURITY_STATUS.TRUSTED,
      createdAt: existing?.createdAt || now,
      syncCursor: existing?.syncCursor || 0
    };

    DeviceSyncStore.saveDevice(id, deviceRecord);
    return deviceRecord;
  }

  /**
   * Updates device heartbeat and active telemetry
   */
  static updateHeartbeat(deviceId, ipAddress = "127.0.0.1") {
    const device = DeviceSyncStore.getDevice(deviceId);
    if (!device) return null;

    if (device.securityStatus === DEVICE_SECURITY_STATUS.REVOKED) {
      throw new Error("DEVICE_REVOKED: Device access has been revoked by user or security policy.");
    }

    device.lastSeenAt = new Date().toISOString();
    device.ipAddress = ipAddress;
    DeviceSyncStore.saveDevice(deviceId, device);
    return device;
  }

  /**
   * Gets all active devices for a subject
   */
  static getDevicesForSubject(subjectId) {
    const all = DeviceSyncStore.getAllDevices();
    const list = all.filter(dev => dev.subjectId === subjectId);
    return list.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  }

  /**
   * Revokes a specific device and terminates its active sessions
   */
  static revokeDevice(subjectId, deviceId, reason = "USER_REQUESTED") {
    const device = DeviceSyncStore.getDevice(deviceId);
    if (!device) return false;
    if (device.subjectId !== subjectId) {
      throw new Error("UNAUTHORIZED_DEVICE_ACTION: Cannot revoke device of another subject.");
    }

    device.securityStatus = DEVICE_SECURITY_STATUS.REVOKED;
    device.revokedAt = new Date().toISOString();
    device.revocationReason = reason;
    DeviceSyncStore.saveDevice(deviceId, device);

    // Terminate active sessions in SessionManager if associated
    SessionManager.revokeSubjectSessions(subjectId, reason);

    return true;
  }

  /**
   * Revokes all other devices except the current active device
   */
  static revokeAllOtherDevices(subjectId, currentDeviceId) {
    let count = 0;
    const all = DeviceSyncStore.getAllDevices();
    for (const dev of all) {
      if (dev.subjectId === subjectId && dev.deviceId !== currentDeviceId) {
        dev.securityStatus = DEVICE_SECURITY_STATUS.REVOKED;
        dev.revokedAt = new Date().toISOString();
        DeviceSyncStore.saveDevice(dev.deviceId, dev);
        count++;
      }
    }
    return { revokedCount: count };
  }

  /**
   * Server-authoritative cross-device sync state retrieval
   */
  static getSyncState(subjectId, deviceId) {
    const device = DeviceSyncStore.getDevice(deviceId);
    if (device && device.securityStatus === DEVICE_SECURITY_STATUS.REVOKED) {
      throw new Error("DEVICE_REVOKED: Cannot sync revoked device.");
    }

    const store = DeviceSyncStore.getSyncStore(subjectId);
    const hasEntities = store.entities instanceof Map
      ? store.entities.size > 0
      : (store.entities && Object.keys(store.entities).length > 0);

    if (!hasEntities) {
      store.version = 1;
      store.lastModifiedAt = new Date().toISOString();
      store.entities = {
        plannerPreferences: { theme: "dark", layoutDensity: "comfortable", autoSync: true },
        savedKnowledgeIds: [],
        watchedClaimIds: []
      };
      DeviceSyncStore.saveSyncStore(subjectId, store);
    }

    const entitiesObj = store.entities instanceof Map
      ? Object.fromEntries(store.entities)
      : store.entities;

    return {
      serverVersion: store.version,
      lastModifiedAt: store.lastModifiedAt,
      entities: entitiesObj
    };
  }

  /**
   * Commits a state mutation from a device with server-authoritative version control
   */
  static commitSyncMutation(subjectId, deviceId, { clientVersion, entityKey, data }) {
    const device = DeviceSyncStore.getDevice(deviceId);
    if (device && device.securityStatus === DEVICE_SECURITY_STATUS.REVOKED) {
      throw new Error("DEVICE_REVOKED: Mutation rejected.");
    }

    const store = DeviceSyncStore.getSyncStore(subjectId);
    let entitiesObj = store.entities instanceof Map
      ? Object.fromEntries(store.entities)
      : (store.entities || {});

    // Conflict resolution check
    if (clientVersion < store.version) {
      entitiesObj[entityKey] = {
        ...(entitiesObj[entityKey] || {}),
        ...data,
        _lastUpdatedByDevice: deviceId,
        _lastUpdatedAt: new Date().toISOString()
      };
      store.version += 1;
      store.lastModifiedAt = new Date().toISOString();
      store.entities = entitiesObj;
      DeviceSyncStore.saveSyncStore(subjectId, store);
      return {
        status: "CONFLICT_RESOLVED_MERGED",
        serverVersion: store.version,
        entities: entitiesObj
      };
    }

    entitiesObj[entityKey] = {
      ...data,
      _lastUpdatedByDevice: deviceId,
      _lastUpdatedAt: new Date().toISOString()
    };
    store.version += 1;
    store.lastModifiedAt = new Date().toISOString();
    store.entities = entitiesObj;
    DeviceSyncStore.saveSyncStore(subjectId, store);

    return {
      status: "SUCCESS",
      serverVersion: store.version,
      entities: entitiesObj
    };
  }

  static clear() {
    DeviceSyncStore.clear();
  }
}
