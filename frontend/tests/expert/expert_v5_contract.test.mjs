import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../src/", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const migration = await readFile(new URL("../../../database/migrations/20260929135354_studenthub_expert_v5_missions_rooms.sql", import.meta.url), "utf8");

test("daily mission routes use authenticated server-owned Expert permission", async () => {
  const [collection, history, detail] = await Promise.all([
    read("app/api/expert/missions/route.js"),
    read("app/api/expert/missions/history/route.js"),
    read("app/api/expert/missions/[missionId]/route.js"),
  ]);
  for (const route of [collection, history, detail]) {
    assert.match(route, /SecurityFabric\.wrapHandler/);
    assert.match(route, /requiredPermission:\s*["']EXPERT\.READ["']/);
    assert.match(route, /allowAnonymous:\s*false/);
  }
  assert.match(collection, /ExpertMissionService\.assignDailyMissions/);
  assert.match(detail, /ExpertMissionService\.submitMissionAnswer/);
});

test("mission DTO keeps answer key and explanation out of the in-progress projection", async () => {
  const service = await read("lib/server/expert/ExpertMissionService.js");
  const projection = service.slice(service.indexOf("function publicQuestion"), service.indexOf("function dailyMissionDto"));
  assert.doesNotMatch(projection, /answer_key|answerKey|explanation|evidence_refs/);
  assert.match(service, /status = 'EVALUATED'/);
  assert.match(service, /now\(\) <= \$1::timestamptz/);
});

test("mission progression remains separate from credential/reputation mutations", async () => {
  const service = await read("lib/server/expert/ExpertMissionService.js");
  assert.match(service, /private\.expert_mission_progression/);
  assert.doesNotMatch(service, /INSERT INTO private\.reputation_events/i);
  assert.doesNotMatch(service, /expert_verifications\s+SET/i);
});

test("mission page exposes source link, an honest empty bank state and no per-second live announcements", async () => {
  const page = await read("components/expert/ExpertV5Missions.jsx");
  assert.match(page, /NO_VALIDATED_QUESTIONS/);
  assert.match(page, /source\.canonicalUrl/);
  assert.match(page, /paywall|anti-bot/i);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /aria-live="assertive"/);
});

test("V5 audit event and config contracts match every server-side writer", async () => {
  const [missions, rooms, questions] = await Promise.all([
    read("lib/server/expert/ExpertMissionService.js"),
    read("lib/server/expert/ExpertVerificationRoomService.js"),
    read("lib/server/expert/ExpertQuestionBankService.js"),
  ]);
  for (const service of [missions, rooms]) {
    const declaredEvents = [...service.matchAll(/eventType:\s*["']([A-Z][A-Z_]+)["']/g)].map((match) => match[1]);
    for (const eventType of declaredEvents) assert.match(migration, new RegExp(`'${eventType}'`));
  }
  for (const eventType of ["REGISTERED", "POLICY_UPDATED", "ENABLED", "DISABLED", "INGEST_SUCCEEDED", "INGEST_BLOCKED", "INGEST_UNAVAILABLE"]) {
    assert.match(migration, new RegExp(`'${eventType}'`));
  }
  for (const service of [missions, rooms, questions]) {
    for (const [, configKey] of service.matchAll(/config_key\s*=\s*'([a-z0-9_]+)'/gi)) {
      assert.match(migration, new RegExp(`'${configKey}'`), `missing config key ${configKey}`);
    }
    for (const [, configKey] of service.matchAll(/roomSetting\(client,\s*["']([a-z0-9_]+)["']/gi)) {
      assert.match(migration, new RegExp(`'${configKey}'`), `missing config key ${configKey}`);
    }
  }
});

test("V5 editorial and source snapshot APIs are admin-only and source activation requires human checks", async () => {
  const [questionsRoute, registryRoute, snapshotsRoute] = await Promise.all([
    read("app/api/expert/v5/questions/route.js"),
    read("app/api/expert/v5/source-registry/route.js"),
    read("app/api/expert/v5/sources/route.js"),
  ]);
  for (const route of [questionsRoute, registryRoute, snapshotsRoute]) {
    assert.match(route, /requiredPermission:\s*["']ADMIN\.SECURITY["']/);
    assert.match(route, /allowAnonymous:\s*false/);
  }
  assert.match(questionsRoute, /reviewChecks:\s*body\.reviewChecks/);
  assert.match(snapshotsRoute, /listSourceSnapshots/);
});
