"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Filter, MessageSquareText, Search, ShieldCheck, Users } from "lucide-react";

function titleFor(post) {
  return post.title || String(post.topic || "Chia sẻ cộng đồng").replaceAll("_", " ");
}

function statusFor(post) {
  if (post.status) return String(post.status).replaceAll("_", " ");
  if (post.contentType === "WARNING" || post.contentType === "EDGE_CASE_WARNING") return "CẢNH BÁO THỰC TẾ";
  return "TRẢI NGHIỆM TRỰC TIẾP";
}

export function CommunityIntelligenceView({ initialPosts = [] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("ALL");
  const topics = useMemo(() => [...new Set(initialPosts.map((post) => post.topic).filter(Boolean))], [initialPosts]);
  const posts = initialPosts.filter((post) => {
    const text = `${post.title || ""} ${post.content || ""} ${post.topic || ""}`.toLowerCase();
    return (topic === "ALL" || post.topic === topic) && text.includes(query.toLowerCase());
  });

  return <div className="product-workspace">
    <header className="product-hero"><div><p className="product-kicker">Student collective intelligence</p><h1>Trải nghiệm thật, được đặt trong ngữ cảnh.</h1><p>Cộng đồng không phải bảng tin giải trí. Đây là lớp bằng chứng thực tế giúp phát hiện khoảng cách giữa quy định chính thức và điều sinh viên đang gặp.</p></div><div className="hero-seal"><Users size={20} /><span>COMMUNITY</span><strong>{initialPosts.length} báo cáo hiện có</strong></div></header>

    <section className="collective-toolbar intelligence-panel">
      <label className="product-search"><Search size={17} /><span className="sr-only">Tìm trong cộng đồng</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm vấn đề, quy trình hoặc bằng chứng..." /></label>
      <div className="flex items-center gap-2 overflow-x-auto"><Filter size={15} className="shrink-0 text-app-muted" /><button onClick={() => setTopic("ALL")} className={`filter-chip ${topic === "ALL" ? "is-active" : ""}`}>Tất cả</button>{topics.map((item) => <button key={item} onClick={() => setTopic(item)} className={`filter-chip ${topic === item ? "is-active" : ""}`}>{item.replaceAll("_", " ")}</button>)}</div>
    </section>

    <section className="collective-layout">
      <div className="space-y-4"><div className="section-heading"><div><p className="product-kicker">Live evidence stream</p><h2 className="product-section-title">Tín hiệu từ sinh viên</h2></div><span className="signal-badge">{posts.length} kết quả</span></div>
        {posts.length ? posts.map((post) => <article key={post.postId} className="intelligence-panel community-report"><div className="report-rail"><span>{String(post.authorCohort || "SV").slice(0, 3)}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="signal-badge"><MessageSquareText size={12} /> {statusFor(post)}</span>{post.authorCohort && <span className="metadata-chip">Khóa {post.authorCohort}</span>}</div><h3>{titleFor(post)}</h3><p>{post.content}</p><footer><span><Clock3 size={13} /> {post.createdAt ? new Date(post.createdAt).toLocaleDateString("vi-VN") : "Không có thời gian"}</span><span><ShieldCheck size={13} /> Nguồn: cộng đồng</span></footer></div></article>) : <div className="intelligence-panel empty-state">Không có báo cáo phù hợp với bộ lọc hiện tại.</div>}
      </div>
      <aside className="space-y-4"><div className="intelligence-panel sticky-insight"><p className="product-kicker">How to read</p><h2 className="product-section-title">Không đánh đồng số đông với sự thật</h2><ul className="reading-rules"><li><CheckCircle2 /> Trải nghiệm trực tiếp cho biết điều đã xảy ra.</li><li><AlertTriangle /> Cảnh báo cần được đối chiếu thêm nguồn độc lập.</li><li><ShieldCheck /> Quy định chính thức vẫn là nguồn thẩm quyền.</li></ul></div><div className="intelligence-panel network-bridge"><p className="product-kicker">Connected by TrustGraph</p><h3>Đưa tín hiệu vào một case kiểm chứng</h3><p>Trust Engine sẽ phân tách rủi ro, confidence và mức đủ bằng chứng.</p><Link href="/trust" className="text-link">Mở Trust Engine <ArrowRight size={14} /></Link></div></aside>
    </section>
  </div>;
}
