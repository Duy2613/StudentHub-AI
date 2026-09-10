import React from 'react';

/**
 * CoordinateFrame: Precision telemetry border with corner crosshairs.
 */
export default function CoordinateFrame({
  children,
  coordinates,
  className = '',
}) {
  return (
    <div className={`relative border border-[var(--border-subtle)] bg-[var(--surface-quiet)] ${className}`}>
      {/* Corner Crosshairs */}
      <span className="absolute -top-1 -left-1 text-[10px] text-[var(--border-strong)] leading-none select-none font-[family-name:var(--font-technical)]">+</span>
      <span className="absolute -top-1 -right-1 text-[10px] text-[var(--border-strong)] leading-none select-none font-[family-name:var(--font-technical)]">+</span>
      <span className="absolute -bottom-1 -left-1 text-[10px] text-[var(--border-strong)] leading-none select-none font-[family-name:var(--font-technical)]">+</span>
      <span className="absolute -bottom-1 -right-1 text-[10px] text-[var(--border-strong)] leading-none select-none font-[family-name:var(--font-technical)]">+</span>

      {coordinates && (
        <div className="absolute top-2 right-3 text-[10px] font-[family-name:var(--font-technical)] text-[var(--text-muted)] select-none">
          {coordinates}
        </div>
      )}
      {children}
    </div>
  );
}
