"use client";

import React from "react";

const TELEMETRY_ITEMS = Object.freeze([
  "SOURCE FIRST",
  "CONTEXT BEFORE CONFIDENCE",
  "TRUST / COMMUNITY / EXPERT",
  "UNKNOWN STAYS VISIBLE",
  "POSTER FIRST",
]);

export default function HobroTelemetryMarquee({ className = "" }) {
  const repeatedItems = [...TELEMETRY_ITEMS, ...TELEMETRY_ITEMS];

  return (
    <section
      className={`reference-telemetry-marquee ${className}`.trim()}
      aria-label="StudentHub nguyên tắc kiểm chứng"
    >
      <div className="reference-telemetry-marquee-viewport" aria-hidden="true">
        <div className="reference-telemetry-marquee-track">
          {repeatedItems.map((item, index) => (
            <span className="reference-telemetry-marquee-item" key={`${item}-${index}`}>
              <i />
              {item}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">{TELEMETRY_ITEMS.join(". ")}</p>
    </section>
  );
}
