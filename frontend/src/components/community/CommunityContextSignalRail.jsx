"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, BookOpen, AlertCircle, Sparkles } from "lucide-react";

export default function CommunityContextSignalRail({ posts = [] }) {
  const postsWithEvidence = posts.filter((p) => (p.sources?.length || 0) + (p.media?.length || 0) > 0).length;
  const postsWithExpert = posts.filter((p) => Boolean(p.expertResponse)).length;
  const postsTrustLinked = posts.filter((p) => p.trustLinked || Boolean(p.trustCase)).length;

  return (
    <aside className="community-context-rail" aria-label="Cột tín hiệu ngữ cảnh học đường">
      <div className="community-context-card">
        <div className="community-context-card-header">
          <span className="community-kicker">Tín hiệu thực địa</span>
          <h3>Quan sát đang lưu hành</h3>
        </div>
        <p className="community-context-card-desc">
          Số liệu thống kê từ các quan sát công khai đang hiển thị trên luồng dữ liệu:
        </p>
        <ul className="community-context-stat-list">
          <li>
            <span>Tổng số quan sát:</span>
            <strong>{posts.length}</strong>
          </li>
          <li>
            <span>Có đính kèm nguồn/ảnh:</span>
            <strong>{postsWithEvidence}</strong>
          </li>
          <li>
            <span>Có phản hồi chuyên gia:</span>
            <strong>{postsWithExpert}</strong>
          </li>
          <li>
            <span>Liên kết Trust Case:</span>
            <strong>{postsTrustLinked}</strong>
          </li>
        </ul>
        <div className="community-context-disclaimer">
          <AlertCircle size={13} aria-hidden="true" />
          <span>Số liệu phản ánh dữ liệu hiện hành, không biểu thị tính xác thực chân lý.</span>
        </div>
      </div>

      <div className="community-context-card">
        <div className="community-context-card-header">
          <span className="community-kicker">Khung kiểm chứng</span>
          <h3>Quy chế & Bằng chứng</h3>
        </div>
        <div className="community-context-quote">
          <blockquote>
            “Không đánh đồng số đông với sự thật. Quy định chính thức và văn bản gốc vẫn là nguồn thẩm quyền cao nhất.”
          </blockquote>
        </div>
        <p className="community-context-card-desc">
          Khi phát hiện bất thường, bạn có thể đưa claim sang Trust Engine để đối chiếu đa chiều qua 5 lớp kiểm chứng độc lập.
        </p>
        <Link href="/trust" className="community-context-action-btn">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>Mở Trust Engine</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="community-context-card community-context-card-quiet">
        <div className="community-context-card-header">
          <span className="community-kicker">Văn hóa minh bạch</span>
          <h4>Quy tắc đối thoại</h4>
        </div>
        <ul className="community-context-rules">
          <li>• Cung cấp bằng chứng cụ thể khi nêu cảnh báo.</li>
          <li>• Tuyệt đối che mờ số điện thoại, CCCD và số tài khoản.</li>
          <li>• Tôn trọng sự khác biệt giữa quan sát cá nhân và kết luận pháp lý.</li>
        </ul>
      </div>
    </aside>
  );
}
