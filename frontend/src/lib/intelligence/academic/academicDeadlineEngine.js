/**
 * StudentHub AI — Academic Deadline Engine V1
 * 
 * Deterministic date calculations, urgency classification, and time-remaining
 * estimations for academic deadlines in Asia/Ho_Chi_Minh (UTC+7) timezone.
 * Pure logic with injectable clock for deterministic testing.
 */

import { AcademicClock } from "./academicClock.js";

export const DEADLINE_STATES = Object.freeze({
  NO_DEADLINE: "NO_DEADLINE",
  FUTURE: "FUTURE",
  DUE_SOON: "DUE_SOON",         // <= 7 days
  DUE_TOMORROW: "DUE_TOMORROW", // <= 24 hours
  DUE_TODAY: "DUE_TODAY",       // deadline is today
  OVERDUE: "OVERDUE",           // current time past deadline and task incomplete
  COMPLETED_BEFORE_DEADLINE: "COMPLETED_BEFORE_DEADLINE",
  EXPIRED: "EXPIRED"            // past deadline and action window closed
});

export const DEADLINE_URGENCY = Object.freeze({
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
});

export class AcademicDeadlineEngine {
  /**
   * Parses various date formats into a canonical ISO Date string (end of day UTC+7: 23:59:59.999)
   * @param {string|Date} dateInput 
   * @returns {Date|null}
   */
  static parseDeadline(dateInput) {
    return AcademicClock.parseVnDeadline(dateInput);
  }

  /**
   * Computes the time remaining between current clock and due date
   * @param {Date|string} dueDate 
   * @param {object} clock - { now: () => timestamp }
   * @returns {object}
   */
  static computeTimeRemaining(dueDate, clock = { now: () => AcademicClock.now() }) {
    const due = this.parseDeadline(dueDate);
    if (!due) {
      return {
        hasDeadline: false,
        totalHours: null,
        days: null,
        hours: null,
        minutes: null,
        isOverdue: false,
        humanText: "Không có hạn chót"
      };
    }

    const currentTimestamp = clock.now();
    const dueTimestamp = due.getTime();
    const diffMs = dueTimestamp - currentTimestamp;
    const isOverdue = diffMs < 0;

    const absDiffMs = Math.abs(diffMs);
    const calendarDayDiff = AcademicClock.computeCalendarDayDiff(due, clock);

    const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

    let humanText = "";
    if (isOverdue) {
      if (Math.abs(calendarDayDiff) >= 1) {
        humanText = `Đã quá hạn ${Math.abs(calendarDayDiff)} ngày`;
      } else if (hours >= 1) {
        humanText = `Đã quá hạn ${hours} giờ`;
      } else {
        humanText = "Vừa hết hạn";
      }
    } else {
      if (calendarDayDiff > 1) {
        humanText = `Còn ${calendarDayDiff} ngày`;
      } else if (calendarDayDiff === 1) {
        humanText = "Ngày mai hết hạn";
      } else if (hours >= 1) {
        humanText = `Còn ${hours} giờ (Hết hạn hôm nay)`;
      } else if (minutes > 0) {
        humanText = `Còn ${minutes} phút (Khẩn cấp)`;
      } else {
        humanText = "Hết hạn ngay lúc này";
      }
    }

    return {
      hasDeadline: true,
      dueAt: due.toISOString(),
      diffMs,
      totalHours: isOverdue ? -totalHours : totalHours,
      days: calendarDayDiff,
      calendarDayDiff,
      hours,
      minutes,
      isOverdue,
      humanText
    };
  }

  /**
   * Evaluates comprehensive deadline status and urgency
   * @param {object} params
   * @param {string|Date} params.deadline
   * @param {string} [params.taskStatus]
   * @param {object} [params.clock]
   * @returns {object}
   */
  static evaluateDeadline({
    deadline,
    taskStatus = "NOT_STARTED",
    clock = { now: () => Date.now() }
  } = {}) {
    const timeRemaining = this.computeTimeRemaining(deadline, clock);

    if (!timeRemaining.hasDeadline) {
      return {
        state: DEADLINE_STATES.NO_DEADLINE,
        urgency: DEADLINE_URGENCY.LOW,
        dueAt: null,
        timeRemaining,
        isActionRequired: false
      };
    }

    if (taskStatus === "COMPLETED") {
      return {
        state: DEADLINE_STATES.COMPLETED_BEFORE_DEADLINE,
        urgency: DEADLINE_URGENCY.LOW,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: false
      };
    }

    if (taskStatus === "EXPIRED" || taskStatus === "CANCELLED") {
      return {
        state: DEADLINE_STATES.EXPIRED,
        urgency: DEADLINE_URGENCY.LOW,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: false
      };
    }

    if (timeRemaining.isOverdue) {
      return {
        state: DEADLINE_STATES.OVERDUE,
        urgency: DEADLINE_URGENCY.CRITICAL,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: true
      };
    }

    const { calendarDayDiff } = timeRemaining;

    if (calendarDayDiff === 0) {
      return {
        state: DEADLINE_STATES.DUE_TODAY,
        urgency: DEADLINE_URGENCY.CRITICAL,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: true
      };
    }

    if (calendarDayDiff === 1) {
      return {
        state: DEADLINE_STATES.DUE_TOMORROW,
        urgency: DEADLINE_URGENCY.CRITICAL,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: true
      };
    }

    if (calendarDayDiff <= 3) {
      return {
        state: DEADLINE_STATES.DUE_SOON,
        urgency: DEADLINE_URGENCY.HIGH,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: true
      };
    }

    if (calendarDayDiff <= 7) {
      return {
        state: DEADLINE_STATES.DUE_SOON,
        urgency: DEADLINE_URGENCY.MEDIUM,
        dueAt: timeRemaining.dueAt,
        timeRemaining,
        isActionRequired: true
      };
    }

    return {
      state: DEADLINE_STATES.FUTURE,
      urgency: DEADLINE_URGENCY.LOW,
      dueAt: timeRemaining.dueAt,
      timeRemaining,
      isActionRequired: false
    };
  }
}
