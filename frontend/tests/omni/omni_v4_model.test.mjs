import test from 'node:test';
import assert from 'node:assert/strict';
import { aiRequestBody, createQueryGate, fixtureMarked, navigationResults, projectAnswer, projectExperts, projectGlobal, projectSocial, projectTrust, routeContext, safeOmniLink, safeProductHref } from '../../src/lib/omni/omniV4Model.js';

const ID = 'e7338472-6392-4ca0-9d63-63028558713a';
const OWNER = 'f7338472-6392-4ca0-9d63-63028558713a';
const global = (results) => ({ success: true, contractVersion: 'search.v1', communitySource: 'DURABLE_POSTGRES', query: 'nguồn', data: { results } });
const social = (posts) => ({ success: true, contractVersion: 'community-social.v1', sourceState: 'DURABLE_POSTGRES', posts });

test('only canonical navigation is executable; removed and encoded routes rejected', () => {
  for (const route of ['/dashboard', '/learn', '/scholarships', '/sos', '/cases', '/trust?next=//evil.test', '/community/%2e%2e/login', '//evil.test', 'javascript:alert(1)']) assert.equal(safeProductHref(route), null);
  assert.equal(safeProductHref(`/trust?caseId=${ID}`), `/trust?caseId=${ID}`);
  assert.equal(safeProductHref(`/community/discussion/${ID}`), `/community/discussion/${ID}`);
});
test('public and account commands share navigation source and respect authentication', () => {
  const nav = [{ id:'trust', label:'Kiểm chứng', route:'/trust', group:'core', availability:'public' }, { id:'profile', label:'Hồ sơ', route:'/profile', group:'account', availability:'authenticated' }, { id:'old', label:'Old', route:'/dashboard', group:'core' }];
  assert.deepEqual(navigationResults(nav, '', false).map((r)=>r.id), ['trust']);
  assert.deepEqual(navigationResults(nav, '> ho so', true).map((r)=>r.id), ['profile']);
});
test('canonical search rejects mismatched query and does not invent Trust or Expert DTOs', () => {
  const body = global([{id:ID,kind:'COMMUNITY',title:'Nguồn đã công bố',summary:'Nội dung'}, {id:ID,kind:'TRUST',title:'Hidden'}, {id:ID,kind:'EXPERT',title:'Coarse DTO'}]);
  assert.equal(projectGlobal(body, 'nguồn').length, 1);
  assert.throws(()=>projectGlobal(body, 'new query'));
});
test('public projection excludes restricted or removed rows even if they match', () => {
  assert.deepEqual(projectGlobal(global([{id:ID,kind:'COMMUNITY',title:'private',visibility:'PRIVATE'}]), 'nguồn'), []);
  assert.deepEqual(projectSocial(social([{postId:ID,title:'hidden',publicationState:'REMOVED'}])), []);
});
test('social and contribution identities remain distinct and sources retain their parent', () => {
  const [post, source] = projectSocial(social([{postId:ID,title:'Tài liệu',content:'Nội dung',sources:[{url:'https://example.org/guide',title:'Hướng dẫn'}]}]));
  const [contribution] = projectGlobal(global([{id:ID,kind:'COMMUNITY',title:'Tài liệu'}]), 'nguồn');
  assert.notEqual(post.key, contribution.key);
  assert.equal(post.href, `/community/discussion/${ID}`); assert.equal(source.parentId, ID);
  assert.equal(source.kind, 'SOURCE'); assert.equal('confidence' in source, false);
});
test('owned Trust requires exact object and owner, never infers conclusion', () => {
  const body = { success:true,case:{id:ID,owner_id:OWNER,claims:[{statement:'Câu hỏi riêng'}]} };
  const result = projectTrust(body, ID, OWNER)[0];
  assert.equal(result.title,'Câu hỏi riêng'); assert.equal('verdict' in result,false);
  assert.throws(()=>projectTrust(body, ID, ID)); assert.throws(()=>projectTrust(body, OWNER, OWNER)); assert.throws(()=>projectTrust(body, ID, null));
});
test('Expert uses actual scopes; public reputation fields never enter result model', () => {
  const result = projectExperts({success:true,contractVersion:'experts.v1',data:{sourceState:'DURABLE_POSTGRES',experts:[{expertId:ID,name:'Tên công khai',scopes:[{domain:'PUBLIC_POLICY'}],reputationScore:100,earnedStars:['rank']} ]}})[0];
  assert.deepEqual(result.scopes,['PUBLIC_POLICY']); assert.equal('reputationScore' in result,false); assert.equal('earnedStars' in result,false);
});
test('fixture markers are rejected at envelopes, nested rows, provenance and AI boundaries', () => {
  for (const body of [{demo:true}, {data:{experts:[{fixture:true}]}}, {communitySource:'DEMO_FIXTURE'}, {provenance:'FIXTURE'}]) assert.equal(fixtureMarked(body),true);
  assert.throws(()=>projectSocial({...social([]),sourceState:'DEMO_FIXTURE'}));
  assert.throws(()=>projectExperts({success:true,contractVersion:'experts.v1',data:{experts:[]}}));
  assert.throws(()=>projectAnswer({role:'assistant',providerStatus:'LIVE',content:'fake',requestId:'r',fixture:true}));
});
test('generation order A B response B response A keeps only current B', () => {
  const gate=createQueryGate(); const a=gate.next(); const b=gate.next();
  assert.equal(gate.current(b),true); assert.equal(gate.current(a),false);
  gate.invalidate(); assert.equal(gate.current(b),false);
});
test('AI payload contains only explicit bounded query and optional known topic, no record fields', () => {
  const context={...routeContext('/trust'), caseId:ID, revision:7, privateEvidence:'DO NOT SEND', userProfile:{email:'secret'}};
  const body=aiRequestBody('Cần hỏi gì?',context,true);
  assert.equal(body.messages.length,1); assert.equal(body.subject,'trust');
  assert.equal(JSON.stringify(body).includes(ID),false); assert.equal(JSON.stringify(body).includes('DO NOT SEND'),false);
  assert.equal(aiRequestBody('Cần hỏi gì?',context,false).subject,'general');
  assert.equal(aiRequestBody('a'.repeat(8000),context,false).messages[0].content.length<300,true);
});
test('HTTP-success provider failure is unavailable; unknown/partial AI never becomes completed', () => {
  for(const status of ['LIVE_PROVIDER_NOT_CONFIGURED','PARTIAL','UNKNOWN']) assert.equal(projectAnswer({role:'assistant',providerStatus:status,content:'incomplete'}).state,'unavailable');
  const result=projectAnswer({role:'assistant',providerStatus:'LIVE',requestId:'r',content:'Text',actions:[{type:'DELETE'}]});
  assert.deepEqual(result,{state:'complete',content:'Text'});
});
test('AI links reject active content, credentials, secret queries and local destinations', () => {
  for (const href of ['javascript:alert(1)','data:text/html,hi','https://u:p@example.org','https://example.org?token=secret','http://127.0.0.1/a','http://10.0.0.1','https://localhost/a','//evil.test','/expert/queue','/settings?privacy=public']) assert.equal(safeOmniLink(href),null,href);
  assert.equal(safeOmniLink('https://example.org/source'),'https://example.org/source');
  assert.equal(safeOmniLink('/trust'),'/trust');
});
