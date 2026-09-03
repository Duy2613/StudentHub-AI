/**
 * StudentHub AI — Centralized Academic Clock & Asia/Ho_Chi_Minh Timezone Engine
 * 
 * Centralizes all time, clock, and calendar arithmetic across StudentHub AI.
 * Guarantees zero timezone skew by strictly enforcing Asia/Ho_Chi_Minh (UTC+7).
 * Provides mockable clock providers for 100% deterministic testing.
 */

export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
export const VN_OFFSET_HOURS = 7;
export const VN_OFFSET_MS = VN_OFFSET_HOURS * 60 * 60 * 1000;

export class AcademicClock {
  /**
   * Gets current unix timestamp in milliseconds
   * @returns {number}
   */
  static now() {
    return Date.now();
  }

  /**
   * Gets current time as ISO string
   * @returns {string}
   */
  static nowIso() {
    return new Date(this.now()).toISOString();
  }

  /**
   * Creates a deterministic mock clock for testing
   * @param {number|string|Date} fixedTime
   * @returns {{ now: () => number, nowIso: () => string }}
   */
  static createMockClock(fixedTime) {
    const timestamp = typeof fixedTime === "number" 
      ? fixedTime 
      : new Date(fixedTime).getTime();
    
    if (isNaN(timestamp)) {
      throw new Error(`Invalid fixedTime provided to createMockClock: ${fixedTime}`);
    }

    return {
      now: () => timestamp,
      nowIso: () => new Date(timestamp).toISOString()
    };
  }

  /**
   * Converts a given timestamp or Date into local Vietnam (UTC+7) Date representation
   * @param {number|string|Date} [timestamp]
   * @returns {Date}
   */
  static toVnDate(timestamp = this.now()) {
    const t = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
    return new Date(t + VN_OFFSET_MS);
  }

  /**
   * Parses a date string (DD/MM/YYYY, YYYY-MM-DD, ISO) into an end-of-day UTC Date in Vietnam time
   * @param {string|Date} input 
   * @returns {Date|null}
   */
  static parseVnDeadline(input) {
    if (!input) return null;
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }

    const trimmed = String(input).trim();
    if (!trimmed) return null;

    // 1. DD/MM/YYYY format
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);

      // End of day in Vietnam: 23:59:59.999 UTC+7 = 16:59:59.999 UTC
      const utcTimestamp = Date.UTC(year, month, day, 16, 59, 59, 999);
      return new Date(utcTimestamp);
    }

    // 2. YYYY-MM-DD format
    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);

      const utcTimestamp = Date.UTC(year, month, day, 16, 59, 59, 999);
      return new Date(utcTimestamp);
    }

    // 3. Full ISO format or standard date string
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Computes midnight timestamp in UTC+7 for calendar day math
   * @param {number|string|Date} timestamp
   * @returns {number}
   */
  static getMidnightVnTimestamp(timestamp = this.now()) {
    const vnDate = this.toVnDate(timestamp);
    return Date.UTC(vnDate.getUTCFullYear(), vnDate.getUTCMonth(), vnDate.getUTCDate());
  }

  /**
   * Computes calendar day difference in Asia/Ho_Chi_Minh
   * @param {number|string|Date} targetDate
   * @param {object} [clock]
   * @returns {number}
   */
  static computeCalendarDayDiff(targetDate, clock = { now: () => AcademicClock.now() }) {
    const target = this.parseVnDeadline(targetDate);
    if (!target) return 0;

    const currentMidnight = this.getMidnightVnTimestamp(clock.now());
    const targetMidnight = this.getMidnightVnTimestamp(target.getTime());

    return Math.round((targetMidnight - currentMidnight) / (24 * 60 * 60 * 1000));
  }
}
