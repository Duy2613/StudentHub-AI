"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, FileSearch, GitBranch, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const FLOW = [
  ["Question", "Một điều cần được đặt đúng bối cảnh."],
  ["Claim", "Một nhận định có thể được kiểm tra."],
  ["Evidence", "Nguồn, tệp hoặc trải nghiệm được công bố."],
  ["Discussion", "Các góc nhìn được đọc cạnh nhau."],
  ["Expert response", "Qualified context nếu server có projection."],
];

export default function CommunityEvidenceWorld() {
  return (
    <section className="community-evidence-world" aria-labelledby="community-evidence-world-title">
      <div className="community-evidence-world-copy">
        <span className="community-kicker">How context accumulates</span>
        <h2 id="community-evidence-world-title">Từ câu hỏi đến hiểu biết chung</h2>
        <p>Community không biến một lượt đồng ý thành sự thật. Nó làm rõ phần nào đã có nguồn, phần nào còn cần kiểm tra.</p>
        <div className="community-evidence-principle"><h3>Không đánh đồng số đông với sự thật</h3><p>Quy định chính thức vẫn là nguồn thẩm quyền.</p></div>
        <div className="community-evidence-world-actions">
          <Link href="/trust" className="text-link"><ShieldCheck size={15} /> Mở Trust Engine <ArrowRight size={15} /></Link>
          <span><FileSearch size={14} /> Source inspection dùng chung với Trust</span>
        </div>
      </div>

      <div className="community-evidence-flow" aria-label="Luồng đọc Community">
        <div className="community-evidence-flow-media">
          {/* discussion is the visual language of connected replies. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.community.discussion} alt="Minh họa các cuộc thảo luận được kết nối bởi nguồn và bằng chứng" loading="lazy" />
          <span>Discussion map</span>
        </div>
        <ol>
          {FLOW.map(([label, description], index) => (
            <li key={label} style={{ "--flow-index": index }}>
              <span className="community-flow-marker"><GitBranch size={13} /></span>
              <div><strong>{label}</strong><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </div>

      <div className="community-evidence-paper">
        {/* shared evidence paper keeps the Trust visual language present without inventing a result. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={V3_MEDIA.shared.evidencePaper} alt="Minh họa tài liệu được đọc như một nguồn bằng chứng" loading="lazy" />
        <div>
          <span className="community-kicker">Evidence attachment</span>
          <strong>PDF, URL, nguồn chính thức hoặc Trust case</strong>
          <p>Chỉ dữ liệu thật mới mở rộng được luồng này.</p>
        </div>
      </div>

      <div className="community-evidence-world-material" aria-label="Community visual language">
        <figure>
          {/* landing/community frames the public, human context around each claim. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.landing.community} alt="Minh họa không gian Community nơi câu hỏi được đặt trong bối cảnh" loading="lazy" />
          <figcaption>Community field</figcaption>
        </figure>
        <figure>
          {/* evidence-post is a specimen of the attachment layer, not a real post. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.community.evidencePost} alt="Minh họa cấu trúc bài đăng có lớp bằng chứng" loading="lazy" />
          <figcaption>Evidence post specimen</figcaption>
        </figure>
      </div>

      <div className="community-prism-texture" aria-hidden="true">
        <img src={V3_MEDIA.shared.prismTexture} alt="" loading="lazy" />
      </div>
    </section>
  );
}
