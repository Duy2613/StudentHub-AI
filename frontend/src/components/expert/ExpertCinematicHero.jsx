"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Network, ShieldCheck, UserRoundCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

export default function ExpertCinematicHero({ experts = [] }) {
  return (
    <section className="expert-cinematic-hero" aria-labelledby="expert-hero-title">
      <div className="expert-hero-stage">
        {/* network.webp is the visible authority atmosphere. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="expert-hero-image" src={V3_MEDIA.expert.network} alt="Mạng lưới con người, domain và hồ sơ chuyên môn" fetchPriority="high" />
        <div className="expert-hero-vignette" aria-hidden="true" />
        <div className="expert-hero-lines" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="expert-hero-copy">
          <span className="expert-kicker">Expert / public directory</span>
          <h1 id="expert-hero-title"><span>Human</span><em>authority</em><span>network.</span></h1>
          <h2 className="expert-hero-context-heading">Đúng người, đúng phạm vi, đúng bằng chứng.</h2>
          <p>Niềm tin không đến từ một danh xưng. Nó được xây qua phạm vi, qualification và đóng góp có thể đọc lại.</p>
          <div className="expert-hero-actions">
            <a href="#expert-network" className="primary-action"><Network size={15} /> Khám phá network <ArrowRight size={15} /></a>
            <Link href="/community" className="hero-text-link"><ShieldCheck size={15} /> Đọc Community responses</Link>
          </div>
          <div className="expert-hero-boundary"><span><UserRoundCheck size={14} /> Hồ sơ công khai</span><span className="expert-hero-provider-state">LIVE PROVIDER <small>{experts.length ? `${experts.length} hồ sơ đã trả về` : "chưa trả về hồ sơ"}</small></span></div>
        </div>
        <div className="expert-hero-index" aria-hidden="true"><span>Authority</span><strong>Human context</strong><span>Public scope</span></div>
      </div>

      <div className="expert-hero-materials" aria-label="Các lớp media của Expert">
        <figure>
          {/* qualification.webp is a visual explanation of the qualification model. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.expert.qualification} alt="Minh họa các lớp qualification chuyên gia" loading="lazy" />
          <figcaption><span>Qualification model</span><strong>Identity, knowledge, practical review, human evaluation</strong></figcaption>
        </figure>
        <figure>
          {/* reputation.webp is shown as an explainability surface, never as a score. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.expert.reputation} alt="Minh họa cách đọc reputation qua lịch sử đánh giá" loading="lazy" />
          <figcaption><span>Reputation signals</span><strong>Chỉ hiển thị khi dữ liệu công khai thực sự có</strong></figcaption>
        </figure>
      </div>
    </section>
  );
}
