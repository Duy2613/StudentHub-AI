"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardCheck, FileClock, FolderOpen, LockKeyhole, Search, ShieldCheck, UserRoundCheck } from "lucide-react";

const TABS = [
  ["missions", "Nhiệm vụ", ClipboardCheck],
  ["blind-review", "Blind Review", ShieldCheck],
  ["pending", "Chờ đối soát", FileClock],
  ["history", "Lịch sử", FolderOpen],
  ["profile", "Hồ sơ", UserRoundCheck],
];
const EXPERT_TAB_IDS = TABS.map(([id]) => id);

function EmptyPanel({ title, body, action = null }) {
  return <div className="expert-operational-empty"><LockKeyhole size={19} /><div><strong>{title}</strong><p>{body}</p>{action}</div></div>;
}

export default function ExpertOperationalWorkspace({ profile = null, verifiedDomains = [], moderatorEligible = false }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get("tab");
  const [tab, setTab] = useState(EXPERT_TAB_IDS.includes(requestedTab) ? requestedTab : "missions");
  const [notice, setNotice] = useState("");
  const name = profile?.fullName || "Chuyên gia StudentHub";
  useEffect(() => {
    if (EXPERT_TAB_IDS.includes(requestedTab)) setTab(requestedTab);
  }, [requestedTab]);
  return (
    <section className="expert-operational-workspace" aria-labelledby="expert-operational-title">
      <header className="expert-operational-header"><div><span className="data-label">Active expert · server verified</span><h2 id="expert-operational-title">{name}</h2><p>Quyền thao tác chỉ áp dụng trong domain đã được máy chủ xác nhận.</p></div><div className="expert-active-mark"><ShieldCheck size={19} /><strong>ACTIVE</strong></div></header>
      <div className="expert-operational-facts"><span><strong>{verifiedDomains.length || "Chưa có dữ liệu"}</strong> domain xác minh</span><span>Reputation state: <strong>{profile?.reputationState || "Chưa đủ dữ liệu uy tín"}</strong></span><span>Earned stars: <strong>{Array.isArray(profile?.earnedStars) && profile.earnedStars.length ? profile.earnedStars.length : "Chưa có xếp hạng sao"}</strong></span><span>Assessment stats: <strong>Chưa có dữ liệu</strong></span></div>
      <nav className="expert-operational-tabs" aria-label="Expert Dashboard"><div>{TABS.map(([id, label, Icon]) => <button type="button" key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}><Icon size={15} /> {label}</button>)}{moderatorEligible && <button type="button" className={tab === "moderation" ? "is-active" : ""} onClick={() => setTab("moderation")}><ShieldCheck size={15} /> Kiểm duyệt</button>}</div></nav>
      {tab === "missions" && <EmptyPanel title="Chưa có nhiệm vụ được giao" body="Nhiệm vụ blind review chỉ xuất hiện khi coordinator tạo assignment phù hợp với domain đã xác minh." action={<Link href="/expert/profile" className="text-link">Kiểm tra hồ sơ qualification</Link>} />}
      {tab === "blind-review" && <EmptyPanel title="Chưa có phiên blind review" body="Blind Review chỉ mở cho assessment được assignment và case revision kiểm soát bởi server. Không dựng dữ liệu review thay thế." />}
      {tab === "pending" && <EmptyPanel title="Chưa có bài chờ đối soát" body="Không tự tạo dữ liệu review. Khi có assignment, trạng thái và khóa gửi sẽ đọc từ server." />}
      {tab === "history" && <EmptyPanel title="Chưa có lịch sử hoạt động" body="Lịch sử chỉ hiển thị assessment/review đã được ghi bền vững." />}
      {tab === "profile" && <div className="expert-operational-profile"><div className="expert-public-profile-card"><UserRoundCheck size={18} /><div><strong>{profile?.fullName || "Chưa công bố tên"}</strong><p>{profile?.bio || "Chưa có tiểu sử công khai."}</p></div></div><div className="expert-domain-pills">{verifiedDomains.length ? verifiedDomains.map((domain) => <span key={domain}><ShieldCheck size={13} /> {domain.replaceAll("_", " ")}</span>) : <span>Chưa có domain xác minh</span>}</div><Link href="/expert/profile" className="text-link">Mở hồ sơ qualification</Link></div>}
      {tab === "moderation" && moderatorEligible && <div className="expert-moderation-panel"><Search size={18} /><div><strong>Kiểm duyệt cộng đồng</strong><p>Quyền này được mở độc lập bởi vai trò moderator/admin từ server, không đến từ expert status.</p><button type="button" className="secondary-action" onClick={() => setNotice("Công cụ kiểm duyệt đang chờ module vận hành được server mở.")}>Mở queue kiểm duyệt</button></div></div>}
      {notice && <p className="unified-inline-notice" role="status">{notice}</p>}
    </section>
  );
}
