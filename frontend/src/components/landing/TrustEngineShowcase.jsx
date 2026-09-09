"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Scale,
  ShieldCheck,
  Search,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

/**
 * TrustEngineShowcase: Từ Lời Nói Thành Bằng Chứng
 * StudentHub Visual System VNext — "Khai Minh"
 * - Continuous Evidence Beam: CLAIM → CONTEXT → EVIDENCE → VERIFICATION (L1 → L4)
 * - Academic verification lab aesthetic (not CI/CD pipeline)
 * - Signature Double-Bezel on the final verification instrument
 * - Reasoning > Confidence percentage
 * - Truthful states (XÁC THỰC, CẢNH BÁO, CHƯA ĐỦ CĂN CỨ) with text, icon and explanation
 */

const SAMPLE_CLAIMS = [
  {
    id: "hoc-phi",
    type: "Tài chính học vụ",
    title: "Thông báo nộp học phí qua cổng trung gian giảm 20%",
    sampleTarget: "thongbaohocphi-edu-vn.com/pay",
    status: "CRITICAL",
    statusLabel: "PHÁT HIỆN RỦI RO CAO",
    statusDesc: "Tên miền giả mạo mới tạo 3 ngày, không thuộc dải IP máy chủ nhà trường.",
    confidence: "98.2%",
    evidenceAgreement: "4/4 nguồn đồng thuận rủi ro",
    sourceQuality: "Đối soát DNS + Danh bạ ngân hàng chỉ định",
    uncertainty: "Chưa ghi nhận số lượng sinh viên đã chuyển khoản",
    why: "Nhà trường không có chính sách chiết khấu 20% học phí qua cổng trung gian thứ ba.",
    nextAction: "Dừng giao dịch ngay lập tức. Báo cáo phòng Kế hoạch - Tài chính nhà trường.",
    evidenceLayers: [
      { layer: "L1", name: "Cú pháp & Định danh", verdict: "Tên miền sai quy chuẩn .edu.vn", ok: false },
      { layer: "L2", name: "Đối soát Quy chế", verdict: "Không có văn bản giảm học phí quý 3", ok: false },
      { layer: "L3", name: "Phân tích Bằng chứng", verdict: "Số tài khoản nhận tiền là tài khoản cá nhân", ok: false },
      { layer: "L4", name: "Thẩm định Chuyên gia", verdict: "Phát hiện mã độc thu thập OTP ngân hàng", ok: false },
    ],
  },
  {
    id: "ngoai-ngu",
    type: "Chuẩn đầu ra",
    title: "Chứng chỉ Aptis ESOL quy đổi điểm chuẩn tốt nghiệp 2026",
    sampleTarget: "Quyết định số 1428/QĐ-ĐHQG",
    status: "VERIFIED",
    statusLabel: "XÁC THỰC NGUỒN CHÍNH THỨC",
    statusDesc: "Khớp hoàn toàn với văn bản quy định chuẩn ngoại ngữ ban hành tháng 01/2026.",
    confidence: "99.5%",
    evidenceAgreement: "3/3 nguồn đồng thuận",
    sourceQuality: "Công báo ĐHQG + Cổng xác thực của Hội đồng Khảo thí",
    uncertainty: "Áp dụng từ khóa tuyển sinh 2022 trở đi, khóa cũ áp dụng quy chế riêng",
    why: "Văn bản đã được ký số hợp lệ và đối soát trực tiếp với cơ sở dữ liệu đào tạo.",
    nextAction: "Nộp hồ sơ minh chứng tại phòng Đào tạo trước ngày 15/10 để xét đợt 1.",
    evidenceLayers: [
      { layer: "L1", name: "Cú pháp & Định danh", verdict: "Chữ ký số hợp lệ từ ĐHQG", ok: true },
      { layer: "L2", name: "Đối soát Quy chế", verdict: "Khớp điều 14 quy chế chuẩn đầu ra", ok: true },
      { layer: "L3", name: "Phân tích Bằng chứng", verdict: "Mã QR chứng chỉ xác thực trên hệ thống", ok: true },
      { layer: "L4", name: "Thẩm định Chuyên gia", verdict: "Đã có 412 sinh viên nộp thành công", ok: true },
    ],
  },
  {
    id: "nha-tro",
    type: "Đời sống sinh viên",
    title: "Hợp đồng thuê trọ giữ chỗ đặt cọc 3 tháng không hoàn lại",
    sampleTarget: "Mẫu hợp đồng phòng trọ khu KTX B",
    status: "CAUTION",
    statusLabel: "CHƯA ĐỦ CĂN CỨ PHÁP LÝ",
    statusDesc: "Hợp đồng chứa điều khoản bất lợi, không có thông tin căn cước chủ nhà hợp pháp.",
    confidence: "84.0%",
    evidenceAgreement: "2 nguồn cảnh báo, 1 nguồn chưa rõ",
    sourceQuality: "Mẫu hợp đồng dân sự đối chiếu Luật Nhà ở",
    uncertainty: "Chưa xác minh được sổ đỏ hoặc quyền cho thuê của bên trung gian",
    why: "Điều khoản cọc 3 tháng không hoàn lại khi chưa bàn giao nhà vi phạm quyền lợi người thuê.",
    nextAction: "Yêu cầu xem giấy tờ sở hữu nhà chính chủ trước khi đặt bất kỳ khoản tiền nào.",
    evidenceLayers: [
      { layer: "L1", name: "Cú pháp & Định danh", verdict: "Thiếu mã định danh chủ nhà", ok: false },
      { layer: "L2", name: "Đối soát Quy chế", verdict: "Vi phạm điều 121 Luật Nhà ở về bảo lưu cọc", ok: false },
      { layer: "L3", name: "Phân tích Bằng chứng", verdict: "Chưa có phản hồi tiêu cực tại địa chỉ này", ok: true },
      { layer: "L4", name: "Thẩm định Chuyên gia", verdict: "Cần bổ sung phụ lục bàn giao hiện trạng", ok: false },
    ],
  },
];

