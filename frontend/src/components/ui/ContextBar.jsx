import React from "react";

export function ContextBar({ items = [], label = "Bối cảnh hiện tại", className = "" }) {
  const visibleItems = items.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== "");
  if (visibleItems.length === 0) return null;

  return (
    <div className={`vnext-context-bar ${className}`.trim()} role="region" aria-label={label}>
      {visibleItems.map((item) => (
        <div className="vnext-context-item" key={item.id || item.label}>
          <span className="vnext-context-label">{item.label}</span>
          <span className="vnext-context-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default ContextBar;
