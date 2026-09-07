// frontend/src/lib/intelligence/academic/DeterministicReminderService.js
//
// Deterministic Reminder Scheduler & Delivery Service
// Enforces:
// 1. Fixed notification thresholds: T-7 (7 days), T-3 (3 days), T-1 (1 day), T-0 (day of deadline)
// 2. Receipt tracking: guarantees single-delivery with unique receipt key: (userId, noticeId, threshold)
// 3. Injectable clock for deterministic verification

export const REMINDER_THRESHOLDS = Object.freeze([
  { id: "T-7", daysBefore: 7, label: "Nhắc nhở trước 7 ngày", urgency: "LOW" },
  { id: "T-3", daysBefore: 3, label: "Nhắc nhở trước 3 ngày", urgency: "MEDIUM" },
  { id: "T-1", daysBefore: 1, label: "Hạn chót vào ngày mai", urgency: "HIGH" },
  { id: "T-0", daysBefore: 0, label: "Hạn chót hôm nay!", urgency: "CRITICAL" },
]);

export class DeterministicReminderService {
  constructor(options = {}) {
    // In-memory receipt store for deduplication / single delivery
    // Maps `receiptKey` -> { deliveredAt, userId, noticeId, threshold, payload }
    this.deliveredReceipts = new Map();
    this.outboxQueue = [];
    this.clock = options.clock || { now: () => Date.now() };
  }

  /**
   * Generates deterministic receipt key
   */
  static generateReceiptKey(userId, noticeId, threshold) {
    const u = String(userId || "").trim().toLowerCase();
    const n = String(noticeId || "").trim().toLowerCase();
    const t = String(threshold || "").trim().toUpperCase();
    return `${u}::${n}::${t}`;
  }

  /**
   * Evaluates which reminder thresholds are currently due for a given deadline.
   *
   * @param {string|Date} deadlineInput - The official deadline
   * @param {number} [currentTimeMs] - Optional reference time in ms (defaults to clock.now())
   * @returns {Array<object>} List of due thresholds
   */
  getDueThresholds(deadlineInput, currentTimeMs = this.clock.now()) {
    const deadline = new Date(deadlineInput);
    if (isNaN(deadline.getTime())) return [];

    const diffMs = deadline.getTime() - currentTimeMs;
    const diffHours = diffMs / (1000 * 60 * 60);

    // If deadline has already passed by more than 24 hours, no scheduled reminders are due
    if (diffHours < -24) return [];

    const due = [];

    // T-0: Due if within [0, 24 hours] remaining or on the same calendar day (diffHours between 0 and 24)
    if (diffHours >= 0 && diffHours <= 24) {
      due.push(REMINDER_THRESHOLDS.find((t) => t.id === "T-0"));
    }

    // T-1: Due if remaining time is between 24 and 48 hours (approx 1 day before)
    if (diffHours > 24 && diffHours <= 48) {
      due.push(REMINDER_THRESHOLDS.find((t) => t.id === "T-1"));
    }

    // T-3: Due if remaining time is between 48 and 72 hours (3 days window)
    if (diffHours > 48 && diffHours <= 72) {
      due.push(REMINDER_THRESHOLDS.find((t) => t.id === "T-3"));
    }

    // T-7: Due if remaining time is between 144 and 168 hours (7 days window)
    if (diffHours > 144 && diffHours <= 168) {
      due.push(REMINDER_THRESHOLDS.find((t) => t.id === "T-7"));
    }

    return due.filter(Boolean);
  }

  /**
   * Dispatches a deterministic reminder if not already delivered.
   *
   * @param {object} param
   * @param {string} param.userId
   * @param {string} param.noticeId
   * @param {string} param.noticeTitle
   * @param {string|Date} param.deadline
   * @param {string} param.thresholdId - "T-7" | "T-3" | "T-1" | "T-0"
   * @returns {object} { dispatched: boolean, receiptKey: string, reason?: string }
   */
  dispatchReminder({ userId, noticeId, noticeTitle, deadline, thresholdId }) {
    if (!userId || !noticeId || !thresholdId) {
      throw new Error("Missing required parameters for reminder dispatch");
    }

    const threshold = REMINDER_THRESHOLDS.find((t) => t.id === thresholdId.toUpperCase());
    if (!threshold) {
      throw new Error(`Invalid threshold ID: ${thresholdId}`);
    }

    const receiptKey = DeterministicReminderService.generateReceiptKey(userId, noticeId, threshold.id);

    // Idempotency check: Guarantee single delivery
    if (this.deliveredReceipts.has(receiptKey)) {
      return {
        dispatched: false,
        receiptKey,
        reason: "ALREADY_DELIVERED",
        deliveredAt: this.deliveredReceipts.get(receiptKey).deliveredAt,
      };
    }

    const now = this.clock.now();
    const payload = {
      receiptKey,
      userId,
      noticeId,
      noticeTitle,
      deadline: new Date(deadline).toISOString(),
      threshold: threshold.id,
      label: threshold.label,
      urgency: threshold.urgency,
      deliveredAt: new Date(now).toISOString(),
    };

    // Store receipt to prevent any duplicate sends
    this.deliveredReceipts.set(receiptKey, payload);
    this.outboxQueue.push(payload);

    return {
      dispatched: true,
      receiptKey,
      payload,
    };
  }

  /**
   * Scans a student subscription against a list of notices and queues all due, undelivered reminders.
   */
  processStudentReminders({ userId, notices = [] }) {
    const results = [];
    const now = this.clock.now();

    for (const notice of notices) {
      if (!notice.deadline) continue;

      const dueThresholds = this.getDueThresholds(notice.deadline, now);
      for (const threshold of dueThresholds) {
        const dispatchResult = this.dispatchReminder({
          userId,
          noticeId: notice.noticeId || notice.id,
          noticeTitle: notice.title,
          deadline: notice.deadline,
          thresholdId: threshold.id,
        });
        results.push(dispatchResult);
      }
    }

    return results;
  }

  getReceipt(receiptKey) {
    return this.deliveredReceipts.get(receiptKey) || null;
  }

  getPendingOutbox() {
    return [...this.outboxQueue];
  }

  clearOutbox() {
    this.outboxQueue = [];
  }
}
