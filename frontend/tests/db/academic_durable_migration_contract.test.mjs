import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (path) => readFileSync(join(repositoryRoot, path), "utf8");
const migration = read("database/migrations/202609170001_durable_academic_workflows.sql");
const notificationRoute = read("frontend/src/app/api/v1/notifications/route.js");
const taskRepository = read("frontend/src/lib/server/database/AcademicTaskRepository.js");
const notificationRepository = read("frontend/src/lib/server/database/AcademicNotificationRepository.js");
const durableWorkflowService = read("frontend/src/lib/intelligence/academic/durableAcademicWorkflowService.js");

test("academic workflow migration defines additive server-owned durable state", () => {
  for (const table of [
    "academic_workflow_plans",
    "academic_workflow_tasks",
    "academic_workflow_task_events"
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`, "i"), table);
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"), table);
  }
  for (const column of ["notification_key", "dedupe_key", "task_id", "status", "metadata", "history", "payload", "revision", "updated_at"]) {
    assert.match(migration, new RegExp(`alter table public\\.notifications add column if not exists ${column}\\b`, "i"), column);
  }
  assert.match(migration, /create unique index if not exists notifications_owner_notification_key_idx/i);
  assert.match(migration, /revoke all on public\.academic_workflow_plans,[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on public\.academic_workflow_plans,[\s\S]*to service_role/i);
  assert.doesNotMatch(migration, /drop table|truncate table|delete from public\./i);
});

test("shared task and notification durability remains wired without the retired Academic route", () => {
  assert.match(durableWorkflowService, /new AcademicTaskRepository\(\)/);
  assert.match(durableWorkflowService, /DurableAcademicNotificationService/);
  assert.match(notificationRoute, /new AcademicNotificationRepository\(\)/);
  assert.match(notificationRoute, /new DurableAcademicNotificationService/);
  assert.match(taskRepository, /process\.env\.NODE_ENV === "production"/);
  assert.match(notificationRepository, /on conflict \(owner_id, notification_key\)/i);
});
