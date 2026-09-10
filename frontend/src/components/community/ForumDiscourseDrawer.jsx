'use client';

import React, { useEffect } from 'react';
import MarginNote from '@/components/primitives/MarginNote';

/**
 * ForumDiscourseDrawer: Absorbed long-form discourse reader within /community.
 * Merges the academic long-form discussion format with citations into the community stream.
 */
export default function ForumDiscourseDrawer({
  thread,
  isOpen,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !thread) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={thread.title || 'Thảo luận chuyên sâu'}
    >
      <div className="w-full max-w-2xl bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] h-full overflow-y-auto p-6 flex flex-col justify-between">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
            <span className="text-xs font-[family-name:var(--font-technical)] uppercase text-[var(--accent-knowledge)] tracking-wider">
              Thảo luận chuyên sâu [Học thuật]
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-[family-name:var(--font-ui)] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 border border-[var(--border-subtle)] rounded transition-colors"
            >
              Đóng [Esc]
            </button>
          </div>

          {/* Thesis */}
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] vn-heading-safe mb-3">
            {thread.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-[family-name:var(--font-technical)] mb-6">
            <span>Tác giả: {thread.author || 'Thành viên cộng đồng'}</span>
            <span>•</span>
            <span>{thread.date || 'Gần đây'}</span>
          </div>

          {/* Body Long-form Prose */}
          <div className="font-[family-name:var(--font-editorial)] text-[17px] text-[var(--text-secondary)] leading-relaxed space-y-4 mb-8">
            {typeof thread.content === 'string' ? (
              thread.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))
            ) : (
              thread.content
            )}
          </div>

          {/* Citation Margins */}
          {thread.citations && thread.citations.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-[var(--border-subtle)]">
              <h4 className="text-xs font-[family-name:var(--font-technical)] uppercase text-[var(--text-muted)] tracking-wider">
                Nguồn tham chiếu và chứng cứ:
              </h4>
              {thread.citations.map((c, idx) => (
                <MarginNote key={idx} citationIndex={idx + 1} author={c.source}>
                  {c.text}
                </MarginNote>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between mt-8">
          <span className="text-xs text-[var(--text-muted)]">
            Tuân thủ chuẩn mực học thuật StudentHub AI
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--surface-elevated)] text-[var(--text-primary)] text-xs font-semibold rounded hover:bg-[var(--surface-primary)] border border-[var(--border-subtle)] transition-colors"
          >
            Quay lại dòng tin
          </button>
        </div>
      </div>
    </div>
  );
}
