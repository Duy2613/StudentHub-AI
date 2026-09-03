"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class TrustSectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, retryKey: 0 };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Never log the scanned content or provider payload from this boundary.
    console.error("Trust section failed", {
      section: this.props.section,
      errorName: error?.name || "Error",
    });
  }

  retry = () => {
    this.setState((state) => ({ failed: false, retryKey: state.retryKey + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <section className="intelligence-panel localized-error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <p className="product-kicker">Khu vực tạm thời không khả dụng</p>
            <h2 className="product-section-title">{this.props.fallbackTitle}</h2>
            <p className="product-copy mt-2">Phán quyết và các bằng chứng đã hoàn tất vẫn được giữ nguyên.</p>
            <button type="button" className="text-link mt-3" onClick={this.retry}>
              <RotateCcw size={14} /> Thử tải lại khu vực này
            </button>
          </div>
        </section>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
