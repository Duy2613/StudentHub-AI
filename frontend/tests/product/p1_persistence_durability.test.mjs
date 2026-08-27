/**
 * StudentHub AI — P1 Persistence Durability & State Survival Regression Suite
 * 
 * Verifies that User Goals, Early Warnings, AI Memories, and Device Sessions
 * are durably stored on disk and survive process memory wipes / rehydration.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { UserGoalEngine, GOAL_PRIORITY, GOAL_STATUS } from "../../src/lib/personalization/UserGoalEngine.js";
import { UserGoalStore } from "../../src/lib/personalization/UserGoalStore.js";
import { EarlyWarningEngine, WARNING_CATEGORY, WARNING_LIFECYCLE } from "../../src/lib/intelligence/social/EarlyWarningEngine.js";
import { EarlyWarningStore } from "../../src/lib/intelligence/social/EarlyWarningStore.js";
import { AiMemoryGuard } from "../../src/lib/intelligence/safety/AiMemoryGuard.js";
import { AiMemoryStore } from "../../src/lib/intelligence/safety/AiMemoryStore.js";
import { DeviceSyncEngine, DEVICE_PLATFORM, DEVICE_SECURITY_STATUS } from "../../src/lib/personalization/DeviceSyncEngine.js";
import { DeviceSyncStore } from "../../src/lib/personalization/DeviceSyncStore.js";

describe("P1 State Durability & Restart Survival", () => {
  beforeEach(() => {
    UserGoalStore.clear();
    EarlyWarningStore.clear();
    AiMemoryStore.clear();
    DeviceSyncStore.clear();
  });

  it("UserGoalEngine: Goal creation & progress updates must survive simulated restart", () => {
    const subjectId = "student:24110001";

    // 1. Create goal
    const goal = UserGoalEngine.createGoal(subjectId, {
      title: "Đạt điểm 9.0 Đồ Án Tốt Nghiệp",
      priority: GOAL_PRIORITY.HIGH,
      currentProgress: 20
    });
    assert.strictEqual(goal.currentProgress, 20);

    // 2. Simulate complete restart by rehydrating store
    UserGoalStore.rehydrate();

    // 3. Verify goal survived
    const loadedGoals = UserGoalEngine.getGoals(subjectId);
    const found = loadedGoals.find(g => g.goalId === goal.goalId);
    assert.ok(found);
    assert.strictEqual(found.title, "Đạt điểm 9.0 Đồ Án Tốt Nghiệp");
    assert.strictEqual(found.currentProgress, 20);

    // 4. Update progress and verify survival
    UserGoalEngine.updateProgress(subjectId, goal.goalId, 100);
    UserGoalStore.rehydrate();

    const completedGoals = UserGoalEngine.getGoals(subjectId);
    const completed = completedGoals.find(g => g.goalId === goal.goalId);
    assert.strictEqual(completed.status, GOAL_STATUS.COMPLETED);
    assert.strictEqual(completed.currentProgress, 100);
  });

  it("EarlyWarningEngine: Emerging incident lifecycle must survive simulated restart", () => {
    // 1. Record signals
    EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      title: "Sập cổng đăng ký học phần",
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_01"
    });
    EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_02"
    });
    const w3 = EarlyWarningEngine.recordSignal({
      category: WARNING_CATEGORY.PORTAL_OUTAGE,
      affectedEntity: "SYSTEM:online_portal",
      authorId: "user_03"
    });
    assert.strictEqual(w3.status, WARNING_LIFECYCLE.EMERGING);

    // 2. Simulate restart
    EarlyWarningStore.rehydrate();

    // 3. List active warnings from disk
    const active = EarlyWarningEngine.listActiveWarnings();
    assert.ok(active.length >= 1);
    const warning = active.find(w => w.affectedEntity === "SYSTEM:online_portal");
    assert.ok(warning);
    assert.strictEqual(warning.status, WARNING_LIFECYCLE.EMERGING);
    assert.strictEqual(warning.distinctReporterCount, 3);
  });

  it("AiMemoryGuard: Approved & Candidate memory records must survive simulated restart", () => {
    const subjectId = "student:24110001";

    // 1. Propose & approve memory
    const prop = AiMemoryGuard.proposeMemory(subjectId, {
      text: "Sinh viên muốn đăng ký các lớp học của Thầy Triết vào Thứ 3."
    });
    const approved = AiMemoryGuard.approveMemory(subjectId, prop.candidateId);

    // 2. Simulate restart
    AiMemoryStore.rehydrate();

    // 3. Verify memory survived
    const memories = AiMemoryGuard.getApprovedMemories(subjectId);
    assert.strictEqual(memories.length, 1);
    assert.strictEqual(memories[0].text, "Sinh viên muốn đăng ký các lớp học của Thầy Triết vào Thứ 3.");
  });

  it("DeviceSyncEngine: Registered devices & mutations must survive simulated restart", () => {
    const subjectId = "student:24110001";

    // 1. Register device
    const dev = DeviceSyncEngine.registerDevice({
      subjectId,
      deviceId: "dev_laptop_thinkpad",
      platform: DEVICE_PLATFORM.DESKTOP_WEB,
      deviceName: "ThinkPad X1 Carbon"
    });

    // 2. Commit mutation
    DeviceSyncEngine.commitSyncMutation(subjectId, dev.deviceId, {
      clientVersion: 1,
      entityKey: "plannerPreferences",
      data: { theme: "dracula", autoSync: true }
    });

    // 3. Simulate restart
    DeviceSyncStore.rehydrate();

    // 4. Retrieve state from another device
    const syncState = DeviceSyncEngine.getSyncState(subjectId, "dev_phone_iphone");
    assert.strictEqual(syncState.serverVersion, 2);
    assert.strictEqual(syncState.entities.plannerPreferences.theme, "dracula");
  });
});
