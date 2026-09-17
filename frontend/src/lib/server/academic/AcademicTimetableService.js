import crypto from "node:crypto";

import { AcademicNotificationRepository } from "../database/AcademicNotificationRepository.js";
import { AcademicTaskRepository } from "../database/AcademicTaskRepository.js";
import { AcademicTimetableRepository, normalizeTimetableOwnerId } from "../database/AcademicTimetableRepository.js";
import { publishRealtimeEvent } from "../realtime/RealtimePublisher.js";
import {
  deriveCourses,
  normalizePersistedEntries,
  projectNextClass,
  projectToday,
  projectWeek,
  validateDraftForConfirmation,
} from "../../intelligence/academic/academicTimetableModel.js";

function stableDigest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function boundedKey(value) {
  const key = String(value || "").trim();
  return key ? key.slice(0, 180) : null;
}

function safeAuxiliaryRead(read, fallback) {
  return Promise.resolve().then(read).catch(() => fallback);
}

function timetableRevision(timetable) {
  const updatedAt = timetable?.updatedAt ? new Date(timetable.updatedAt).getTime() : 0;
  return Number.isFinite(updatedAt) && updatedAt > 0 ? String(updatedAt) : String(timetable?.id || "unknown");
}

export class AcademicTimetableService {
  constructor({
    timetableRepository = new AcademicTimetableRepository(),
    taskRepository = new AcademicTaskRepository(),
    notificationRepository = new AcademicNotificationRepository(),
    publisher = publishRealtimeEvent,
    now = () => new Date(),
    environment = process.env.NODE_ENV || "development",
  } = {}) {
    this.timetableRepository = timetableRepository;
    this.taskRepository = taskRepository;
    this.notificationRepository = notificationRepository;
    this.publisher = publisher;
    this.now = now;
    this.environment = environment;
  }

  async getWorkspace(userId, { timeZone = "Asia/Ho_Chi_Minh", now = this.now() } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const timetable = await this.timetableRepository.getActiveTimetable(owner);
    const entries = timetable?.entries || [];
    const today = projectToday(entries, { now, timeZone });
    const tasks = await safeAuxiliaryRead(
      () => this.taskRepository.getTasksByStudent(owner),
      [],
    );
    const notifications = await safeAuxiliaryRead(
      () => this.notificationRepository.getNotificationsByStudent(owner, {
        excludeCancelled: true,
        limit: 50,
      }),
      [],
    );
    const unreadNotificationCount = await safeAuxiliaryRead(
      () => this.notificationRepository.countUnreadByStudent(owner),
      notifications.filter((item) => !item.readAt).length,
    );
    const reminders = timetable
      ? await safeAuxiliaryRead(() => this.timetableRepository.listReminders(owner, timetable.id), [])
      : [];

    return {
      success: true,
      sourceState: "POSTGRES",
      isAuthoritative: true,
      userId: owner,
      timetable,
      timetables: timetable ? [timetable] : [],
      today,
      week: projectWeek(entries),
      nextClass: projectNextClass(entries, { now, timeZone }),
      courses: deriveCourses(entries),
      tasks,
      notifications,
      unreadNotificationCount: Number(unreadNotificationCount || 0),
      reminders,
      timestamp: new Date(now).toISOString(),
    };
  }

