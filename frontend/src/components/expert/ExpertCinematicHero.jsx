"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Network, ShieldCheck, UserRoundCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

export default function ExpertCinematicHero({ experts = [] }) {
  return (
    <section className="expert-cinematic-hero" aria-labelledby="expert-hero-title">
      <div className="expert-hero-stage">
        {/* network.webp is the visible authority atmosphere with institutional border and static fallback */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="expert-hero-image rounded-xl border border-emerald-500/20 shadow-2xl object-cover"
          src={V3_MEDIA.expert.network}
          alt="Mạng lưới hội đồng chuyên môn và thẩm quyền domain"
          fetchPriority="high"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/media/v3/profile/expert.webp";
          }}
        />
        <div className="expert-hero-vignette" aria-hidden="true" />
        <div className="expert-hero-lines" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="expert-hero-copy">
          <span className="expert-kicker text-emerald-400 font-mono tracking-widest text-xs uppercase">EXPERT COUNCIL / VERIFIED JURISDICTION</span>
          <h1 id="expert-hero-title" className="expert-headline font-serif text-3xl sm:text-4xl text-slate-100 tracking-tight leading-tight">
            Chuyên môn có <em>phạm vi</em>. Bằng chứng có <em>trách nhiệm</em>.
          </h1>
          <h2 className="expert-hero-context-heading text-slate-300 text-base font-normal mt-2">Đúng người, đúng phạm vi, đúng bằng chứng.</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">Niềm tin không đến từ một danh xưng. Nó được xây qua phạm vi, qualification và đóng góp có thể đối soát minh bạch.</p>
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
