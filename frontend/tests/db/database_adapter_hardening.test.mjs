import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DatabaseAdapter,
  DatabaseNotConfiguredError,
  DatabaseUnavailableError,
  ADAPTER_MODE,
} from "../../src/lib/db/DatabaseAdapter.js";

describe("DatabaseAdapter Hardening & Production Guardrails", () => {
  const collection = "test_hardening_collection";
  const testDir = path.resolve(process.cwd(), ".data");
  const testFile = path.join(testDir, `${collection}.json`);

  beforeEach(() => {
    if (fs.existsSync(testFile)) {
      try { fs.unlinkSync(testFile); } catch {}
    }
  });

  it("dev/test mode: safely uses DURABLE_FILE with atomic persistence and version increment", async () => {
    const adapter = new DatabaseAdapter(collection, { mode: ADAPTER_MODE.DURABLE_FILE });
    assert.equal(adapter.mode, ADAPTER_MODE.DURABLE_FILE);

    const saved = await adapter.save({ id: "item_01", title: "Test Item", count: 10 });
    assert.equal(saved.id, "item_01");
    assert.equal(saved._version, 1);

    const found = await adapter.findById("item_01");
    assert.equal(found.title, "Test Item");

    const updated = await adapter.save({ id: "item_01", title: "Updated Item", count: 20 });
    assert.equal(updated._version, 2);

    const filtered = await adapter.find({ count: 20 });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].title, "Updated Item");

    const deleted = await adapter.delete("item_01");
    assert.equal(deleted, true);
    assert.equal(await adapter.findById("item_01"), null);
  });

  it("production guardrail: unconfigured Supabase in production throws DatabaseNotConfiguredError", async () => {
    const origEnv = process.env.NODE_ENV;
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const adapter = new DatabaseAdapter("production_unconfigured");
      assert.equal(adapter.mode, ADAPTER_MODE.NOT_CONFIGURED);

      await assert.rejects(
        async () => adapter.findAll(),
        (err) => {
          assert(err instanceof DatabaseNotConfiguredError);
          assert.equal(err.code, "DATABASE_NOT_CONFIGURED");
          return true;
        }
      );

      await assert.rejects(
        async () => adapter.save({ id: "fail_01" }),
        (err) => err instanceof DatabaseNotConfiguredError
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      if (origKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
    }
  });

  it("production guardrail: Supabase outage in production fails explicitly and never falls back to JSON", async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const adapter = new DatabaseAdapter(collection, { mode: ADAPTER_MODE.POSTGRES_SUPABASE });
      assert.equal(adapter.mode, ADAPTER_MODE.POSTGRES_SUPABASE);

      // In production without live network, Supabase query fails fast and throws DatabaseUnavailableError
      await assert.rejects(
        async () => adapter.findAll(),
        (err) => {
          assert(err instanceof DatabaseUnavailableError);
          assert.equal(err.code, "DATABASE_UNAVAILABLE");
          return true;
        }
      );

      // Verify that no local .data/*.json file was secretly created as a fallback!
      assert.equal(fs.existsSync(testFile), false, "Production must NOT create local JSON file on failure");
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
