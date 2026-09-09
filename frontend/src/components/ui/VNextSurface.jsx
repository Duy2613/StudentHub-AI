import React from "react";

const SURFACE_CLASS = Object.freeze({
  paper: "surface-reading",
  instrument: "surface-instrument",
  archive: "surface-archive",
  chrome: "surface-chrome",
});

export function VNextSurface({ as: Element = "section", tone = "paper", className = "", children, ...props }) {
  const surfaceClass = SURFACE_CLASS[tone] || SURFACE_CLASS.paper;
  return (
    <Element className={`${surfaceClass} vnext-surface ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}

export default VNextSurface;
