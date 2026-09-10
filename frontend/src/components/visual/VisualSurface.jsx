import React from "react";

export default function VisualSurface({ as: Element = "div", tone = "cinematic", className = "", children, ...props }) {
  return (
    <Element
      className={`khai-minh-visual-surface khai-minh-visual-surface-${tone} ${className}`.trim()}
      data-visual-surface={tone}
      {...props}
    >
      {children}
    </Element>
  );
}
