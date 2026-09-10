"use client";

import React from "react";

export interface PrismSweepProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function PrismSweep({ children, className = "", ...props }: PrismSweepProps) {
  return (
    <div className={`km-prism-sweep ${className}`} {...props}>
      {children}
    </div>
  );
}

export default PrismSweep;
