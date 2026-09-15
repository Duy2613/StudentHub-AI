"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Edit3, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import UnifiedAppShell from "@/components/layout/UnifiedAppShell";

const EDITABLE_FIELDS = ["fullName", "avatarId", "university", "major", "academicYear", "bio"];

function profileValue(profile, key) {
  return profile?.[key] || "";
}

export default function ProfilePage() {
  const { profile, session, isLoading, isAuthenticated, status, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    setDraft(Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, profileValue(profile, field)])));
  }, [profile]);

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateProfile(draft);
      setEditing(false);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error?.message || "Không thể lưu hồ sơ lúc này.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedAppShell>
      <div className="unified-workspace unified-profile-workspace">
        {(isLoading || status === "UNKNOWN") && <div className="workspace-loading" role="status">Đang xác minh phiên và đọc hồ sơ cá nhân…</div>}
        {!isLoading && status === "ERROR" && <section className="unified-auth-empty" role="alert"><UserRound size={25} /><h1>Không thể xác minh phiên</h1><p>Dịch vụ xác thực hoặc hồ sơ hiện chưa khả dụng. Vui lòng thử lại sau.</p><Link href="/" className="secondary-action">Về trang chủ</Link></section>}
        {!isLoading && status === "ANONYMOUS" && <section className="unified-auth-empty"><UserRound size={25} /><h1>Hồ sơ cá nhân</h1><p>Đăng nhập để xem và chỉnh các trường hồ sơ thuộc về bạn.</p><Link href="/login?next=%2Fprofile" className="primary-action">Đăng nhập</Link></section>}
        {!isLoading && status === "READY" && isAuthenticated && <>
          <header className="unified-page-intro"><div><span className="data-label">User Profile · identity</span><h1>{profile?.fullName || "Thành viên StudentHub"}</h1><p>Hồ sơ cá nhân là nơi quản lý danh tính và thông tin học tập. Quyền chuyên gia, star level, reputation và moderator eligibility không thể chỉnh ở đây.</p></div><div className="unified-intro-mark"><UserRound size={22} /><span>USER</span><strong>Phiên đã xác thực</strong></div></header>
          {saveError && <div className="community-state community-state-error" role="alert">{saveError}</div>}
          {saveSuccess && <div className="unified-inline-notice" role="status">Đã lưu các trường hồ sơ không đặc quyền.</div>}

          <section className="user-profile-card" aria-labelledby="user-profile-title"><div className="user-profile-identity"><AvatarDisplay avatarId={profile?.avatarId || null} avatarUrl={profile?.avatarUrl || null} size="lg" /><div><span className="data-label">Canonical identity</span><h2 id="user-profile-title">{profile?.fullName || "Chưa đặt tên"}</h2><p>{profile?.bio || "Chưa có tiểu sử."}</p><div className="user-profile-tags"><span><Mail size={13} /> {session?.user?.email || profile?.email || "Email chưa công bố"}</span>{profile?.emailVerified ? <span className="is-verified"><CheckCircle2 size={13} /> Email đã xác thực</span> : <span>Email chưa xác thực</span>}</div></div></div><div className="user-profile-actions"><button type="button" className="secondary-action" onClick={() => { setEditing((value) => !value); setSaveError(""); }}><Edit3 size={15} /> {editing ? "Đóng chỉnh sửa" : "Chỉnh sửa"}</button></div></section>

          {editing ? <form className="user-profile-edit-card" onSubmit={save}><div className="user-profile-edit-heading"><div><span className="data-label">Editable profile fields</span><h2>Thông tin có thể chỉnh sửa</h2></div><ShieldCheck size={18} /></div><div className="user-profile-form-grid"><label><span>Họ và tên</span><input value={draft.fullName || ""} onChange={(event) => updateDraft("fullName", event.target.value)} maxLength={120} required /></label><label><span>Avatar ID</span><input value={draft.avatarId || ""} onChange={(event) => updateDraft("avatarId", event.target.value)} maxLength={80} placeholder="Tuỳ chọn" /></label><label><span>Trường / đại học</span><input value={draft.university || ""} onChange={(event) => updateDraft("university", event.target.value)} maxLength={180} placeholder="Chưa cập nhật" /></label><label><span>Chuyên ngành</span><input value={draft.major || ""} onChange={(event) => updateDraft("major", event.target.value)} maxLength={180} placeholder="Chưa cập nhật" /></label><label><span>Năm học</span><input value={draft.academicYear || ""} onChange={(event) => updateDraft("academicYear", event.target.value)} maxLength={80} placeholder="Chưa cập nhật" /></label><label className="user-profile-form-wide"><span>Tiểu sử</span><textarea value={draft.bio || ""} onChange={(event) => updateDraft("bio", event.target.value)} rows={4} maxLength={1000} placeholder="Một vài dòng về bạn…" /></label></div><div className="user-profile-form-footer"><span>Chỉ gửi {EDITABLE_FIELDS.length} trường được cho phép.</span><button type="submit" className="primary-action" disabled={saving}>{saving ? "Đang lưu…" : <><Save size={15} /> Lưu hồ sơ</>}</button></div></form> : <section className="user-profile-details" aria-label="Thông tin hồ sơ"><div><span className="data-label">Học tập</span><strong>{profile?.university || "Chưa cập nhật"}</strong><small>{profile?.major || "Chưa cập nhật chuyên ngành"} · {profile?.academicYear || "Chưa cập nhật năm học"}</small></div><div><span className="data-label">Trust / uy tín</span><strong>{profile?.trustScore == null ? "Chưa có dữ liệu uy tín" : profile.trustScore}</strong><small>Chỉ hiển thị khi có nguồn authority tương ứng.</small></div><div><span className="data-label">Hoạt động cộng đồng</span><strong>Chưa có dữ liệu</strong><small>Không dựng số bài, vote hoặc cấp độ thay thế.</small></div></section>}

          <div className="user-profile-lower-grid"><section className="user-profile-boundary-card"><span className="data-label">Expert boundary</span><h2>Expert là qualification riêng</h2><p>Muốn trở thành expert, hãy bắt đầu hồ sơ qualification. User Profile không có trường role và không cấp star/reputation.</p><Link href="/expert/profile" className="text-link">Mở Expert Profile <ArrowRight size={14} /></Link></section><section className="user-profile-activity-card"><span className="data-label">Community activity</span><h2>Hoạt động của bạn</h2><p>Post, comment, evidence và các yêu cầu xác minh sẽ hiển thị khi server có dữ liệu bền vững.</p><Link href="/community" className="text-link">Mở Community <ArrowRight size={14} /></Link></section></div>
        </>}
      </div>
    </UnifiedAppShell>
  );
}
