/**
 * StudentHub AI — Product Reconstruction & Cross-Device E2E Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { DeviceSyncEngine, DEVICE_PLATFORM } from "../../src/lib/personalization/DeviceSyncEngine.js";
import { PersonalDigitalTwin } from "../../src/lib/personalization/PersonalDigitalTwin.js";
import { PersonalizationEngine } from "../../src/lib/personalization/PersonalizationEngine.js";
import { UniversalSearchEngine } from "../../src/lib/personalization/UniversalSearchEngine.js";

describe("Product Reconstruction & Personal Digital Twin E2E", () => {
  beforeEach(() => {
    DeviceSyncEngine.clear();
    PersonalDigitalTwin.clear();
    PersonalizationEngine.clear();
  });

  it("should execute complete cross-device product lifecycle with personalization and security", () => {
    const subjectId = "student:24110001";

    // 1. Device A (Laptop) Login & Registration
    const laptop = DeviceSyncEngine.registerDevice({
      subjectId,
      platform: DEVICE_PLATFORM.DESKTOP_WEB,
      deviceName: "Chrome Laptop (Workstation)"
    });
    assert.ok(laptop.deviceId);

    // 2. Personal Digital Twin Construction
    const twin = PersonalDigitalTwin.buildDigitalTwin(subjectId);
    assert.strictEqual(twin.identity.studentId, "24110001");
    assert.ok(twin.academicContext.cgpa >= 3.0);

    // 3. Personalized Command Center Compilation
    const commandCenter = PersonalizationEngine.compileCommandCenterContext(subjectId, null);
    assert.ok(commandCenter.todaySchedule.length >= 1);
    assert.ok(commandCenter.nextBestAction.title);
    assert.ok(commandCenter.nextBestAction.whyAmISeeingThis);

    // 4. Universal Search
    const searchRes = UniversalSearchEngine.search({
      query: "Giải tích",
      subjectId,
      limit: 3
    });
    assert.ok(searchRes.totalMatches >= 1);
    assert.ok(searchRes.categories.courses.length >= 1);

    // 5. Device B (Mobile) Login & Sync
    const phone = DeviceSyncEngine.registerDevice({
      subjectId,
      platform: DEVICE_PLATFORM.MOBILE_IOS,
      deviceName: "iPhone 15 Pro"
    });

    const activeDevices = DeviceSyncEngine.getDevicesForSubject(subjectId);
    assert.strictEqual(activeDevices.length, 2);

    // 6. Save Knowledge item on Mobile
    const saved = PersonalDigitalTwin.saveKnowledgeItem(subjectId, {
      title: "Hạn chót nộp chứng chỉ tiếng Anh 15/03/2026",
      source: "Phòng Đào Tạo"
    });
    assert.ok(saved.savedId);

    // Verify Laptop can see saved item
    const laptopSavedList = PersonalDigitalTwin.getSavedKnowledge(subjectId);
    assert.strictEqual(laptopSavedList.length, 1);

    // 7. Privacy & Data Export
    const exportData = PersonalDigitalTwin.exportPersonalVault(subjectId);
    assert.ok(exportData.personalDigitalTwin);
    assert.strictEqual(exportData.savedKnowledgeVault.length, 1);

    // 8. Remote Revocation from Phone
    const revokeRes = DeviceSyncEngine.revokeAllOtherDevices(subjectId, phone.deviceId);
    assert.strictEqual(revokeRes.revokedCount, 1);

    // Verify Laptop is now revoked
    const laptopStatus = DeviceSyncEngine.getDevicesForSubject(subjectId).find(d => d.deviceId === laptop.deviceId);
    assert.strictEqual(laptopStatus.securityStatus, "REVOKED");
  });
});
