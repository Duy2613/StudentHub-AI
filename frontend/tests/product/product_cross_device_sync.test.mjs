/**
 * StudentHub AI — Cross-Device Sync & Session Management Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { DeviceSyncEngine, DEVICE_PLATFORM, DEVICE_SECURITY_STATUS } from "../../src/lib/personalization/DeviceSyncEngine.js";

describe("Device Management & Cross-Device Sync Engine", () => {
  beforeEach(() => {
    DeviceSyncEngine.clear();
  });

  it("should register multiple devices and track active status", () => {
    const subjectId = "student:24110001";

    const dev1 = DeviceSyncEngine.registerDevice({
      subjectId,
      platform: DEVICE_PLATFORM.DESKTOP_WEB,
      deviceName: "Chrome Laptop"
    });

    const dev2 = DeviceSyncEngine.registerDevice({
      subjectId,
      platform: DEVICE_PLATFORM.MOBILE_IOS,
      deviceName: "iPhone 15"
    });

    const devices = DeviceSyncEngine.getDevicesForSubject(subjectId);
    assert.strictEqual(devices.length, 2);
    assert.strictEqual(devices.some(d => d.deviceId === dev1.deviceId), true);
    assert.strictEqual(devices.some(d => d.deviceId === dev2.deviceId), true);
  });

  it("should revoke a specific device and deny subsequent heartbeats", () => {
    const subjectId = "student:24110001";
    const dev = DeviceSyncEngine.registerDevice({ subjectId, deviceName: "Old Tablet" });

    const revoked = DeviceSyncEngine.revokeDevice(subjectId, dev.deviceId, "USER_REQUESTED");
    assert.strictEqual(revoked, true);

    assert.throws(() => {
      DeviceSyncEngine.updateHeartbeat(dev.deviceId);
    }, /DEVICE_REVOKED/);
  });

  it("should execute server-authoritative synchronization with conflict resolution", () => {
    const subjectId = "student:24110001";
    const dev = DeviceSyncEngine.registerDevice({ subjectId, deviceName: "Laptop" });

    // Initial Sync State: Version 1
    const state1 = DeviceSyncEngine.getSyncState(subjectId, dev.deviceId);
    assert.strictEqual(state1.serverVersion, 1);

    // Device commits mutation with clientVersion 1
    const mut1 = DeviceSyncEngine.commitSyncMutation(subjectId, dev.deviceId, {
      clientVersion: 1,
      entityKey: "plannerPreferences",
      data: { theme: "light" }
    });

    assert.strictEqual(mut1.status, "SUCCESS");
    assert.strictEqual(mut1.serverVersion, 2);

    // Stale Device sends mutation with clientVersion 1 (Out of sync!)
    const mut2 = DeviceSyncEngine.commitSyncMutation(subjectId, dev.deviceId, {
      clientVersion: 1,
      entityKey: "plannerPreferences",
      data: { layoutDensity: "compact" }
    });

    assert.strictEqual(mut2.status, "CONFLICT_RESOLVED_MERGED");
    assert.strictEqual(mut2.serverVersion, 3);
    assert.strictEqual(mut2.entities.plannerPreferences.theme, "light");
    assert.strictEqual(mut2.entities.plannerPreferences.layoutDensity, "compact");
  });
});
