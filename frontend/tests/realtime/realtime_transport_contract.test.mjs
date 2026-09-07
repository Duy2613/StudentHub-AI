import { test } from "node:test";
import assert from "node:assert/strict";

import { RealtimeHub } from "../../src/lib/realtime/RealtimeHub.js";

function controllerBuffer() {
  const chunks = [];
  return {
    chunks,
    controller: {
      enqueue(chunk) { chunks.push(new TextDecoder().decode(chunk)); },
      close() {},
    },
  };
}

test("realtime transport emits only committed calls and scopes replay by channel", () => {
  const hub = new RealtimeHub();
  const trust = controllerBuffer();
  const community = controllerBuffer();

  hub.registerClient("client_trust", trust.controller, ["trust"]);
  hub.registerClient("client_community", community.controller, ["community"]);

  const first = hub.broadcast("trust", "trust:stage", { stageId: "l1", operationStatus: "COMPLETED" }, { idempotencyKey: "run-1-stage-l1" });
  const replay = hub.broadcast("trust", "trust:stage", { stageId: "l1", operationStatus: "COMPLETED" }, { idempotencyKey: "run-1-stage-l1" });
  const communityEvent = hub.broadcast("community", "community:revision", { revision: 3 });

  assert.equal(first.id, replay.id);
  assert.equal(first.sequence, replay.sequence);
  assert.equal(trust.chunks.filter((chunk) => chunk.includes("trust:stage")).length, 1);
  assert.equal(community.chunks.filter((chunk) => chunk.includes("trust:stage")).length, 0);
  assert.ok(community.chunks.some((chunk) => chunk.includes("community:revision")));
  assert.equal(hub.getRuntimeSnapshot().authoritative, false);
  assert.equal(hub.history.some((event) => event.data?.operationStatus === "RUNNING"), false);
  assert.equal(communityEvent.channel, "community");

  assert.throws(() => hub.broadcast("trust", "invalid event", {}), /bounded lowercase token/);
  assert.throws(() => hub.broadcast("trust", "trust:stage", "x".repeat(70_000)), /64,?\s*KB|65536/);
});

