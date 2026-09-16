"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Send, Image as ImageIcon, Link2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

const TOPIC_OPTIONS = [
  { value: "GENERAL", label: "Chung (Đời sống)" },
  { value: "CAMPUS", label: "Nhà trọ & Ký túc xá" },
  { value: "ACADEMIC", label: "Học vụ & Học tập" },
  { value: "SAFETY", label: "Cảnh báo an toàn / Lừa đảo" },
  { value: "SCHOLARSHIP", label: "Học bổng & Chính sách" },
];

export default function CommunityQuickPostDialog({
  isOpen = false,
  onClose,
  onSubmit,
  busy = false,
  isAuthenticated = false,
}) {
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("CAMPUS");
  const [locationHint, setLocationHint] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showSourceInput, setShowSourceInput] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");

  const dialogRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const charCount = content.trim().length;
  const isValid = charCount >= 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || busy) return;
    await onSubmit?.({
      content: content.trim(),
      topic,
      sourceUrl: sourceUrl.trim(),
      imageUrl: imageUrl.trim(),
      location: locationHint.trim() || undefined,
    });
    // Reset after submit
    setContent("");
    setImageUrl("");
    setSourceUrl("");
    setLocationHint("");
    setShowImageInput(false);
    setShowSourceInput(false);
    onClose?.();
  };

  const modalContent = (

    <div className="community-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="community-quickpost-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-post-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="community-modal-header">
          <div>
            <h2 id="quick-post-dialog-title" className="community-modal-title">
              Đăng một quan sát thực địa
            </h2>
            <p className="community-modal-subtitle">
              Chia sẻ điều bạn trực tiếp thấy. Community sẽ tách quan sát khỏi kết luận.
            </p>
          </div>
          <button
            type="button"
            className="community-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="community-modal-auth-warning">
            <ShieldAlert size={24} className="community-auth-warning-icon" />
            <div>
              <strong>Yêu cầu đăng nhập</strong>
              <p>Bạn cần có danh tính StudentHub xác thực để đăng bài và tương tác trong cộng đồng.</p>
              <Link href="/login?next=%2Fcommunity" className="community-modal-login-link">
                Đăng nhập ngay →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="community-modal-form">
            <div className="community-form-group">
              <label htmlFor="qp-content" className="community-form-label">
                Nội dung quan sát <span className="community-form-required">*</span>
              </label>
              <textarea
                id="qp-content"
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={20000}
                placeholder="Mô tả cụ thể điều bạn đã thấy (tối thiểu 20 ký tự)..."
                className="community-form-textarea"
                aria-required="true"
              />
              <div className="community-form-char-count">
                {charCount < 20 ? (
                  <span className="community-count-pending">Cần thêm {20 - charCount} ký tự nữa</span>
                ) : (
                  <span className="community-count-valid">
                    <CheckCircle2 size={12} /> Đã đủ độ dài ({charCount} ký tự)
                  </span>
                )}
              </div>
            </div>

            <div className="community-form-row">
              <div className="community-form-group flex-1">
                <label htmlFor="qp-topic" className="community-form-label">
                  Chủ đề
                </label>
                <select
                  id="qp-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="community-form-select"
                >
                  {TOPIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="community-form-group flex-1">
                <label htmlFor="qp-location" className="community-form-label">
                  Bối cảnh / địa điểm
                </label>
                <input
                  id="qp-location"
                  type="text"
                  value={locationHint}
                  onChange={(e) => setLocationHint(e.target.value)}
                  placeholder="Ví dụ: Ký túc xá khu B, cổng 2..."
                  className="community-form-input"
                />
              </div>
            </div>

            <div className="community-form-group">
              <span className="community-form-label">Đính kèm chứng cứ</span>
              <div className="community-attachment-toggle-bar">
                <button
                  type="button"
                  className={`community-attach-btn ${showImageInput ? "is-active" : ""}`}
                  onClick={() => setShowImageInput((prev) => !prev)}
                  aria-pressed={showImageInput}
                >
                  <ImageIcon size={14} />
                  <span>Ảnh</span>
                </button>
                <button
                  type="button"
                  className={`community-attach-btn ${showSourceInput ? "is-active" : ""}`}
                  onClick={() => setShowSourceInput((prev) => !prev)}
                  aria-pressed={showSourceInput}
                >
                  <Link2 size={14} />
                  <span>Link</span>
                </button>
                <span
                  className="community-attach-btn is-disabled"
                  title="Tính năng liên kết hồ sơ Trust Case trực tiếp từ bài đăng đang trong lộ trình"
                >
                  <span>🛡️ Trust Case</span>
                </span>
              </div>

              {showImageInput && (
                <div className="community-input-drawer">
                  <label htmlFor="qp-image-url" className="community-drawer-label">
                    Đường dẫn hình ảnh minh chứng:
                  </label>
                  <input
                    id="qp-image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... hoặc /uploads/..."
                    className="community-form-input"
                  />
                </div>
              )}

              {showSourceInput && (
                <div className="community-input-drawer">
                  <label htmlFor="qp-source-url" className="community-drawer-label">
                    Đường dẫn tài liệu / bài báo / thông báo:
                  </label>
                  <input
                    id="qp-source-url"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="community-form-input"
                  />
                </div>
              )}
            </div>

            <div className="community-privacy-card">
              <div className="community-privacy-header">
                <AlertTriangle size={15} className="community-privacy-alert-icon" />
                <span className="community-privacy-title">
                  Kiểm tra thông tin cá nhân trước khi đăng
                </span>
              </div>
              <p className="community-privacy-desc">
                Che số điện thoại, địa chỉ nhà và thông tin nhận dạng không cần thiết.
              </p>
              <div className="community-redaction-preview-box">
                <span className="community-redaction-tag">REDACTION PREVIEW · BẢN MẪU</span>
                <p className="community-redaction-note">
                  Đảm bảo không lộ số tài khoản ngân hàng hoặc CCCD của bên thứ ba.
                </p>
              </div>
            </div>

            <div className="community-modal-footer">
              <button
                type="button"
                className="community-modal-cancel-btn"
                onClick={onClose}
              >
                Hủy
              </button>
              <div className="community-modal-action-group">
                <button
                  type="button"
                  className="community-modal-draft-btn"
                  disabled
                  title="Tính năng lưu nháp máy chủ đang được hoàn thiện"
                >
                  Lưu nháp
                </button>
                <button
                  type="submit"
                  className="community-modal-submit-btn"
                  disabled={!isValid || busy}
                >
                  {busy ? "Đang đăng..." : (
                    <>
                      <Send size={14} />
                      <span>Đăng quan sát</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};