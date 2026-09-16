"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import SmartVideo from "@/components/media/SmartVideo";

function recordedValue(value, available = true) {
  if (!available) return "Chưa có dữ liệu";
  return Number.isFinite(Number(value)) ? String(Math.max(0, Number(value))) : "Chưa có dữ liệu";
}

function Signal({ label, value, note }) {
  return <div className="expert-reputation-signal"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export default function ExpertPublicStory({ selected = null }) {
  const hasSelected = Boolean(selected);
  const credentialsAvailable = Array.isArray(selected?.credentials);
  const publicationsAvailable = Array.isArray(selected?.publications);
  const scopesAvailable = Array.isArray(selected?.scopes);
  const starsAvailable = Array.isArray(selected?.earnedStars);

  return (
    <>
      <section className="expert-live-review" aria-labelledby="expert-live-review-title">
        <div className="expert-live-review-copy">
          <span className="expert-kicker">Human review in action</span>
          <h2 id="expert-live-review-title">Một nhận định tốt phải đọc lại được</h2>
          <p>Video là lớp giải thích cho quy trình review. Nó không phải assessment của một case cụ thể.</p>
        </div>
        <SmartVideo
          src={V3_MEDIA.expert.liveReview.video}
          poster={V3_MEDIA.expert.liveReview.poster}
          alt="Minh họa một reviewer đọc claim, nguồn và ghi chú"
          className="expert-live-review-video"
          videoClassName="expert-live-review-video-element"
          id="expert-live-review-film"
        >
          <div className="expert-live-review-overlay" aria-hidden="true"><span>Claim</span><span>Source</span><span>Reviewer note</span></div>
        </SmartVideo>
        <div className="expert-live-review-footer"><span><BookOpen size={14} /> Evidence first</span><span><ShieldCheck size={14} /> Scope stays visible</span><span><MessageSquare size={14} /> Disagreement remains readable</span></div>
      </section>

      <section className="expert-reputation-story" aria-labelledby="expert-reputation-title">
        <div className="expert-reputation-copy">
          <span className="expert-kicker">Explainable reputation</span>
          <h2 id="expert-reputation-title">Reputation không phải một con số</h2>
          <p>Chỉ những tín hiệu server công khai có mặt trong hồ sơ được hiển thị. Không có xếp hạng toàn cục.</p>
          <div className="expert-reputation-grid">
            <Signal label="Domain scope" value={recordedValue(selected?.scopes?.length, scopesAvailable)} note="phạm vi trong hồ sơ" />
            <Signal label="Credentials" value={recordedValue(selected?.credentials?.length, credentialsAvailable)} note="credential công khai" />
            <Signal label="Publications" value={recordedValue(selected?.publications?.length, publicationsAvailable)} note="publication công khai" />
            <Signal label="Recorded stars" value={recordedValue(selected?.earnedStars?.length, starsAvailable)} note="không phải điểm tổng" />
          </div>
          {!hasSelected && <div className="expert-reputation-unavailable"><ShieldCheck size={16} /><span>Chọn một public profile để đọc các trường reputation được provider trả về.</span></div>}
          {hasSelected && <p className="expert-reputation-state"><span>Reputation state</span><strong>{selected.reputationState || "Chưa có trạng thái uy tín công khai"}</strong></p>}
        </div>
        <figure className="expert-reputation-media">
          {/* reputation.webp is the visual explainer for this structure, not a score display. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.expert.reputation} alt="Minh họa các lớp reputation được giải thích bằng dữ liệu" loading="lazy" />
          <figcaption>Public signals only</figcaption>
        </figure>
      </section>

      <section className="expert-cross-pillar" aria-labelledby="expert-cross-pillar-title">
        <div className="expert-cross-pillar-media">
          {/* landing/expert keeps the shared pillar story visible on the Expert route. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.landing.expert} alt="Minh họa con người chuyển bằng chứng thành quyết định học thuật" loading="lazy" />
        </div>
        <div>
          <span className="expert-kicker">From authority to evidence</span>
          <h2 id="expert-cross-pillar-title">Hồ sơ chuyên gia không phải điểm kết thúc</h2>
          <p>Một expert có thể đóng góp context cho Community hoặc tham gia Trust khi backend trả về đúng scope và case revision.</p>
          <div className="expert-cross-pillar-actions"><Link href="/community" className="text-link"><MessageSquare size={15} /> View Community contributions <ArrowRight size={15} /></Link><Link href="/trust" className="text-link"><ShieldCheck size={15} /> View Trust reviews <ArrowRight size={15} /></Link></div>
        </div>
      </section>
    </>
  );
}
