"use client";

import React from "react";

export interface KnowledgeGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
}

export function KnowledgeGlass({
  children,
  className = "",
  as = "div",
  ...props
}: KnowledgeGlassProps) {
  const Component = as;
  return (
    <Component
      className={`km-knowledge-glass ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default KnowledgeGlass;
