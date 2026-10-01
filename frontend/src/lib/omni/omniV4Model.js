import { isUuid, safeTrustUrl } from '../trust/trustV4Model.js';

export const LIMIT = 120;
export const GROUPS = { NAVIGATION: 'Đi đến', COMMAND: 'Tài khoản', TRUST: 'Hồ sơ kiểm chứng của bạn', COMMUNITY: 'Thảo luận cộng đồng', EXPERT: 'Chuyên gia', SOURCE: 'Nguồn trong thảo luận' };
export const clean = (value, max = 240) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const list = (value) => Array.isArray(value) ? value : [];
const fold = (value) => clean(value, 24000).toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
export const matches = (value, query) => fold(value).includes(fold(query));
export const normalizeQuery = (value) => clean(value, LIMIT);

export function fixtureMarked(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 12) return false;
  return Object.entries(value).some(([key, item]) => (
    ['demo', 'fixture', 'isDemo', 'isFixture', '_fixture'].includes(key) && item === true
  ) || (['sourceState', 'sourceMode', 'communitySource', 'provenance', 'kind'].includes(key) && ['DEMO', 'DEMO_FIXTURE', 'FIXTURE'].includes(item)) || (item && typeof item === 'object' && fixtureMarked(item, depth + 1)));
}
export function liveEnvelope(payload, version) {
  if (!payload || payload.success !== true || fixtureMarked(payload) || (version && payload.contractVersion !== version)) throw new Error('INVALID_RESPONSE');
  return payload;
}
export function publiclyVisible(row) {
  return row && !fixtureMarked(row) && row.isPrivate !== true && row.isPublic !== false
    && (row.visibility == null || row.visibility === 'PUBLIC')
    && (row.publicationState == null || row.publicationState === 'PUBLISHED')
    && (row.status == null || !['DELETED', 'REMOVED', 'HIDDEN', 'RESTRICTED', 'DRAFT', 'PRIVATE'].includes(row.status));
}
export function safeProductHref(value) {
  if (typeof value !== 'string' || /[\\\s%]/.test(value)) return null;
  if (['/trust', '/community', '/expert', '/profile', '/settings', '/settings/privacy', '/login'].includes(value)) return value;
  if (/^\/(community\/(discussion\/)?|expert\/profile\/)[0-9a-f-]{36}$/i.test(value) && isUuid(value.split('/').at(-1))) return value;
  const trust = /^\/trust\?caseId=([0-9a-f-]{36})$/i.exec(value);
  return trust && isUuid(trust[1]) ? value : null;
}
export function safeOmniLink(value) {
  const local = safeProductHref(value);
  if (local) return local;
  const safe = safeTrustUrl(value);
  if (!safe || /[\u0000-\u0020\u007f]/.test(value)) return null;
  const host = new URL(safe).hostname;
  if (/^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(host) || host.endsWith('.local')) return null;
  return safe;
}
export function routeContext(pathname) {
  if (pathname === '/trust' || pathname.startsWith('/trust/')) return { id: 'trust', label: 'Kiểm chứng', prompt: 'Giúp tôi diễn đạt một câu hỏi kiểm chứng rõ ràng từ nội dung sau. Không đưa ra kết luận kiểm chứng:' };
  if (pathname === '/community' || pathname.startsWith('/community/')) return { id: 'community', label: 'Cộng đồng', prompt: 'Giúp tôi đặt câu hỏi thảo luận rõ ràng, phân biệt nhận định với ý kiến từ nội dung sau:' };
  if (pathname === '/expert' || pathname.startsWith('/expert/')) return { id: 'expert', label: 'Chuyên gia', prompt: 'Giúp tôi diễn đạt câu hỏi để tìm hiểu phạm vi chuyên môn liên quan đến nội dung sau. Không chọn người hay đưa ra đánh giá thay chuyên gia:' };
  return { id: 'general', label: 'StudentHub', prompt: 'Giúp tôi hiểu và diễn đạt rõ câu hỏi sau. Nói rõ điều chưa đủ cơ sở:' };
}
export function navigationResults(items, query, authenticated) {
  const needle = normalizeQuery(query).replace(/^>\s*/, '');
  return items.filter((item) => item.group !== 'utility' && safeProductHref(item.route) && (item.availability !== 'authenticated' || authenticated))
    .filter((item) => !needle || matches(`${item.label} ${item.id}`, needle))
    .map((item) => ({ key: `nav:${item.id}`, id: item.id, kind: item.group === 'account' ? 'COMMAND' : 'NAVIGATION', title: item.label, summary: item.group === 'account' ? 'Mở trang tài khoản của bạn.' : 'Mở khu vực trong StudentHub.', href: item.route, match: needle ? 'Khớp tên điểm đến' : 'Điểm đến trong StudentHub', action: `Mở ${item.label}`, local: true }));
}
export function projectGlobal(payload, query) {
  liveEnvelope(payload, 'search.v1');
  if (payload.communitySource !== 'DURABLE_POSTGRES' || normalizeQuery(payload.query) !== query || !Array.isArray(payload.data?.results)) throw new Error('INVALID_RESPONSE');
  if (payload.sources?.community?.status === 'UNAVAILABLE') {
    const error = new Error('Đóng góp cộng đồng tạm thời chưa khả dụng.');
    error.code = 'COMMUNITY_STORAGE_UNAVAILABLE';
    throw error;
  }
  return payload.data.results.filter((row) => row.kind === 'COMMUNITY' && isUuid(row.id) && publiclyVisible(row) && clean(row.title))
    .map((row) => ({ key: `contribution:${row.id}`, id: row.id, kind: 'COMMUNITY', channel: 'contribution', title: clean(row.title, 180), summary: clean(row.summary, 350), href: `/community/${row.id}`, match: 'Khớp văn bản trong đóng góp công khai', action: 'Mở đóng góp và bối cảnh', publication: 'Đóng góp công khai' }));
}
export function sourceRows(post) {
  return list(post.sources).map((source) => {
    const url = safeOmniLink(typeof source === 'string' ? source : source?.url);
    return url?.startsWith('http') ? { url, title: clean(source?.title, 180) || new URL(url).hostname, publisher: clean(source?.publisher, 120) || new URL(url).hostname } : null;
  }).filter(Boolean);
}
export function projectSocial(payload) {
  liveEnvelope(payload, 'community-social.v1');
  if (payload.sourceState !== 'DURABLE_POSTGRES' || !Array.isArray(payload.posts)) throw new Error('INVALID_RESPONSE');
  return payload.posts.filter((row) => isUuid(row.postId) && publiclyVisible(row)).flatMap((row) => {
    const title = clean(row.title, 180) || clean(row.content, 100) || 'Thảo luận công khai';
    const base = { key: `social:${row.postId}`, id: row.postId, kind: 'COMMUNITY', channel: 'social', title, summary: clean(row.content, 350), author: clean(row.author?.name, 100), topic: clean(row.topic, 60), href: `/community/discussion/${row.postId}`, match: 'Khớp tiêu đề hoặc nội dung · mới nhất trước', action: 'Mở cuộc trò chuyện', publication: 'Thảo luận công khai' };
    return [base, ...sourceRows(row).map((source) => ({ key: `source:${row.postId}:${source.url}`, id: source.url, kind: 'SOURCE', parentId: row.postId, parentTitle: title, title: source.title, summary: source.publisher, href: source.url, match: 'Nguồn đính kèm trong thảo luận phù hợp', action: 'Xem liên kết nguồn', publication: 'Liên kết được người đăng cung cấp' }))];
  });
}
export function projectExperts(payload) {
  liveEnvelope(payload, 'experts.v1');
  if (payload.data?.sourceState !== 'DURABLE_POSTGRES' || !Array.isArray(payload.data?.experts)) throw new Error('INVALID_RESPONSE');
  return payload.data.experts.filter((row) => isUuid(row.expertId) && publiclyVisible(row)).map((row) => ({ key: `expert:${row.expertId}`, id: row.expertId, kind: 'EXPERT', title: clean(row.canonicalIdentity || row.name, 180) || 'Hồ sơ chuyên gia', summary: clean(row.title || row.bio, 250), scopes: list(row.scopes).map((scope) => clean(scope.domain, 100)).filter(Boolean), institution: clean(row.institution, 160), href: `/expert/profile/${row.expertId}`, match: 'Khớp tên, chức danh hoặc lĩnh vực công bố', action: 'Mở hồ sơ và phạm vi', publication: 'Hồ sơ công khai' }));
}
export function projectTrust(payload, id, ownerId) {
  liveEnvelope(payload);
  const row = payload.case;
  if (!isUuid(ownerId) || !isUuid(id) || row?.id !== id || row.owner_id !== ownerId) throw new Error('UNAVAILABLE');
  return [{ key: `trust:${id}`, id, kind: 'TRUST', title: clean(list(row.claims)[0]?.statement, 180) || `Hồ sơ …${id.slice(-8)}`, summary: 'Nội dung được phép xem trong hồ sơ của bạn. Kết luận theo phiên bản chưa được cung cấp ở đây.', href: `/trust?caseId=${id}`, match: 'Khớp chính xác mã hồ sơ · quyền sở hữu được kiểm tra', action: 'Mở hồ sơ kiểm chứng', publication: 'Chỉ tài khoản của bạn', private: true }];
}
export function createQueryGate() {
  let sequence = 0;
  return { next: () => ++sequence, current: (id) => sequence === id, invalidate: () => { sequence++; } };
}
export function aiRequestBody(query, context, includeTopic) {
  const text = normalizeQuery(query);
  if (text.length < 2) throw new Error('QUERY_TOO_SHORT');
  const safeContext = ['trust', 'community', 'expert'].includes(context?.id) ? routeContext(`/${context.id}`) : routeContext('/');
  return { messages: [{ role: 'user', content: `${includeTopic ? safeContext.prompt : 'Giúp tôi hiểu câu hỏi sau; nói rõ giới hạn và điều chưa biết:'}\n${text}` }], subject: includeTopic ? safeContext.id : 'general', reasoningMode: true };
}
export function projectAnswer(payload) {
  if (!payload || fixtureMarked(payload) || payload.role !== 'assistant') throw new Error('INVALID_RESPONSE');
  if (payload.providerStatus !== 'LIVE') return { state: 'unavailable', content: '' };
  const content = clean(payload.content, 16000);
  if (!content || typeof payload.requestId !== 'string') throw new Error('INVALID_RESPONSE');
  return { state: 'complete', content };
}
