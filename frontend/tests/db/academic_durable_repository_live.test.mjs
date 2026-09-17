import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import pg from "pg";
import { closePostgresPoolForTests } from "../../src/lib/server/database/PostgresPool.js";
import { AcademicTaskRepository } from "../../src/lib/server/database/AcademicTaskRepository.js";
import { AcademicNotificationRepository } from "../../src/lib/server/database/AcademicNotificationRepository.js";
import { AcademicTaskModel } from "../../src/lib/intelligence/academic/academicTaskModel.js";
import { WORKFLOW_EVENTS, WORKFLOW_STATES, AcademicWorkflowStateMachine } from "../../src/lib/intelligence/academic/academicWorkflowStateMachine.js";
import { AcademicNotificationModel, NOTIFICATION_STATUSES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const liveUrl = configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const liveGate = disposableLiveGate({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migrations = [
  readFileSync(join(repositoryRoot, "database", "migrations", "202608270001_v2_authority_foundation.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202608290001_feature_freeze_cross_system.sql"), "utf8"),
  readFileSync(join(repositoryRoot, "database", "migrations", "202609170001_durable_academic_workflows.sql"), "utf8")
];

const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const planId = `LIVE_PLAN_${crypto.randomUUID()}`;
const taskId = `LIVE_TASK_${crypto.randomUUID()}`;
let client;

async function asRole(role, subject, sql, values = []) {
  assert.match(role, /^(anon|authenticated|service_role)$/);
  await client.query("begin");
  try {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [subject || ""]);
    const result = await client.query(sql, values);
    await client.query("rollback");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

describe("durable academic repositories — disposable PostgreSQL proof", liveGate, () => {
  before(async () => {
    client = new pg.Client({ connectionString: liveUrl, ssl: false });
    await client.connect();
    for (const migration of migrations) await client.query(migration);
    await client.query(
      "insert into auth.users(id, aud, role, email, created_at, updated_at) values " +
      "($1,'authenticated','authenticated',$2,now(),now()),($3,'authenticated','authenticated',$4,now(),now()) " +
      "on conflict(id) do nothing",
      [userA, `academic-a-${userA}@example.test`, userB, `academic-b-${userB}@example.test`]
    );
  });

  after(async () => {
    await closePostgresPoolForTests();
    if (!client) return;
    await client.query("delete from public.notifications where owner_id = any($1::uuid[])", [[userA, userB]]);
    await client.query("delete from public.academic_workflow_task_events where task_id = $1", [taskId]);
    await client.query("delete from public.academic_workflow_tasks where id = $1", [taskId]);
    await client.query("delete from public.academic_workflow_plans where id = $1", [planId]);
    await client.query("delete from auth.users where id = any($1::uuid[])", [[userA, userB]]);
    await client.end();
  });

  it("survives repository/pool reconstruction and enforces owner isolation", async () => {
    const taskRepository = new AcademicTaskRepository();
    const plan = AcademicTaskModel.createActionPlan({
      planId,
      studentId: userA,
      insightId: "LIVE_DURABILITY",
      title: "Disposable durability proof",
      tasks: []
    });
    await taskRepository.savePlan(plan);

    const task = AcademicTaskModel.createTask({
      taskId,
      planId,
      studentId: userA,
      insightId: "LIVE_DURABILITY",
      type: "ACADEMIC_ACTION",
      title: "Durability task",
      status: WORKFLOW_STATES.READY,
      steps: []
    });
    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_CREATED, {
      taskId,
      fromState: null,
      toState: WORKFLOW_STATES.READY,
      actor: "SYSTEM",
      reason: "Disposable durable repository proof"
    });
    await taskRepository.saveTask({ ...task, history: [event] });
    await taskRepository.recordEvent(taskId, event);

    const notificationRepository = new AcademicNotificationRepository();
    const notification = AcademicNotificationModel.createNotification({
      studentId: userA,
      taskId,
      type: "ACADEMIC_CHANGE",
      title: "Durable notification",
      body: "This notification is a disposable persistence proof.",
      status: NOTIFICATION_STATUSES.SENT
    });
    await notificationRepository.saveNotification(notification);

    await closePostgresPoolForTests();
    const reconstructedTaskRepository = new AcademicTaskRepository();
    const reconstructedNotificationRepository = new AcademicNotificationRepository();
    const taskAfterRestart = await reconstructedTaskRepository.getTask(taskId, { ownerId: userA });
    const notificationAfterRestart = await reconstructedNotificationRepository.getNotificationById(notification.notificationId, { ownerId: userA });
    assert.equal(taskAfterRestart.taskId, taskId);
    assert.equal(taskAfterRestart.history.length, 1);
    assert.equal(notificationAfterRestart.notificationId, notification.notificationId);

    assert.equal((await reconstructedTaskRepository.getTask(taskId, { ownerId: userB })), null);
    assert.equal((await reconstructedNotificationRepository.getNotificationById(notification.notificationId, { ownerId: userB })), null);
    await assert.rejects(
      asRole("authenticated", userA, "insert into public.academic_workflow_tasks(id, owner_id, status, payload) values($1,$2,'READY','{}'::jsonb)", [`forbidden-${taskId}`, userA]),
      /permission denied/i
    );
    assert.equal((await asRole("authenticated", userA, "select id from public.academic_workflow_tasks where id=$1", [taskId])).rowCount, 1);
    assert.equal((await asRole("authenticated", userB, "select id from public.academic_workflow_tasks where id=$1", [taskId])).rowCount, 0);
  });
});

