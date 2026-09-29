import { apiRequest } from '../api/runtimeClient';
import { isUuid } from '../trust/trustV4Model';
import { clean, liveEnvelope, projectGlobal, projectSocial, projectExperts, projectTrust, publiclyVisible, sourceRows } from './omniV4Model';

export function searchLanes(query, ownerId) {
  if (isUuid(query)) return ownerId ? [{ id: 'trust', label: 'Hồ sơ của bạn', path: `/api/v1/trust/cases/${query}`, project: (payload) => projectTrust(payload, query, ownerId) }] : [];
  return [
    { id: 'contributions', label: 'Đóng góp cộng đồng', path: `/api/v1/search?q=${encodeURIComponent(query)}`, project: (payload) => projectGlobal(payload, query) },
    { id: 'social', label: 'Thảo luận và nguồn', path: `/api/community/social?q=${encodeURIComponent(query)}&limit=12`, project: projectSocial },
    { id: 'experts', label: 'Chuyên gia', path: `/api/v1/experts?topic=${encodeURIComponent(query)}&limit=20`, project: projectExperts },
  ];
}
export async function readLane(lane, signal) {
  return lane.project(await apiRequest(lane.path, { signal, cache: 'no-store', timeoutMs: 12000 }));
}
export async function revalidateResult(result, ownerId, signal) {
  if (result.local) return result;
  let payload;
  if (result.kind === 'TRUST') {
    payload = await apiRequest(`/api/v1/trust/cases/${result.id}`, { signal, cache: 'no-store' });
    return projectTrust(payload, result.id, ownerId)[0];
  }
  if (result.kind === 'EXPERT') {
    payload = liveEnvelope(await apiRequest(`/api/expert/profile/${result.id}`, { signal, cache: 'no-store' }));
    if (payload.meta?.sourceState !== 'DURABLE_POSTGRES' || payload.expert?.expertId !== result.id || !publiclyVisible(payload.expert)) throw new Error('UNAVAILABLE');
    return { ...result, title: clean(payload.expert.canonicalIdentity || payload.expert.name, 180) || result.title };
  }
  if (result.channel === 'contribution') {
    payload = liveEnvelope(await apiRequest(`/api/intelligence/community/experiences/${result.id}`, { signal, cache: 'no-store' }));
    if (payload.experience?.postId !== result.id || !publiclyVisible(payload.experience)) throw new Error('UNAVAILABLE');
    return result;
  }
  const id = result.kind === 'SOURCE' ? result.parentId : result.id;
  payload = liveEnvelope(await apiRequest(`/api/community/social?postId=${id}`, { signal, cache: 'no-store' }), 'community-social.v1');
  const post = payload.posts?.find((row) => row.postId === id);
  if (payload.sourceState !== 'DURABLE_POSTGRES' || !publiclyVisible(post)) throw new Error('UNAVAILABLE');
  if (result.kind === 'SOURCE' && !sourceRows(post).some((source) => source.url === result.href)) throw new Error('UNAVAILABLE');
  return result;
}
