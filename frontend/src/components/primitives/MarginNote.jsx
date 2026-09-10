import React from 'react';

/**
 * MarginNote: Scholarly margin note / citation rail item.
 * On desktop (>=1024px), renders in the forensic margin rail.
 * On mobile (<1024px), renders as an inline expandable citation anchor.
 */
export default function MarginNote({
  citationIndex,
  author,
  timestamp,
  children,
  className = '',
}) {
  return (
    <aside
      className={`text-xs text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-3 py-1 font-[family-name:var(--font-ui)] ${className}`}
      aria-label={author ? `Ghi chú bởi ${author}` : 'Ghi chú nguồn chứng cứ'}
    >
      <div className="flex items-center gap-2 mb-1 text-[11px] font-[family-name:var(--font-technical)] uppercase tracking-wider text-[var(--text-secondary)]">
        {citationIndex !== undefined && (
          <span className="text-[var(--accent-trust)] font-semibold">[{citationIndex}]</span>
        )}
        {author && <span>{author}</span>}
        {timestamp && <span className="opacity-70">{timestamp}</span>}
      </div>
      <div className="text-[var(--text-secondary)] leading-relaxed">
        {children}
      </div>
    </aside>
  );
}
