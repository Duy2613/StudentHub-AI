import React from 'react';

/**
 * FieldLegend: Standardized non-color-exclusive legend for charts, maps, and schedulers.
 * WCAG 2.2 AA compliant (never relies on hue alone).
 */
export default function FieldLegend({
  entries = [],
  className = '',
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 text-xs font-[family-name:var(--font-ui)] text-[var(--text-secondary)] ${className}`}
      role="region"
      aria-label="Chú giải trạng thái"
    >
      {entries.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.colorHex }}
            aria-hidden="true"
          />
          <span className="font-medium text-[var(--text-primary)]">{entry.label}:</span>
          <span className="text-[var(--text-muted)]">{entry.description}</span>
        </div>
      ))}
    </div>
  );
}
