import React from 'react';

/**
 * EvidenceStamp: Immutable verification seal.
 */
export default function EvidenceStamp({
  verdict = 'CONFIRMED',
  hash,
  date,
  className = '',
}) {
  const configMap = {
    CONFIRMED: {
      label: 'ĐÃ XÁC MINH',
      color: 'var(--status-success)',
      borderColor: 'rgba(69, 214, 154, 0.4)',
    },
    SPECULATIVE: {
      label: 'CHƯA ĐỐI SOÁT',
      color: 'var(--status-warning)',
      borderColor: 'rgba(255, 204, 102, 0.4)',
    },
    PREDATORY: {
      label: 'CẢNH BÁO RỦI RO',
      color: 'var(--status-danger)',
      borderColor: 'rgba(255, 99, 119, 0.4)',
    },
  };

  const active = configMap[verdict] || configMap.SPECULATIVE;

  return (
    <div
      className={`inline-flex flex-col border px-2.5 py-1 text-left font-[family-name:var(--font-technical)] ${className}`}
      style={{ borderColor: active.borderColor }}
      role="status"
    >
      <span
        className="text-[11px] font-bold tracking-wider uppercase"
        style={{ color: active.color }}
      >
        [{active.label}]
      </span>
      {hash && (
        <span className="text-[9px] text-[var(--text-muted)] mt-0.5 tracking-normal">
          HASH: {hash.slice(0, 10)}...
        </span>
      )}
      {date && (
        <span className="text-[9px] text-[var(--text-muted)] opacity-80">
          {date}
        </span>
      )}
    </div>
  );
}
