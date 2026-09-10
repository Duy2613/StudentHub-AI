import React from 'react';

/**
 * MachineDataStrip: Dense tabular metadata strip for financial balances, system stats, or telemetry.
 */
export default function MachineDataStrip({
  items = [],
  className = '',
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[var(--border-subtle)] py-2 px-4 bg-[var(--surface-quiet)] font-[family-name:var(--font-technical)] text-xs ${className}`}
    >
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] uppercase tracking-wider text-[11px]">
            {item.label}:
          </span>
          <span
            className="font-medium text-[var(--text-primary)]"
            style={{ color: item.color || undefined }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
