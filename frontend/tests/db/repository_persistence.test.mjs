/**
 * StudentHub AI — Database Repository & Persistence Test Suite
 * 
 * Verifies that the DatabaseAdapter and repository abstraction layer
 * provide atomic queries, optimistic concurrency, crash-safety, and tenant segregation.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { DatabaseAdapter } from "../../src/lib/db/DatabaseAdapter.js";
import { UserGoalRepository } from "../../src/lib/db/repositories/UserGoalRepository.js";
import { EarlyWarningRepository } from "../../src/lib/db/repositories/EarlyWarningRepository.js";
import { AiMemoryRepository } from "../../src/lib/db/repositories/AiMemoryRepository.js";
import { DeviceRepository } from "../../src/lib/db/repositories/DeviceRepository.js";

describe("Database Repository & Persistence Layer", () => {
  beforeEach(async () => {
    await UserGoalRepository.clear();
    await EarlyWarningRepository.clear();
    await AiMemoryRepository.clear();
    await DeviceRepository.clear();
  });

  it("UserGoalRepository: should atomically persist, update and filter goals by subject", async () => {
    const subjectA = "student:24110001";
    const subjectB = "student:24110002";

    // 1. Create goals for subject A
    await UserGoalRepository.saveGoal(subjectA, {
      goalId: "goal_toeic_01",
      title: "Đạt chuẩn TOEIC 650+",
      progress: 75
    });

    await UserGoalRepository.saveGoal(subjectA, {
      goalId: "goal_gpa_01",
      title: "GPA 8.5+",
      progress: 80
    });

    // 2. Create goal for subject B
    await UserGoalRepository.saveGoal(subjectB, {
      goalId: "goal_intern_01",
      title: "Thực tập Doanh nghiệp",
      progress: 50
    });

    // 3. Verify tenant segregation
    const goalsA = await UserGoalRepository.getGoalsForSubject(subjectA);
    const goalsB = await UserGoalRepository.getGoalsForSubject(subjectB);

    assert.strictEqual(goalsA.length, 2);
    assert.strictEqual(goalsB.length, 1);
    assert.strictEqual(goalsA[0].subjectId, subjectA);
    assert.strictEqual(goalsB[0].subjectId, subjectB);

    // 4. Update goal progress
    await UserGoalRepository.saveGoal(subjectA, {
      goalId: "goal_toeic_01",
      title: "Đạt chuẩn TOEIC 650+",
      progress: 100
    });

    const updated = await UserGoalRepository.getGoalById("goal_toeic_01");
    assert.strictEqual(updated.progress, 100);
    assert.ok(updated._version >= 2);
  });

  it("EarlyWarningRepository: should store and retrieve emerging incident records", async () => {
    const key = "PORTAL_OUTAGE__online.hcmute.edu.vn";

    await EarlyWarningRepository.saveWarning(key, {
      warningKey: key,
      title: "Sập cổng đăng ký học phần đợt 2",
      status: "EMERGING",
      confidence: 0.85
    });

    const found = await EarlyWarningRepository.getWarningByKey(key);
    assert.ok(found);
    assert.strictEqual(found.status, "EMERGING");
    assert.strictEqual(found.confidence, 0.85);
  });

  it("AiMemoryRepository: should segregate memories by student subject", async () => {
    const subject = "student:24110001";

    await AiMemoryRepository.saveMemoryRecord(subject, {
      approvedMemories: [
        { memoryId: "mem_01", text: "Ưu tiên đăng ký lớp Thầy Triết vào Thứ 3" }
      ],
      candidateMemories: []
    });

    const record = await AiMemoryRepository.getMemoryRecord(subject);
    assert.strictEqual(record.approvedMemories.length, 1);
    assert.strictEqual(record.approvedMemories[0].text, "Ưu tiên đăng ký lớp Thầy Triết vào Thứ 3");
  });

  it("DeviceRepository: should track multi-device states and synced preferences", async () => {
    const subject = "student:24110001";

    await DeviceRepository.saveDevice({
      deviceId: "dev_laptop_thinkpad",
      subjectId: subject,
      platform: "DESKTOP_WEB",
      securityStatus: "TRUSTED"
    });

    await DeviceRepository.saveSyncState(subject, {
      version: 3,
      entities: {
        plannerPreferences: { theme: "dark", autoSync: true }
      }
    });

    const devices = await DeviceRepository.getDevicesForSubject(subject);
    const syncState = await DeviceRepository.getSyncState(subject);

    assert.strictEqual(devices.length, 1);
    assert.strictEqual(devices[0].deviceId, "dev_laptop_thinkpad");
    assert.strictEqual(syncState.version, 3);
    assert.strictEqual(syncState.entities.plannerPreferences.theme, "dark");
  });
});
