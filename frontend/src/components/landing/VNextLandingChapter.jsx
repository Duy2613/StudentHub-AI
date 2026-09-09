import React from "react";

export default function VNextLandingChapter({ id, number, eyebrow, title, body, children, tone = "paper" }) {
  return (
    <section id={id} className={`vnext-landing-chapter vnext-landing-chapter-${tone}`} aria-labelledby={`${id}-title`}>
      <div className="vnext-landing-chapter-grid">
        <div className="vnext-landing-chapter-intro">
          <p className="vnext-eyebrow"><span>{number}</span> / {eyebrow}</p>
          <h2 id={`${id}-title`} className="vnext-section-title">{title}</h2>
          <p className="vnext-section-copy">{body}</p>
        </div>
        <div className="vnext-landing-chapter-content">{children}</div>
      </div>
    </section>
  );
}
