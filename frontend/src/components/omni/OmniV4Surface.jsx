"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Command, Compass, Search, ShieldCheck, Sparkles, UserRoundCheck, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRealtime } from '@/components/providers/RealtimeContext';
import { CANONICAL_NAVIGATION } from '@/config/navigation';
import { createQueryGate, GROUPS, LIMIT, navigationResults, normalizeQuery, routeContext, safeProductHref } from '@/lib/omni/omniV4Model';
import { isUuid } from '@/lib/trust/trustV4Model';
import { readLane, revalidateResult, searchLanes } from '@/lib/omni/omniV4Client';
import styles from './omni-v4.module.css';

const OmniAiAnswer = dynamic(() => import('./OmniAiAnswer'), { ssr: false, loading: () => <p role="status" className={styles.loading}>Đang mở phần hỗ trợ AI…</p> });
const ICONS = { NAVIGATION: Compass, COMMAND: Command, TRUST: ShieldCheck, COMMUNITY: Users, EXPERT: UserRoundCheck, SOURCE: BookOpen };
const GROUP_ORDER = ['NAVIGATION', 'COMMAND', 'TRUST', 'COMMUNITY', 'EXPERT', 'SOURCE'];

function OmniSession({ ownerId, pathname, onClose, restoreFocusRef }) {
  const router = useRouter();
  const { subscribe } = useRealtime();
  const context = useMemo(() => routeContext(pathname), [pathname]);
  const [query, setQuery] = useState('');
  const [remote, setRemote] = useState({ query: '', lanes: {} });
  const [selection, setSelection] = useState(null);
  const [activation, setActivation] = useState(null);
  const [ai, setAi] = useState(null);
  const [includeTopic, setIncludeTopic] = useState(true);
  const [reload, setReload] = useState(0);
  const inputRef = useRef(null);
  const layerRef = useRef(null);
  const dialogRef = useRef(null);
  const gate = useRef(createQueryGate());
  const controller = useRef(null);
  const selectionController = useRef(null);
  const queryRef = useRef('');
  const cleanQuery = normalizeQuery(query);
  const commandOnly = cleanQuery.startsWith('>');
  const local = useMemo(() => navigationResults(CANONICAL_NAVIGATION, cleanQuery, Boolean(ownerId)), [cleanQuery, ownerId]);
  const lanes = useMemo(() => cleanQuery.length >= 2 && !commandOnly ? searchLanes(cleanQuery, ownerId) : [], [cleanQuery, commandOnly, ownerId]);
  const activeLanes = remote.query === cleanQuery ? remote.lanes : {};
  const remoteRows = lanes.flatMap((lane) => activeLanes[lane.id]?.rows || []);
  const rows = [...local, ...remoteRows].filter((row) => activation?.unavailableKey !== row.key);
  const grouped = GROUP_ORDER.map((kind) => ({ kind, items: rows.filter((row) => row.kind === kind) })).filter((group) => group.items.length);
  const flat = grouped.flatMap((group) => group.items);
  const selected = flat.find((row) => row.key === selection) || flat[0] || null;
  const selectedIndex = selected ? flat.indexOf(selected) : -1;
  const loading = lanes.some((lane) => !activeLanes[lane.id]);
  const failures = lanes.filter((lane) => activeLanes[lane.id]?.error);

  useEffect(() => {
    const requestGate = gate.current;
    const layer = layerRef.current;
    const focused = document.activeElement;
    const previous = focused && focused !== document.body ? focused : restoreFocusRef?.current;
    const priorOverflow = document.body.style.overflow;
    const siblings = [...document.body.children].filter((node) => node !== layer && node.tagName !== 'SCRIPT');
    const priorInert = siblings.map((node) => node.inert);
    siblings.forEach((node) => { node.inert = true; });
    document.body.style.overflow = 'hidden';
    const size = () => {
      const viewport = window.visualViewport;
      layer?.style.setProperty('--omni-viewport-height', `${viewport?.height || window.innerHeight}px`);
      layer?.style.setProperty('--omni-viewport-top', `${viewport?.offsetTop || 0}px`);
    };
    size();
    window.visualViewport?.addEventListener('resize', size);
    window.visualViewport?.addEventListener('scroll', size);
    inputRef.current?.focus({ preventScroll: true });
    performance.mark('omni-v4:open');
    performance.mark('omni-v4:local-results');
    return () => {
      requestGate.invalidate(); controller.current?.abort(); selectionController.current?.abort();
      siblings.forEach((node, index) => { node.inert = priorInert[index]; });
      document.body.style.overflow = priorOverflow;
      window.visualViewport?.removeEventListener('resize', size);
      window.visualViewport?.removeEventListener('scroll', size);
      if (previous?.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [restoreFocusRef]);

  useEffect(() => {
    if (!lanes.length) return;
    const requestGate = gate.current;
    const generation = requestGate.next();
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => {
      for (const lane of lanes) {
        readLane(lane, abort.signal).then((results) => {
          if (requestGate.current(generation) && !abort.signal.aborted) {
            setRemote((state) => ({ query: cleanQuery, lanes: { ...(state.query === cleanQuery ? state.lanes : {}), [lane.id]: { rows: results } } }));
            performance.mark('omni-v4:remote-results');
          }
        }).catch((error) => {
          if (requestGate.current(generation) && !abort.signal.aborted) setRemote((state) => ({ query: cleanQuery, lanes: { ...(state.query === cleanQuery ? state.lanes : {}), [lane.id]: { rows: [], error: error.code || 'INVALID_RESPONSE', retryAfter: error.retryAfter || 0 } } }));
        });
      }
    }, 220);
    return () => { clearTimeout(timer); abort.abort(); requestGate.invalidate(); };
  }, [cleanQuery, lanes, reload]);

  useEffect(() => {
    const invalidate = () => {
      if (!queryRef.current) return;
      gate.current.invalidate(); controller.current?.abort(); selectionController.current?.abort();
      setRemote({ query: '', lanes: {} }); setActivation(null); setReload((value) => value + 1);
    };
    const subscriptions = ['trust', 'community', 'expert'].map((channel) => subscribe(channel, '*', invalidate));
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [subscribe]);

  useEffect(() => {
    if (selectedIndex >= 0) document.getElementById(`omni-option-${selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  function changeQuery(value) {
    gate.current.invalidate(); controller.current?.abort(); selectionController.current?.abort();
    queryRef.current = normalizeQuery(value);
    setQuery(value); setRemote({ query: '', lanes: {} }); setSelection(null); setActivation(null); setAi(null);
  }
  function navigate(href) {
    const safe = safeProductHref(href);
    if (!safe) return;
    onClose(); router.push(safe);
  }
  async function activate(row) {
    if (!row || activation?.state === 'pending') return;
    if (row.local) { navigate(row.href); return; }
    performance.mark('omni-v4:context-action-start');
    selectionController.current?.abort();
    const abort = new AbortController(); selectionController.current = abort;
    const queryAtStart = queryRef.current;
    setActivation({ state: 'pending', key: row.key });
    try {
      const current = await revalidateResult(row, ownerId, abort.signal);
      if (abort.signal.aborted || queryAtStart !== queryRef.current) return;
      performance.mark('omni-v4:context-action');
      if (current.kind === 'SOURCE') setActivation({ state: 'source', key: row.key, href: current.href, title: current.title });
      else navigate(current.href);
    } catch {
      if (!abort.signal.aborted) setActivation({ state: 'error', unavailableKey: row.key });
    }
  }
  function ask() {
    if (!ownerId || cleanQuery.length < 2 || commandOnly || isUuid(cleanQuery)) return;
    performance.mark('omni-v4:ai-invoke');
    setAi({ query: cleanQuery, includeTopic, id: (ai?.id || 0) + 1 });
  }
  function keyDown(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    if (event.key === 'Tab') {
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled):not([tabindex="-1"]),input,a[href]')].filter((node) => node.getClientRects().length);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.target !== inputRef.current || ai || event.nativeEvent.isComposing) return;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && flat.length) {
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? flat.length - 1 : (selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length;
      setSelection(flat[index].key);
    } else if (event.key === 'Enter' && selected) { event.preventDefault(); void activate(selected); }
  }

  return createPortal(<div ref={layerRef} className={styles.layer} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="omni-title" className={styles.dialog} onKeyDown={keyDown} data-testid="omni-v4">
      <header className={styles.header}><div className={styles.brand}><span className={styles.brandIcon}><Search size={18} aria-hidden="true" /></span><div><h2 id="omni-title">Omni</h2><p>Tìm, hiểu và đi đến điều bạn cần.</p></div></div><button className={styles.iconButton} type="button" onClick={onClose} aria-label="Đóng Omni"><X size={20} /></button></header>
      <div className={styles.searchBar}><Search size={21} aria-hidden="true" /><label className={styles.srOnly} htmlFor="omni-query">Tìm trong StudentHub</label><input ref={inputRef} id="omni-query" type="text" role="combobox" aria-autocomplete="list" aria-controls={!ai ? 'omni-results' : undefined} aria-expanded={!ai} aria-activedescendant={!ai && selectedIndex >= 0 ? `omni-option-${selectedIndex}` : undefined} maxLength={LIMIT} value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Tìm chủ đề, chuyên gia hoặc mã hồ sơ…" autoComplete="off" spellCheck={false} />{query && <button className={styles.iconButton} type="button" aria-label="Xóa truy vấn" onClick={() => { changeQuery(''); inputRef.current?.focus(); }}><X size={16} /></button>}<kbd className={styles.searchKey}>esc</kbd></div>
      <div className={styles.contextBar}><span>{commandOnly ? 'Lệnh điều hướng' : `Đang ở ${context.label}`}</span><span>{ownerId ? 'Hồ sơ riêng tư chỉ đọc theo mã đầy đủ' : 'Đang tìm nội dung công khai'}</span></div>
      <div className={styles.body}>
        {ai ? <div className={styles.aiBody}><button type="button" className={styles.back} onClick={() => setAi(null)}><ArrowLeft size={16} /> Trở lại kết quả</button><OmniAiAnswer key={`${ai.id}:${ai.query}:${ai.includeTopic}`} query={ai.query} context={context} includeTopic={ai.includeTopic} onRetry={ask} onTrust={() => navigate('/trust')} /></div> : <>
          <div className={styles.searchLayout}><div className={styles.resultsColumn}>
            <p className={styles.sectionLabel}>{cleanQuery ? 'Kết quả phù hợp' : 'Điểm đến gợi ý'}</p>
            <div id="omni-results" role="listbox" aria-label="Kết quả tìm kiếm" aria-busy={loading} className={styles.results}>
              {grouped.map(({ kind, items }) => <div key={kind} role="group" aria-label={GROUPS[kind]}><div className={styles.groupTitle} role="presentation" aria-hidden="true">{GROUPS[kind]} <span>{items.length}</span></div>{items.map((row) => {
                const Icon = ICONS[row.kind]; const index = flat.indexOf(row);
                return <button type="button" role="option" id={`omni-option-${index}`} key={row.key} aria-selected={selected?.key === row.key} tabIndex={-1} className={styles.result} onMouseMove={() => setSelection(row.key)} onClick={() => { setSelection(row.key); void activate(row); }}>
                  <span className={styles.resultIcon} data-kind={row.kind}><Icon size={18} aria-hidden="true" /></span><span className={styles.resultText}><strong>{row.title}</strong><span>{row.kind === 'EXPERT' ? row.scopes?.join(' · ') || 'Phạm vi chưa được công bố' : row.author || row.summary}</span></span><ArrowRight size={15} aria-hidden="true" className={styles.resultArrow} />
                </button>;
              })}</div>)}
            </div>
            {loading && <p className={styles.loading} role="status">Đang tìm nội dung phù hợp…</p>}
            {!loading && cleanQuery && !flat.length && !failures.length && <div className={styles.empty}><Search size={28} aria-hidden="true" /><h3>Không tìm thấy nội dung phù hợp.</h3><p>Thử từ khóa khác hoặc mở Kiểm chứng để bắt đầu từ câu hỏi của bạn.</p><button type="button" className={styles.secondary} onClick={() => navigate('/trust')}>Mở Kiểm chứng <ArrowRight size={15} /></button></div>}
            {isUuid(cleanQuery) && !ownerId && <p className={styles.notice}>Đăng nhập để tra cứu hồ sơ của bạn bằng mã đầy đủ.</p>}
            {failures.length > 0 && <p className={styles.error} role="alert">{failures.map((lane) => lane.label).join(', ')} tạm thời chưa khả dụng. {failures.some((lane) => activeLanes[lane.id].error === 'RATE_LIMITED') ? 'Giới hạn yêu cầu đã đạt; hãy thử lại sau.' : 'Bạn vẫn có thể dùng những kết quả đã tải.'}</p>}
          </div><aside className={styles.preview} aria-label="Chi tiết lựa chọn">{selected ? <><span className={styles.eyebrow}>{selected.publication || 'StudentHub'}</span><h3>{selected.title}</h3><p>{selected.summary}</p>{selected.scopes?.length > 0 && <div className={styles.scopes}>{selected.scopes.map((scope) => <span key={scope}>{scope.replaceAll('_', ' ')}</span>)}</div>}{selected.institution && <p>{selected.institution}</p>}{selected.parentTitle && <p>Nguồn trong: {selected.parentTitle}</p>}<p className={styles.match}>{selected.match}</p><button type="button" className={styles.secondary} disabled={activation?.state === 'pending'} onClick={() => void activate(selected)}>{selected.action} <ArrowUpRight size={15} /></button></> : <><span className={styles.eyebrow}>Từ câu hỏi đến hành động</span><h3>Mỗi kết quả có một bối cảnh.</h3><p>Đọc cuộc trò chuyện, xem phạm vi chuyên gia hoặc mở hồ sơ kiểm chứng của bạn.</p></>}</aside></div>
          {activation?.state === 'pending' && <p className={styles.notice} role="status">Đang kiểm tra lại quyền truy cập và nội dung…</p>}
          {activation?.state === 'error' && <p className={styles.error} role="alert">Nội dung không còn khả dụng hoặc bạn không có quyền xem. Kết quả đã được ẩn.</p>}
          {activation?.state === 'source' && <div className={styles.sourceConfirm}><p>Liên kết vẫn được đính kèm bài viết. Hãy đọc nguồn để tự đối chiếu.</p><a href={activation.href} target="_blank" rel="noopener noreferrer">Mở {activation.title} <ArrowUpRight size={15} /></a></div>}
          {!commandOnly && !isUuid(cleanQuery) && cleanQuery.length >= 2 && <div className={styles.askBar}><div><strong>Cần diễn đạt rõ câu hỏi?</strong><p>AI chỉ dùng nội dung bạn nhập.</p>{ownerId && <label className={styles.contextChoice}><input type="checkbox" checked={includeTopic} onChange={(event) => setIncludeTopic(event.target.checked)} /> Thêm chủ đề {context.label}</label>}</div>{ownerId ? <button type="button" className={styles.primary} onClick={ask}><Sparkles size={17} /> Hỏi AI</button> : <button type="button" className={styles.secondary} onClick={() => navigate('/login')}>Đăng nhập để hỏi AI</button>}</div>}
        </>}
      </div>
      <footer className={styles.footer}><span><kbd>↑ ↓</kbd> Chọn <kbd>↵</kbd> Mở <kbd>esc</kbd> Đóng</span><span>Gõ <kbd>&gt;</kbd> để tìm lệnh</span></footer>
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{!ai && !loading ? `${flat.length} kết quả${failures.length ? ', một số nguồn tìm kiếm chưa khả dụng' : ''}.` : ''}</div>
    </section>
  </div>, document.body);
}

export default function OmniV4Surface({ isOpen, onClose, restoreFocusRef = null }) {
  const { ready, isAuthenticated, session } = useAuth();
  const pathname = usePathname() || '/';
  const ownerId = ready && isAuthenticated && isUuid(session?.user?.id) ? session.user.id : null;
  return isOpen ? <OmniSession key={`${ownerId || 'anonymous'}:${pathname}`} ownerId={ownerId} pathname={pathname} onClose={onClose} restoreFocusRef={restoreFocusRef} /> : null;
}
