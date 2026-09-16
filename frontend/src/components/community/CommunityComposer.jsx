"use client";

import React, { useState } from "react";
import { Camera, FilePlus2, Link2, Send, ShieldCheck } from "lucide-react";

const TOPICS = [
  ["GENERAL", "Chung"],
  ["CAMPUS", "Đời sống campus"],
  ["ACADEMIC", "Học tập"],
  ["SAFETY", "An toàn"],
  ["SCHOLARSHIP", "Học bổng"],
];

const PROGRESSIVE_OPTIONS = [
  ["DIRECT_EXPERIENCE", "Trải nghiệm trực tiếp"],
  ["FOUND_SOURCE", "Tôi tìm thấy nguồn"],
  ["NEEDS_VERIFICATION", "Tôi chưa chắc"],
  ["SUPPORTING_EVIDENCE", "Bổ sung bằng chứng"],
  ["CONTRADICTING_EVIDENCE", "Phản biện"],
];

export default function CommunityComposer({ busy = false, onCreate }) {
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [intent, setIntent] = useState("DIRECT_EXPERIENCE");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (content.trim().length < 20 || busy) return;
    await onCreate?.({ content: content.trim(), topic, verificationIntent: intent, sourceUrl: sourceUrl.trim(), imageUrl: imageUrl.trim() });
    setContent("");
    setSourceUrl("");
    setImageUrl("");
    setShowSource(false);
    setShowImage(false);
    setIntent("DIRECT_EXPERIENCE");
  };

  return (
    <form className="community-composer" onSubmit={submit} aria-labelledby="community-composer-title">
      <div className="community-composer-heading">
        <div><span className="data-label">Chia sẻ cùng cộng đồng</span><h2 id="community-composer-title">Bạn muốn chia sẻ điều gì?</h2></div>
        <ShieldCheck size={20} aria-hidden="true" />
      </div>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} maxLength={20_000} placeholder="Bạn muốn chia sẻ điều gì?" aria-label="Nội dung chia sẻ" />
      <div className="community-composer-controls">
        <label><span>Chủ đề</span><select value={topic} onChange={(event) => setTopic(event.target.value)}>{TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="community-composer-actions" aria-label="Tùy chọn bài chia sẻ">
          <button type="button" aria-pressed={showImage} onClick={() => setShowImage((value) => !value)}><Camera size={15} /> Ảnh</button>
          <button type="button" aria-pressed={showSource} onClick={() => setShowSource((value) => !value)}><Link2 size={15} /> Thêm nguồn</button>
          <button type="button" aria-pressed={intent === "NEEDS_VERIFICATION"} onClick={() => setIntent((value) => value === "NEEDS_VERIFICATION" ? "DIRECT_EXPERIENCE" : "NEEDS_VERIFICATION")}><FilePlus2 size={15} /> Cần xác minh</button>
        </div>
      </div>
      {(showImage || showSource) && <div className="community-composer-attachments">
        {showImage && <label><span>Đường dẫn ảnh</span><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://… hoặc /uploads/…" inputMode="url" /></label>}
        {showSource && <label><span>Nguồn tham khảo</span><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" inputMode="url" /></label>}
      </div>}
      <div className="community-composer-footer">
        <div className="community-progressive-options" aria-label="Ngữ cảnh đóng góp">
          {PROGRESSIVE_OPTIONS.map(([value, label]) => <button key={value} type="button" aria-pressed={intent === value} onClick={() => setIntent(value)}>{label}</button>)}
        </div>
        <button type="submit" className="primary-action" disabled={busy || content.trim().length < 20}>{busy ? "Đang đăng…" : <><Send size={15} /> Đăng chia sẻ</>}</button>
      </div>
      <p className="community-composer-note">Cộng đồng cung cấp tín hiệu trải nghiệm. Mọi kết luận xác minh vẫn cần nguồn độc lập và Trust.</p>
    </form>
  );
}
