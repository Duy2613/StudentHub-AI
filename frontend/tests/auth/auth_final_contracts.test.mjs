import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  buildAuthCallbackUrl,
  buildLoginErrorPath,
  normalizeAuthReturnPath,
  postAuthDestination,
} from "../../src/lib/auth/authRedirects.js";
import { dynamicAuthStorage } from "../../src/lib/supabase/client.js";

const root = new URL("../../../", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), "utf8");

describe("Luna Max auth callback and persistence contracts", () => {
  it("allows only internal authenticated destinations", () => {
    assert.equal(normalizeAuthReturnPath("/community/post-1?reply=1"), "/community/post-1?reply=1");
    assert.equal(normalizeAuthReturnPath("https://evil.example/steal"), "/dashboard");
    assert.equal(normalizeAuthReturnPath("//evil.example/steal"), "/dashboard");
    assert.equal(normalizeAuthReturnPath("/\\\\evil.example"), "/dashboard");
    assert.equal(normalizeAuthReturnPath("/community/%2F%2Fevil"), "/dashboard");
    assert.equal(normalizeAuthReturnPath("/login"), "/dashboard");
    assert.equal(buildAuthCallbackUrl("https://studenthub.example", "/community/post-1"), "https://studenthub.example/callback?next=%2Fcommunity%2Fpost-1");
    assert.equal(buildLoginErrorPath("oauth_failed", "https://evil.example"), "/login?error=oauth_failed");
    assert.equal(postAuthDestination({ next: "/community/post-1", onboarded: false }), "/community/post-1");
    assert.equal(postAuthDestination({ next: "/community/post-1", onboarded: true }), "/community/post-1");
  });

  it("keeps the PKCE verifier in tab session storage while auth tokens stay in memory", () => {
    const previousWindow = globalThis.window;
    const values = new Map();
    const sessionStorage = {
      get length() { return values.size; },
      key(index) { return [...values.keys()][index] || null; },
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); },
    };
    globalThis.window = { sessionStorage };
    try {
      dynamicAuthStorage.setItem("sb-example-auth-token-code-verifier", "verifier");
      assert.equal(sessionStorage.getItem("sb-example-auth-token-code-verifier"), "verifier");
      assert.equal(dynamicAuthStorage.getItem("sb-example-auth-token-code-verifier"), "verifier");
      dynamicAuthStorage.setItem("sb-example-auth-token", "provider-session");
      assert.equal(sessionStorage.getItem("sb-example-auth-token"), null);
      assert.equal(dynamicAuthStorage.getItem("sb-example-auth-token"), "provider-session");
      dynamicAuthStorage.removeItem("sb-example-auth-token-code-verifier");
      assert.equal(sessionStorage.getItem("sb-example-auth-token-code-verifier"), null);
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  });

  it("uses PKCE and server-owned onboarding/profile authority", () => {
    const client = read("frontend/src/lib/supabase/client.js");
    const callback = read("frontend/src/app/callback/page.jsx");
    const sessionRepository = read("frontend/src/lib/security/identity/PostgresSessionRepository.js");
    const profileRepository = read("frontend/src/lib/server/database/UserProfileRepository.js");
    const profileRoute = read("frontend/src/app/api/users/profile/route.js");
    const dashboard = read("frontend/src/components/home/CommandCenterDashboard.jsx");
    const migration = read("database/migrations/202609150001_auth_profile_session_hardening.sql");
    const browserBoundaryMigration = read("database/migrations/202609150002_auth_private_browser_boundary_hardening.sql");
    const publicTrustBoundaryMigration = read("database/migrations/202609150003_auth_public_trust_boundary_hardening.sql");

    assert.match(client, /flowType:\s*["']pkce["']/);
    assert.match(client, /code-verifier/);
    assert.match(callback, /exchangeCodeForSession\(code\)/);
    assert.doesNotMatch(callback, /emailIdentity/);
    assert.match(sessionRepository, /insert into public\.profiles/i);
    assert.match(sessionRepository, /to_jsonb\(p\).*onboarded/i);
    assert.doesNotMatch(sessionRepository, /raw_user_meta_data->>'onboarded'/i);
    assert.match(profileRepository, /markOnboarded/);
    assert.match(profileRoute, /body\.onboardingCompleted === true/);
    assert.match(dashboard, /\/login\?next=%2Fdashboard/);
    assert.match(migration, /add column if not exists onboarded boolean not null default false/i);
    assert.match(migration, /insert into private\.user_roles/i);
    assert.match(migration, /for select to anon, authenticated/i);
    assert.match(migration, /revoke all on public\.profiles, public\.posts/i);
    assert.match(migration, /grant insert\(author_id, title, content, category, location_tag, images, links\)/i);
    assert.doesNotMatch(migration, /grant insert, update, delete on public\.trust_cases/i);
    assert.match(browserBoundaryMigration, /revoke all on public\.expert_assessments/i);
    assert.match(browserBoundaryMigration, /grant select on public\.trust_runs, public\.trust_stage_runs/i);
    assert.match(browserBoundaryMigration, /for select to authenticated using \(auth\.uid\(\) = owner_id\)/i);
    assert.doesNotMatch(browserBoundaryMigration, /^\s*(drop table|delete from|truncate)\b/im);
    assert.match(publicTrustBoundaryMigration, /revoke all on public\.case_inputs, public\.entities/i);
    assert.match(publicTrustBoundaryMigration, /grant select\(id, slug, name, created_at, updated_at\)/i);
    assert.match(publicTrustBoundaryMigration, /create policy case_follows_own on public\.case_follows\s+for all to authenticated/i);
    assert.doesNotMatch(publicTrustBoundaryMigration, /^\s*(drop table|delete from|truncate)\b/im);
  });
});
