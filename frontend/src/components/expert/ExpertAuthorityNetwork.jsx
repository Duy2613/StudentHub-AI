"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleUserRound, Network, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const EXPERT_POSITIONS = [
  [18, 28],
  [24, 72],
  [76, 22],
  [82, 70],
  [50, 88],
];

const DOMAIN_POSITIONS = [
  [8, 52],
  [38, 14],
  [67, 10],
  [92, 48],
  [62, 84],
];

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EX";
}

function domainLabel(domain) {
  return String(domain || "").replaceAll("_", " ");
}

function edgeStyle(x, y) {
  const dx = x - 50;
  const dy = y - 50;
  return {
    "--edge-width": `${Math.hypot(dx, dy)}%`,
    "--edge-angle": `${Math.atan2(dy, dx)}rad`,
  };
}

export default function ExpertAuthorityNetwork({ experts = [], selected = null, onSelect }) {
  const visibleExperts = experts.slice(0, EXPERT_POSITIONS.length);
  const selectedExpert = selected || visibleExperts[0] || null;
  const domains = [...new Set((selectedExpert?.scopes || []).map((scope) => scope.domain).filter(Boolean))].slice(0, DOMAIN_POSITIONS.length);

  return (
    <section className="expert-authority-network" aria-labelledby="expert-authority-network-title" id="expert-network">
      <div className="expert-authority-network-heading">
        <div>
          <span className="expert-kicker">Authority network</span>
          <h2 id="expert-authority-network-title">Con người ở trung tâm của phạm vi</h2>
          <p>Network chỉ mô tả quan hệ đã được API công khai trả về. Danh sách bên dưới là fallback đầy đủ, không cần hover.</p>
        </div>
        <span className="expert-network-state"><Network size={15} /> {experts.length ? `${experts.length} hồ sơ công khai` : "Chưa có hồ sơ công khai"}</span>
      </div>

      <div className="expert-authority-network-grid">
        <div className="expert-network-canvas" aria-label="Mạng lưới quan hệ chuyên gia và domain">
          <div className="expert-network-image" aria-hidden="true"><img src={V3_MEDIA.expert.network} alt="" loading="lazy" /></div>
          <div className="expert-network-orbit expert-network-orbit-one" aria-hidden="true" />
          <div className="expert-network-orbit expert-network-orbit-two" aria-hidden="true" />
          {selectedExpert && domains.map((domain, index) => {
            const [x, y] = DOMAIN_POSITIONS[index];
            return <React.Fragment key={domain}><span className="expert-network-edge" style={edgeStyle(x, y)} aria-hidden="true" /><span className="expert-network-domain-node" style={{ "--node-x": `${x}%`, "--node-y": `${y}%` }}><ShieldCheck size={12} /> {domainLabel(domain)}</span></React.Fragment>;
          })}
          {visibleExperts.map((expert, index) => {
            const [x, y] = EXPERT_POSITIONS[index];
            const isSelected = selectedExpert?.expertId === expert.expertId;
            return (
              <React.Fragment key={expert.expertId}><span className="expert-network-edge expert-network-edge-expert" style={edgeStyle(x, y)} aria-hidden="true" /><button type="button" className={`expert-network-expert-node ${isSelected ? "is-selected" : ""}`} style={{ "--node-x": `${x}%`, "--node-y": `${y}%` }} onClick={() => onSelect?.(expert)} aria-pressed={isSelected}>
                <span>{initials(expert.name)}</span>
                <strong>{expert.name}</strong>
              </button></React.Fragment>
            );
          })}
          <div className={`expert-network-center ${selectedExpert ? "has-selection" : ""}`}>
            {selectedExpert ? <><CircleUserRound size={20} /><strong>{selectedExpert.name}</strong><small>Selected profile</small></> : <><Network size={21} /><strong>Expert network</strong><small>Public projection</small></>}
          </div>
          {!experts.length && <div className="expert-network-empty"><Network size={20} /><strong>Mạng lưới chưa có dữ liệu.</strong><span>Không dựng node thay thế khi provider chưa trả về hồ sơ.</span></div>}
        </div>

        <aside className="expert-network-selection" aria-live="polite">
          {selectedExpert ? (
            <>
              <span className="expert-kicker">Selected profile</span>
              <h3>{selectedExpert.name}</h3>
              <p>{selectedExpert.bio || "Chưa có tiểu sử công khai."}</p>
              <dl>
                <div><dt>Domain</dt><dd>{selectedExpert.scopes?.length ? selectedExpert.scopes.map((scope) => domainLabel(scope.domain)).join(", ") : "Chưa công bố"}</dd></div>
                <div><dt>Qualification</dt><dd>{selectedExpert.verificationSummary?.status || selectedExpert.status || "Chưa có trạng thái"}</dd></div>
                <div><dt>Reputation</dt><dd>{selectedExpert.reputationState || "Chưa có dữ liệu uy tín công khai"}</dd></div>
              </dl>
              <Link href={`/expert/profile/${encodeURIComponent(selectedExpert.expertId)}`} className="text-link">Mở public profile <ArrowRight size={15} /></Link>
            </>
          ) : (
            <>
              <span className="expert-kicker">No public projection</span>
              <h3>Chưa có hồ sơ để chọn</h3>
              <p>Authority network sẽ hiển thị khi live provider trả về bản ghi công khai.</p>
              <Link href="/expert#expert-directory" className="text-link">Mở danh bạ <ArrowRight size={15} /></Link>
            </>
          )}
        </aside>
      </div>

      {experts.length > 0 && (
        <div className="expert-network-fallback" id="expert-network-list">
          <span><BookOpen size={14} /> Semantic list fallback</span>
          <p>Chọn một hồ sơ để cập nhật network và dossier.</p>
          <div>{experts.map((expert) => <button type="button" key={expert.expertId} onClick={() => onSelect?.(expert)} className={selected?.expertId === expert.expertId ? "is-selected" : ""}>{expert.name}</button>)}</div>
        </div>
      )}
    </section>
  );
}