export default function TrustEngineShowcase() {
  const [selectedCase, setSelectedCase] = useState(SAMPLE_CLAIMS[0]);

  return (
    <section
      id="trust-engine-showcase"
      className="py-24 lg:py-32 border-b border-white/[0.08] bg-[#08110F] relative overflow-hidden"
      aria-labelledby="trust-showcase-title"
    >
      {/* Background Calm Architecture Light */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#7BE0B2]/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Editorial Framing */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest text-[#7BE0B2] bg-[#0F1B18] border border-white/[0.1] uppercase mb-4">
            02 / Khảo Chứng Đa Tầng
          </div>
          <h2
            id="trust-showcase-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F0E6] leading-[1.15]"
          >
            Từ lời nói thành <span className="font-serif italic text-[#7BE0B2]">bằng chứng.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#C3CCC6] leading-relaxed max-w-2xl">
            Không dựa vào % mơ hồ hay lời khẳng định vô căn cứ. Mỗi thông tin được
            chạy qua dải dẫn chứng <span className="font-mono text-[#F4F0E6]">Evidence Beam</span> để bóc tách nguồn, sự đồng thuận và điểm chưa chắc chắn.
          </p>
        </div>

        {/* Case Selector Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8" role="tablist" aria-label="Mẫu tình huống khảo chứng">
          {SAMPLE_CLAIMS.map((item) => {
            const active = item.id === selectedCase.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCase(item)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#0F1B18] text-[#F4F0E6] border border-[#7BE0B2]/40 shadow-sm"
                    : "bg-[#0F1B18] text-[#C3CCC6] hover:text-[#F4F0E6] border border-white/[0.08]"
                } focus:outline-none focus:ring-2 focus:ring-[#7BE0B2]`}
              >
                <span className="font-mono text-xs text-[#7BE0B2] mr-2">[{item.type}]</span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* The Evidence Beam + Double-Bezel Instrument Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: The Continuous Evidence Beam (L1 → L4) */}
          <div className="lg:col-span-5 space-y-3.5 text-left">
            <div className="p-4 rounded-xl bg-[#0B1412] border border-white/[0.07] mb-2">
              <div className="text-xs font-mono text-[#8A9891] uppercase tracking-wider mb-1">
                Đối tượng khảo chứng
              </div>
              <div className="text-base font-semibold text-[#F4F0E6]">
                {selectedCase.title}
              </div>
              <div className="mt-1 text-xs font-mono text-[#7BE0B2] truncate">
                Target: {selectedCase.sampleTarget}
              </div>
            </div>

            {/* Evidence Layers Flow */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.1]">
              {selectedCase.evidenceLayers.map((l, idx) => (
                <div key={idx} className="relative group">
                  {/* Beam indicator dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-[#08110F] transition-all ${
                      l.ok ? "bg-[#7BE0B2]" : "bg-[#FF9C9C]"
                    }`}
                  />
                  <div className="p-3.5 rounded-xl bg-[#0D1614] border border-white/[0.06] hover:border-white/[0.14] transition-colors">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-[#F4F0E6] font-bold">{l.layer} · {l.name}</span>
                      <span className={l.ok ? "text-[#7BE0B2]" : "text-[#FF9C9C]"}>
                        {l.ok ? "ĐẠT CHUẨN" : "CẢNH BÁO"}
                      </span>
                    </div>
                    <p className="text-sm text-[#C3CCC6] leading-relaxed">
                      {l.verdict}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Signature Double-Bezel Verification Instrument */}
          <div className="lg:col-span-7">
            <div className="double-bezel-wrapper text-left">
              <div className="double-bezel-inner space-y-6">
                {/* Header Verdict Banner */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedCase.status === "VERIFIED" && (
                        <CheckCircle2 size={18} className="text-[#7BE0B2]" />
                      )}
                      {selectedCase.status === "CRITICAL" && (
                        <AlertTriangle size={18} className="text-[#FF9C9C]" />
                      )}
                      {selectedCase.status === "CAUTION" && (
                        <HelpCircle size={18} className="text-[#F3C56B]" />
                      )}
                      <span
                        className={`text-xs font-mono font-bold tracking-wider ${
                          selectedCase.status === "VERIFIED"
                            ? "text-[#7BE0B2]"
                            : selectedCase.status === "CRITICAL"
                            ? "text-[#FF9C9C]"
                            : "text-[#F3C56B]"
                        }`}
                      >
                        KẾT LUẬN · {selectedCase.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#F4F0E6]">
                      {selectedCase.statusDesc}
                    </h3>
                  </div>

                  {/* Supporting Confidence (Never dominating reasoning) */}
                  <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-right">
                    <div className="text-[10px] font-mono text-[#8A9891] uppercase">Độ tin cậy</div>
                    <div className="text-sm font-mono font-bold text-[#F4F0E6]">
                      {selectedCase.confidence}
                    </div>
                  </div>
                </div>

                {/* Multi-Dimensional Evidence Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-mono text-[#8A9891] mb-1">SỰ ĐỒNG THUẬN CHỨNG CỨ</div>
                    <div className="text-sm font-medium text-[#F4F0E6]">{selectedCase.evidenceAgreement}</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-mono text-[#8A9891] mb-1">CHẤT LƯỢNG NGUỒN DẪN</div>
                    <div className="text-sm font-medium text-[#F4F0E6]">{selectedCase.sourceQuality}</div>
                  </div>
                </div>

                {/* Reasoning: Tại sao? */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-[#7BE0B2] uppercase tracking-wider font-bold">
                    TẠI SAO? (CƠ SỞ LÝ LUẬN)
                  </div>
                  <p className="text-sm sm:text-base text-[#C3CCC6] leading-relaxed">
                    {selectedCase.why}
                  </p>
                </div>

                {/* What is Uncertain: Điểm chưa chắc chắn */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-[#0F1B18] border border-white/[0.08]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#F3C56B] font-semibold">
                    <Clock size={14} />
                    <span>ĐIỂM CHƯA CHẮC CHẮN / GIỚI HẠN DỮ LIỆU</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#C3CCC6] leading-relaxed">
                    {selectedCase.uncertainty}
                  </p>
                </div>

                {/* Safe Next Action */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-[#8A9891] uppercase">Hành động an toàn khuyến nghị</div>
                    <div className="text-sm font-semibold text-[#F4F0E6] mt-0.5">
                      {selectedCase.nextAction}
                    </div>
                  </div>

                  <Link
                    href="/trust"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7BE0B2] text-[#08110F] text-xs font-mono font-bold hover:bg-[#8EF0C2] transition-colors shrink-0"
                  >
                    <span>Mở Trust Engine</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
