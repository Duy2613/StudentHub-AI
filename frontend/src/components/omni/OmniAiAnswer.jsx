"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight, RotateCcw, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/api/runtimeClient';
import { aiRequestBody, projectAnswer, safeOmniLink } from '@/lib/omni/omniV4Model';
import styles from './omni-v4.module.css';

// Deliberately small Markdown subset. React escapes every string; HTML and images
// remain plain text. Model output cannot create commands or change product state.
function InlineText({ text }) {
  const pieces = text.split(/(\[[^\]\n]{1,180}\]\([^\s)]{1,1500}\)|\*\*[^*\n]{1,400}\*\*|`[^`\n]{1,400}`)/g);
  return pieces.map((piece, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece);
    if (link) {
      const href = safeOmniLink(link[2]);
      return href ? <a key={index} href={href} target="_blank" rel="noopener noreferrer">{link[1]} <ArrowUpRight size={12} aria-hidden="true" /></a> : <span key={index}>{link[1]} (liên kết không an toàn đã ẩn)</span>;
    }
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={index}>{piece.slice(2, -2)}</strong>;
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={index}>{piece.slice(1, -1)}</code>;
    return <span key={index}>{piece}</span>;
  });
}

export default function OmniAiAnswer({ query, context, includeTopic, onRetry, onTrust }) {
  const [result, setResult] = useState({ state: 'pending' });
  useEffect(() => {
    performance.mark('omni-v4:ai-renderer');
    const controller = new AbortController();
    apiRequest('/api/chat', { method: 'POST', body: JSON.stringify(aiRequestBody(query, context, includeTopic)), signal: controller.signal, timeoutMs: 45000, cache: 'no-store' })
      .then((payload) => { if (!controller.signal.aborted) { setResult(projectAnswer(payload)); performance.mark('omni-v4:ai-ready'); } })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ state: 'error', code: error.code || 'INVALID_RESPONSE', retryAfter: error.code === 'RATE_LIMITED' ? Math.min(Math.max(Number(error.retryAfter) || 30, 1), 300) : 0 });
      });
    return () => controller.abort();
  }, [query, context, includeTopic]);
  useEffect(() => {
    if (!result.retryAfter) return;
    const timer = setTimeout(() => setResult((value) => ({ ...value, retryAfter: 0 })), result.retryAfter * 1000);
    return () => clearTimeout(timer);
  }, [result.retryAfter]);

  return <section className={styles.aiAnswer} aria-labelledby="omni-answer-heading" data-testid="omni-ai-answer">
    <div className={styles.aiHeading}><Sparkles size={18} aria-hidden="true" /><h3 id="omni-answer-heading">Gợi ý từ AI</h3></div>
    <p className={styles.contextNote}>Đang dùng: câu hỏi bạn nhập{includeTopic ? ` và chủ đề ${context.label}` : ''}. Nội dung hồ sơ, bài viết và đánh giá chuyên gia không được gửi.</p>
    <div className={styles.srOnly} role="status" aria-live="polite">{result.state === 'complete' ? 'Gợi ý AI đã sẵn sàng.' : result.state === 'pending' ? 'Đang đợi phản hồi AI.' : 'AI chưa trả lời được.'}</div>
    {result.state === 'pending' && <div className={styles.aiPending}><span className={styles.pulse} aria-hidden="true" /><div><strong>Đang đọc câu hỏi của bạn</strong><p>Phản hồi sẽ xuất hiện khi xử lý hoàn tất.</p></div></div>}
    {result.state === 'complete' && <>
      <div className={styles.prose}>{result.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}><InlineText text={paragraph} /></p>)}</div>
      <p className={styles.aiBoundary}>Gợi ý này chưa được kiểm chứng. Liên kết do AI đưa ra cần được bạn đối chiếu với nguồn gốc.</p>
      <button type="button" className={styles.primary} onClick={onTrust}>Mở Kiểm chứng <ArrowUpRight size={16} aria-hidden="true" /></button>
    </>}
    {['error', 'unavailable'].includes(result.state) && <div className={styles.error} role="alert">
      <strong>{result.code === 'UNAUTHORIZED' || result.code === 'FORBIDDEN' ? 'Phiên đăng nhập chưa cho phép dùng AI.' : 'AI tạm thời chưa trả lời được.'}</strong>
      <p>{result.code === 'TIMEOUT' ? 'Đã hết thời gian chờ. Yêu cầu phía máy chủ có thể vẫn đang xử lý.' : result.retryAfter ? `Hãy chờ ${result.retryAfter} giây trước khi thử lại.` : 'Bạn vẫn có thể tìm nội dung và mở các khu vực trong StudentHub.'}</p>
      <button type="button" className={styles.secondary} onClick={onRetry} disabled={Boolean(result.retryAfter)}><RotateCcw size={15} aria-hidden="true" /> Thử lại</button>
    </div>}
  </section>;
}
