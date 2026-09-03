"use client";

import React from "react";
import MarginMark from "./Mark";

export function Annotation({
  mark = "[n]",
  ordinal,
  title,
  body,
  voice = "system",
  active = false,
  className = "",
}) {
  return (
    <article
      className={`margin-annotation ${active ? "is-active" : ""} ${voice === "human" ? "is-human" : ""} ${className}`.trim()}
      data-mark={mark}
      data-voice={voice}
    >
      <MarginMark mark={mark} />
      <div className="margin-annotation-copy">
        {ordinal ? <span className="margin-ordinal">{ordinal}</span> : null}
        <h3>{title}</h3>
        {body ? <p>{body}</p> : null}
      </div>
    </article>
  );
}

export default Annotation;
