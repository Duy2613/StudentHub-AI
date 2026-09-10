import React from 'react';

/**
 * SignalTrace: Dynamic SVG connector line linking claims to verified source documents.
 * Adheres to Anti-Bento structural law.
 */
export default function SignalTrace({
  state = 'verified',
  direction = 'horizontal',
  length = 48,
  className = '',
}) {
  const colorMap = {
    verified: 'var(--status-success)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    neutral: 'var(--border-strong)',
  };

  const strokeColor = colorMap[state] || colorMap.neutral;
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`inline-flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        width={isHorizontal ? length : 12}
        height={isHorizontal ? 12 : length}
        viewBox={isHorizontal ? `0 0 ${length} 12` : `0 0 12 ${length}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx={6} cy={6} r={2.5} fill={strokeColor} />
        {isHorizontal ? (
          <line
            x1={6}
            y1={6}
            x2={length - 6}
            y2={6}
            stroke={strokeColor}
            strokeWidth={1}
            strokeDasharray={state === 'warning' ? '3 3' : undefined}
          />
        ) : (
          <line
            x1={6}
            y1={6}
            x2={6}
            y2={length - 6}
            stroke={strokeColor}
            strokeWidth={1}
            strokeDasharray={state === 'warning' ? '3 3' : undefined}
          />
        )}
        <circle
          cx={isHorizontal ? length - 6 : 6}
          cy={isHorizontal ? 6 : length - 6}
          r={2.5}
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}
