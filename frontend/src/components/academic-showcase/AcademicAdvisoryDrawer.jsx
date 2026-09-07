"use client";

import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export default function AcademicAdvisoryDrawer({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    mssv: "",
    cohort: "K24",
    major: "Kỹ thuật Phần mềm",
    targetGoal: "Tốt nghiệp Xuất sắc (GPA >= 3.6)",
    englishLevel: "TOEIC 550+",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  };

  const resetForm = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#080d20] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={resetForm}
          className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">
                <Sparkles className="h-3 w-3" />
                <span>CÁ NHÂN HÓA LỘ TRÌNH HỌC VỤ</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Thiết Lập Bản Sao Số &amp; Kế Hoạch 4 Năm
              </h3>
              <p className="text-xs text-gray-400">
                Được đối soát 100% tất định theo khung CTĐT chính thức của nhà trường.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">HỌ VÀ TÊN SINH VIÊN</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">MÃ SỐ SINH VIÊN (MSSV)</label>
                  <input
                    type="text"
                    required
                    placeholder="23110..."
                    value={formData.mssv}
                    onChange={(e) => setFormData({ ...formData, mssv: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">KHÓA HỌC (COHORT)</label>
                  <select
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="K23">Khóa K23 (Chuẩn TOEIC 450)</option>
                    <option value="K24">Khóa K24 (Chuẩn TOEIC 500)</option>
                    <option value="K25">Khóa K25 (Chuẩn TOEIC 500)</option>
                    <option value="K26">Khóa K26 (Chuẩn TOEIC 550 / B2)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">CHUYÊN NGÀNH ĐÀO TẠO</label>
                  <select
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="Kỹ thuật Phần mềm">Kỹ thuật Phần mềm</option>
                    <option value="Khoa học Máy tính & AI">Khoa học Máy tính &amp; AI</option>
                    <option value="Kỹ thuật Robot & IoT">Kỹ thuật Robot &amp; IoT</option>
                    <option value="Hệ thống Thông tin">Hệ thống Thông tin</option>
                    <option value="An toàn Thông tin">An toàn Thông tin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">MỤC TIÊU HỌC TẬP TỐI HẬU</label>
                <select
                  value={formData.targetGoal}
                  onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-white focus:border-teal-400 focus:outline-none"
                >
                  <option value="Tốt nghiệp Xuất sắc (GPA >= 3.6)">Tốt nghiệp Xuất sắc (GPA &gt;= 3.6)</option>
                  <option value="Tốt nghiệp đúng hạn 4 năm an toàn">Tốt nghiệp đúng hạn 4 năm an toàn</option>
                  <option value="Rút ngắn tiến độ 3.5 năm bằng kỳ hè">Rút ngắn tiến độ 3.5 năm bằng kỳ hè</option>
                  <option value="Điểm cao để xin học bổng du học Thạc sĩ">Điểm cao để xin học bổng du học Thạc sĩ</option>
                </select>
              </div>

              {/* Security Invariant Guarantee */}
              <div className="flex items-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-[11px] text-teal-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Bảo mật tuyệt đối: Dữ liệu chỉ dùng để mô phỏng What-If sandbox, không sửa đổi dữ liệu phòng đào tạo.</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 py-3.5 text-xs font-black text-black shadow-lg hover:scale-[1.01] transition-transform disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSubmitting ? "ĐANG TỔNG HỢP LỘ TRÌNH..." : "KHỞI TẠO BẢN ĐỒ CHIẾN LƯỢC"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          /* Success Receipt State */
          <div className="text-center py-6 space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-400/20 border border-teal-400/40 text-teal-300 mx-auto animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">
                Khởi Tạo Lộ Trình Thành Công!
              </h3>
              <p className="font-mono text-xs text-gray-400">
                Bản đồ học tập cá nhân hóa đã được nạp vào bộ nhớ Digital Twin.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-left text-gray-300 space-y-2">
              <div className="flex justify-between border-b border-white/10 pb-2 text-teal-400 font-bold">
                <span>DIGITAL TWIN PROFILE</span>
                <span>STATUS: VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sinh viên:</span>
                <span className="text-white font-bold">{formData.name || "Nguyễn Văn A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MSSV / Khóa:</span>
                <span className="text-white">{formData.mssv || "23110098"} · {formData.cohort}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chuyên ngành:</span>
                <span className="text-white">{formData.major}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mục tiêu:</span>
                <span className="text-teal-300 font-bold">{formData.targetGoal}</span>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full rounded-xl bg-teal-400 py-3 font-mono text-xs font-black text-black hover:bg-teal-300 transition-colors shadow-lg"
            >
              HOÀN TẤT &amp; QUAY LẠI SHOWCASE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
