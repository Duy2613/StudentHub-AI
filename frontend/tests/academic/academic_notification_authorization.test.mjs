import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationModel, NOTIFICATION_TYPES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { AcademicNotificationAuthorization } from "../../src/lib/intelligence/academic/academicNotificationAuthorization.js";
import { AcademicNotificationDeliveryAdapter } from "../../src/lib/intelligence/academic/academicNotificationDeliveryAdapter.js";

describe("Academic Notification Authorization & Privacy V1", () => {
  const notifStudentA = AcademicNotificationModel.createNotification({
    studentId: "24110001",
    type: NOTIFICATION_TYPES.DEADLINE_SOON,
    title: "Thông báo học vụ sinh viên A",
    body: "Nội dung riêng tư"
  });

  it("should allow owner to access notification", () => {
    assert.doesNotThrow(() => {
      AcademicNotificationAuthorization.assertNotificationAccess("24110001", notifStudentA);
    });
    assert.strictEqual(AcademicNotificationAuthorization.canAccess("24110001", notifStudentA), true);
  });

  it("should block non-owner from accessing another student's notification", () => {
    assert.throws(
      () => AcademicNotificationAuthorization.assertNotificationAccess("24110002", notifStudentA),
      /FORBIDDEN_NOTIFICATION_ACCESS/
    );
    assert.strictEqual(AcademicNotificationAuthorization.canAccess("24110002", notifStudentA), false);
  });

  it("should sanitize privacy-sensitive keywords (password, OTP, STK) before delivery", () => {
    const rawLeak = "Vui lòng nhập password: SecretPassword123 và otp: 998877 vào STK: 123456789";
    const sanitized = AcademicNotificationDeliveryAdapter.sanitizePrivacyContent(rawLeak);

    assert.ok(!sanitized.includes("SecretPassword123"));
    assert.ok(!sanitized.includes("998877"));
    assert.ok(!sanitized.includes("123456789"));
    assert.ok(sanitized.includes("[REDACTED]"));
    assert.ok(sanitized.includes("[PROTECTED]"));
    assert.ok(sanitized.includes("[SECURE]"));
  });
});