  async createManual(userId, input = {}, { idempotencyKey = null, correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const entries = normalizePersistedEntries(input.entries);
    const digest = stableDigest({
      sourceType: "MANUAL",
      name: input.name || input.timetableName || null,
      academicTerm: input.academicTerm || null,
      entries,
    });
    const key = boundedKey(idempotencyKey) || `manual:${digest}`;
    const result = await this.timetableRepository.createTimetable({
      userId: owner,
      name: input.name || input.timetableName,
      academicTerm: input.academicTerm,
      sourceType: "MANUAL",
      entries,
      idempotencyKey: key,
      requestDigest: digest,
    });
    const realtime = await this.#publish(owner, result.timetable, "MANUAL_SAVED", correlationId, key);
    return { ...result, realtime };
  }

  async confirmDraft(userId, draftInput = {}, { idempotencyKey = null, correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const draft = validateDraftForConfirmation(draftInput);
    const digest = stableDigest({
      sourceType: "IMAGE",
      timetableName: draft.timetableName,
      academicTerm: draft.academicTerm,
      entries: draft.entries,
    });
    const key = boundedKey(idempotencyKey) || `image:${digest}`;
    const result = await this.timetableRepository.createTimetable({
      userId: owner,
      name: draft.timetableName,
      academicTerm: draft.academicTerm,
      sourceType: "IMAGE",
      entries: draft.entries,
      idempotencyKey: key,
      requestDigest: digest,
    });
    const realtime = await this.#publish(owner, result.timetable, "IMAGE_CONFIRMED", correlationId, key);
    return { ...result, realtime };
  }

  async updateTimetable(userId, timetableId, patch, { correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const timetable = await this.timetableRepository.updateTimetable(owner, timetableId, patch);
    const realtime = await this.#publish(owner, timetable, "TIMETABLE_UPDATED", correlationId, `update:${timetable.id}:${timetable.updatedAt}`);
    return { timetable, realtime };
  }

  async replaceEntries(userId, timetableId, entries, { correlationId = "academic", metadata = null } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const timetable = await this.timetableRepository.replaceTimetableEntries(owner, timetableId, entries, metadata);
    const realtime = await this.#publish(owner, timetable, "ENTRIES_REPLACED", correlationId, `entries:${timetable.id}:${timetable.updatedAt}`);
    return { timetable, realtime };
  }

  async updateEntry(userId, entryId, patch, { correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const entry = await this.timetableRepository.updateEntry(owner, entryId, patch);
    const timetable = await this.timetableRepository.getTimetable(owner, entry.timetableId);
    const realtime = await this.#publish(owner, timetable, "ENTRY_UPDATED", correlationId, `entry:${entry.id}:${entry.updatedAt}`);
    return { entry, timetable, realtime };
  }

  async deleteEntry(userId, entryId, { correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const deleted = await this.timetableRepository.deleteEntry(owner, entryId);
    const timetable = await this.timetableRepository.getTimetable(owner, deleted.timetableId);
    const realtime = await this.#publish(owner, timetable, "ENTRY_DELETED", correlationId, `entry-delete:${deleted.id}`);
    return { ...deleted, timetable, realtime };
  }

  async deleteTimetable(userId, timetableId, { correlationId = "academic" } = {}) {
    const owner = normalizeTimetableOwnerId(userId);
    const deleted = await this.timetableRepository.deleteTimetable(owner, timetableId);
    const realtime = await this.#publish(owner, { id: timetableId, entries: [] }, "TIMETABLE_DELETED", correlationId, `timetable-delete:${timetableId}`);
    return { ...deleted, realtime };
  }

  async listReminders(userId, timetableId = null) {
    return this.timetableRepository.listReminders(normalizeTimetableOwnerId(userId), timetableId);
  }

  async createReminder(userId, input) {
    return this.timetableRepository.createReminder(normalizeTimetableOwnerId(userId), input);
  }

  async deleteReminder(userId, reminderId) {
    return this.timetableRepository.deleteReminder(normalizeTimetableOwnerId(userId), reminderId);
  }

  async #publish(owner, timetable, action, correlationId, idempotencyKey) {
    const result = await this.publisher({
      channel: "academic",
      eventType: "academic:timetable.updated",
      subjectId: owner,
      classification: "RESTRICTED",
      producer: "StudentHub-AcademicTimetable",
      environment: this.environment,
      correlationId: String(correlationId || "academic").slice(0, 160),
      idempotencyKey: String(idempotencyKey || crypto.randomUUID()).slice(0, 180),
      data: {
        resource: "timetable",
        action,
        timetableId: timetable?.id || null,
        revision: timetableRevision(timetable),
        entryCount: Array.isArray(timetable?.entries) ? timetable.entries.length : null,
        authoritative: true,
      },
    });
    return {
      status: result?.status || "UNAVAILABLE",
      authoritative: result?.authoritative === true,
    };
  }
}
