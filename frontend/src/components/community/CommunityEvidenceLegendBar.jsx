"use client";

import React from "react";
import { HelpCircle, AlertTriangle, ShieldCheck, Check, Sparkles, ExternalLink, HelpCircle as QuestionIcon } from "lucide-react";

export default function CommunityEvidenceLegendBar() {
  return (
    <div className="community-legend-bar" role="region" aria-label="Ký hiệu và quy ước bằng chứng">
      <div className="community-legend-inner">
        <span className="community-legend-title">KÝ HIỆU BẰNG CHỨNG</span>
        <div className="community-legend-items">
          <span className="community-legend-item">
            <span className="community-legend-symbol font-mono">[n]</span>
            <span className="community-legend-label">Source</span>
          </span>
          <span className="community-legend-item">
            <span className="community-legend-symbol">✻</span>
            <span className="community-legend-label">System note</span>
          </span>
          <span className="community-legend-item">
            <span className="community-legend-symbol font-mono">!!</span>
            <span className="community-legend-label">Warning</span>
          </span>
          <span className="community-legend-item">
            <span className="community-legend-symbol font-mono">?</span>
            <span className="community-legend-label">Uncertain</span>
          </span>
          <span className="community-legend-item">
            <span className="community-legend-symbol font-mono">..</span>
            <span className="community-legend-label">Related</span>
          </span>
          <span className="community-legend-item">
            <span className="community-legend-symbol font-mono">✕</span>
            <span className="community-legend-label">Correction</span>
          </span>
        </div>
        <span className="community-legend-help" title="Quy ước ký hiệu phân định tính chất và độ vững chắc của từng bằng chứng">
          <QuestionIcon size={14} aria-hidden="true" />
          <span>[?] Quy ước</span>
        </span>
      </div>
    </div>
  );
}
