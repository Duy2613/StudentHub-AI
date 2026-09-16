"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function CommunityCinematicHero({ posts = [] }) {
  const authorNodes = posts
    .map((post) => ({ id: post.postId, label: initials(post.author?.name), name: post.author?.name }))
    .filter((node) => node.label)
    .slice(0, 3);

  return (
    <section className="community-cinematic-hero" aria-labelledby="community-hero-title">
      <div className="community-hero-stage">
        <SmartVideo
          src={V3_MEDIA.community.hero.video}
          poster={V3_MEDIA.community.hero.poster}
          priority
          alt="Sinh viên cùng đọc và trao đổi quanh tài liệu học tập"
          className="community-hero-video"
          videoClassName="community-hero-video-element"
          posterClassName="community-hero-poster"
          id="community-hero-film"
        >
          <div className="community-hero-vignette" aria-hidden="true" />
        </SmartVideo>

        <div className="community-hero-fragments" aria-hidden="true">
          <span className="community-fragment community-fragment-question">question</span>
          <span className="community-fragment community-fragment-source">source</span>
          <span className="community-fragment community-fragment-context">context</span>
          <span className="community-fragment community-fragment-response">response</span>
          <span className="community-evidence-line community-evidence-line-one" />
          <span className="community-evidence-line community-evidence-line-two" />
          {authorNodes.map((node, index) => (
            <span className={`community-hero-avatar community-hero-avatar-${index + 1}`} key={node.id} title={node.name}>
              {node.label}
            </span>
          ))}
        </div>

        <div className="community-hero-content">
          <span className="community-kicker community-hero-kicker">Community / public reading</span>
          <h1 id="community-hero-title">
            <span>Collective</span>
            <em>intelligence.</em>
          </h1>
          <h2 className="community-hero-context-heading">Trải nghiệm thật, được đặt trong ngữ cảnh.</h2>
          <p>Không phải ý kiến đông nhất. Là câu hỏi được đặt trong bối cảnh, nguồn và đối thoại.</p>
          <div className="community-hero-actions">
            <a href="#community-story" className="primary-action">Đọc cuộc thảo luận <ArrowRight size={15} /></a>
            <Link href="/trust" className="hero-text-link"><ShieldCheck size={15} /> Đưa claim sang Trust</Link>
          </div>
          <div className="community-hero-boundary">
            <span><BookOpen size={14} /> Đọc công khai</span>
            <span><MessageCircle size={14} /> Tương tác cần identity</span>
          </div>
        </div>

      </div>

      <div className="community-hero-atmosphere">
        {/* feed-bg is a visible texture layer for the feed world, not a hidden preload. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={V3_MEDIA.community.feedBg} alt="" loading="lazy" />
        <div>
          <span className="community-kicker">A living academic forum</span>
          <p>Quan sát, nguồn và phản hồi được đọc cạnh nhau để giữ lại điều còn chưa chắc.</p>
        </div>
      </div>
    </section>
  );
}
