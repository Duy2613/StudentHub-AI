import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { projectGlobal } from '../../src/lib/omni/omniV4Model.js';

function load(relative, bindings, names) {
  const source = readFileSync(new URL(`../../src/${relative}`, import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const context = { ...bindings, Response, URL, Buffer, module: { exports: {} } };
  vm.runInNewContext(`${source}\nmodule.exports = { ${names.join(', ')} };`, context);
  return context.module.exports;
}

function searchRoute({ community, experts }) {
  return load('app/api/v1/search/route.js', {
    SecurityFabric: { wrapHandler: (_policy, handler) => handler },
    CommunityRepository: { listContributions: community },
    ExpertRepository: { listPublicProfiles: experts },
    isCommunityDemoMode: () => false, isExpertDemoMode: () => false,
    ExpertPublicDTO: { toPublicDTO: (expert) => ({ fullName: expert.name }) },
  }, ['GET']).GET;
}
const request = () => new Request('http://localhost/api/v1/search?q=scholarship');
const security = { correlationId: 'four-core-fault-assurance' };
const expert = { expertId: '00000000-0000-4000-8000-000000000010', name: 'Scholarship expert' };

test('Omni returns working Expert results and safe partial diagnostics when Community fails', async () => {
  const route = searchRoute({
    community: async () => { throw new Error('password=secret SQL private-host'); },
    experts: async (options) => { assert.equal(options.query, 'scholarship'); return [expert]; },
  });
  const response = await route(request(), {}, null, security);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'PARTIAL');
  assert.equal(body.sources.community.status, 'UNAVAILABLE');
  assert.equal(body.sources.experts.status, 'AVAILABLE');
  assert.equal(body.data.results[0].id, expert.expertId);
  assert.doesNotMatch(JSON.stringify(body), /secret|private-host|SQL/);
  assert.throws(() => projectGlobal(body, 'scholarship'), { code: 'COMMUNITY_STORAGE_UNAVAILABLE' });
});

test('Omni preserves Community results when Expert fails, and reports 503 only when both fail', async () => {
  const failure = async () => { throw new Error('storage failure'); };
  const community = async (options) => {
    assert.equal(options.viewerId, '00000000-0000-4000-8000-000000000011');
    return [{ postId: '00000000-0000-4000-8000-000000000012', statement: 'Scholarship context' }];
  };
  const response = await searchRoute({ community, experts: failure })(request(), {}, { subjectId: '00000000-0000-4000-8000-000000000011' }, security);
  const body = await response.json();
  assert.equal(body.status, 'PARTIAL');
  assert.equal(projectGlobal(body, 'scholarship').length, 1);
  const unavailable = await searchRoute({ community: failure, experts: failure })(request(), {}, null, security);
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error.code, 'SEARCH_STORAGE_UNAVAILABLE');
});

test('Successful empty search is COMPLETE; short query never reaches storage', async () => {
  let calls = 0;
  const empty = async () => { calls++; return []; };
  const route = searchRoute({ community: empty, experts: empty });
  const body = await (await route(request(), {}, null, security)).json();
  assert.equal(body.status, 'COMPLETE');
  assert.equal(body.data.total, 0);
  assert.equal(calls, 2);
  assert.equal((await route(new Request('http://localhost/api/v1/search?q=x'), {}, null, security)).status, 422);
  assert.equal(calls, 2);
});

function profileService(query, logs = []) {
  return load('lib/server/profile/UserProfileService.js', {
    getPostgresPool: () => ({ query }),
    console: { error: (...args) => logs.push(args) },
  }, ['UserProfileService']).UserProfileService;
}
const owner = '00000000-0000-4000-8000-000000000020';

test('Profile includes both owner-scoped Community sources, preserves healthy source on failure', async () => {
  const logs = [];
  let contributionFailed = false;
  const service = profileService(async (sql, params) => {
    assert.equal(params[0], owner);
    if (sql.includes('public.community_contributions')) {
      if (contributionFailed) throw Object.assign(new Error('password=secret'), { code: '42P01' });
      return { rows: [{ posts: 3, comments: 4, recent_activity: [{ id: 'contribution', title: 'Published observation', created_at: '2026-10-01T02:00:00Z', case_revision: 2 }] }] };
    }
    return { rows: [{ posts: 1, comments: 2, recent_activity: [{ id: 'discussion', title: 'Social discussion', created_at: '2026-10-01T01:00:00Z' }] }] };
  }, logs);
  const complete = await service.readCommunityActivity(owner);
  assert.equal(complete.dataStatus, 'AVAILABLE');
  assert.equal(complete.posts, 4);
  assert.equal(complete.comments, 6);
  assert.equal(complete.recentActivity[0].type, 'TRUST_CONTRIBUTION');
  contributionFailed = true;
  const partial = await service.readCommunityActivity(owner);
  assert.equal(partial.dataStatus, 'PARTIAL');
  assert.equal(partial.posts, null);
  assert.equal(partial.comments, null);
  assert.equal(partial.sources.discussions.posts, 1);
  assert.equal(partial.recentActivity[0].id, 'discussion');
  assert.doesNotMatch(JSON.stringify(logs), /password|secret/);
});

test('Profile distinguishes no activity from failed reads for all three cores', async () => {
  const empty = profileService(async () => ({ rows: [{ posts: 0, comments: 0, recent_activity: [] }] }));
  assert.equal((await empty.readCommunityActivity(owner)).posts, 0);
  const failing = profileService(async () => { throw new Error('private storage error'); });
  for (const [method, count] of [['readTrustActivity', 'count'], ['readCommunityActivity', 'posts'], ['readExpertRequests', 'total']]) {
    const activity = await failing[method](owner);
    assert.equal(activity.dataStatus, 'UNAVAILABLE');
    assert.equal(activity[count], null);
  }
});

test('Next async route params reach owner-bound Trust read and preserve cross-owner denial', async () => {
  const calls = [];
  const handler = load('app/api/v1/trust/cases/[caseId]/route.js', {
    NextResponse: Response,
    SecurityFabric: { wrapHandler: (_policy, fn) => fn },
    TrustPersistenceService: { getCaseForOwner: async (id, userId, revision) => {
      calls.push({ id, userId, revision });
      return userId === owner ? { id, owner_id: owner, case_revision: revision } : null;
    } }, console: { error: () => {} },
  }, ['GET']).GET;
  const id = '00000000-0000-4000-8000-000000000021';
  const req = new Request(`http://localhost/api/v1/trust/cases/${id}?caseRevision=2`);
  const response = await handler(req, { params: Promise.resolve({ caseId: id }) }, { subjectId: owner });
  assert.equal(response.status, 200);
  assert.equal(calls[0].id, id);
  assert.equal(calls[0].revision, 2);
  assert.equal((await handler(req, { params: Promise.resolve({ caseId: id }) }, { subjectId: '00000000-0000-4000-8000-000000000022' })).status, 404);
});
