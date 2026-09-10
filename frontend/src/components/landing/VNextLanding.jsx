"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  GitBranch,
  GraduationCap,
  ShieldAlert,
  Users,
} from "lucide-react";
import VNextLandingHero from "@/components/landing/VNextLandingHero";
import VNextLandingChapter from "@/components/landing/VNextLandingChapter";
import VNextButton from "@/components/ui/VNextButton";
import VNextSurface from "@/components/ui/VNextSurface";
import EvidenceStateBadge from "@/components/ui/EvidenceStateBadge";
import VNextMediaFrame from "@/components/media/VNextMediaFrame";
import HobroTelemetryMarquee from "@/components/ui/HobroTelemetryMarquee";

const ANALYSIS_STEPS = [
  ["01", "Mệnh đề", "Điều gì đang được khẳng định hoặc lan truyền?"],
  ["02", "Bối cảnh", "Ai công bố, ở đâu, tại thời điểm nào?"],
  ["03", "Nguồn gốc", "Có thể mở trực tiếp văn bản quy chế gốc không?"],
  ["04", "Điểm chưa rõ", "Điều gì văn bản hiện tại chưa thể khẳng định?"],
  ["05", "Hành động an toàn", "Bạn nên liên hệ ai hoặc làm gì tiếp theo?"],
];

export default function VNextLanding() {
  return (
    <>
      <VNextLandingHero />

      {/* Hobro Digital Inspired Forensic Telemetry Marquee Ticker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 my-6">
        <HobroTelemetryMarquee />
      </div>

      {/* Chapter 02: Trust Workspace Preview */}
      <VNextLandingChapter
        id="trust-chapter"
        number="02"
        eyebrow="Trust Workspace"
        title={
          <>
            Kết luận phải đi cùng{" "}
            <span className="font-serif italic font-normal text-cyan-300">
              lý do và bằng chứng.
            </span>
          </>
        }
        body="Trust biến một thông tin nghi vấn thành một tiến trình đối soát minh bạch: kết luận định tính, trích dẫn văn bản, đối chiếu thời hạn, và nhận diện những điểm còn chưa thể khẳng định."
        tone="instrument"
      >
        <VNextSurface tone="instrument" className="vnext-trust-preview swiss-crosshair-card hover-perspective-sheen relative">
          <div className="vnext-preview-header">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="type-technical-v3 text-cyan-400">TRUST WORKSPACE // PREVIEW</span>
                <span className="text-[10px] tracking-widest text-slate-400 font-mono">[ FORENSIC-V3 ]</span>
              </div>
              <h3 className="type-product-heading text-lg text-slate-100 mt-1 font-serif">
                Không có phán quyết nào được tạo từ <span className="italic font-normal text-cyan-200">phỏng đoán</span>.
              </h3>
            </div>
            <EvidenceStateBadge state="unknown" label="Chưa đủ dữ liệu" />
          </div>
          <div className="vnext-trust-hierarchy">
            {[
              ["KẾT LUẬN", "Định tính rõ ràng, hiển thị sau khi luồng phân tích hoàn tất"],
              ["VÌ SAO", "Tách bạch lý do logic khỏi chỉ số chắc chắn"],
              ["BẰNG CHỨNG", "Mở trực tiếp liên kết nguồn gốc với mã băm SHA-256"],
              ["MÂU THUẪN", "Chỉ rõ điểm bất thường (như chênh lệch ngày hết hạn)"],
            ].map(([label, copy]) => (
              <div className="vnext-trust-row" key={label}>
                <span className="type-technical-v3 font-semibold text-cyan-300">{label}</span>
                <span className="text-slate-300">{copy}</span>
              </div>
            ))}
          </div>
          <Link href="/trust" className="vnext-inline-action inline-flex items-center gap-2 text-cyan-300 font-semibold text-sm hover:text-cyan-200">
            Mở Trust workspace <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </VNextSurface>
      </VNextLandingChapter>

      {/* Chapter 03: Evidence Relationships & Active Media */}
      <VNextLandingChapter
        id="evidence-chapter"
        number="03"
        eyebrow="Evidence Relational Matrix"
        title={
          <>
            Bằng chứng có quan hệ đa chiều,{" "}
            <span className="font-serif italic font-normal text-cyan-300">
              không chỉ là danh sách.
            </span>
          </>
        }
        body="Một nguồn có thể hỗ trợ, mâu thuẫn hoặc để lại khoảng chưa rõ. Sơ đồ liên kết cho thấy cấu trúc mạng lưới, danh sách ngữ nghĩa hỗ trợ đọc sâu, và thanh kiểm tra nguồn cung cấp trích dẫn nguyên văn."
      >
        <div className="vnext-evidence-layout">
          <VNextSurface tone="paper" className="vnext-evidence-graph swiss-crosshair-card" aria-label="Minh họa quan hệ bằng chứng">
            <div className="vnext-graph-line vnext-graph-line-one" />
            <div className="vnext-graph-line vnext-graph-line-two" />
            <div className="vnext-graph-node vnext-graph-node-main"><FileSearch size={18} /><span>Mệnh đề</span></div>
            <div className="vnext-graph-node vnext-graph-node-support"><CheckCircle2 size={17} /><span>Hỗ trợ</span></div>
            <div className="vnext-graph-node vnext-graph-node-conflict"><ShieldAlert size={17} /><span>Mâu thuẫn</span></div>
            <div className="vnext-graph-node vnext-graph-node-unknown"><CircleHelp size={17} /><span>Chưa rõ</span></div>
            <p className="vnext-graph-note type-technical-v3 text-slate-400">MINH HỌA QUAN HỆ · KHÔNG PHẢI BẢN GHI THẬT</p>
          </VNextSurface>
          <VNextSurface tone="archive" className="vnext-evidence-list swiss-crosshair-card">
            <div className="vnext-preview-header">
              <span className="type-technical-v3 text-cyan-400">SEMANTIC LIST</span>
              <GitBranch size={18} aria-hidden="true" className="text-cyan-400" />
            </div>
            <div className="vnext-evidence-item"><EvidenceStateBadge state="support" /><span>Nguồn văn bản có thể mở lại trực tiếp</span></div>
            <div className="vnext-evidence-item"><EvidenceStateBadge state="conflict" /><span>Phát hiện điểm sai lệch về thời hạn nộp</span></div>
            <div className="vnext-evidence-item"><EvidenceStateBadge state="unknown" /><span>Chưa có dữ liệu từ khoa trực thuộc</span></div>
          </VNextSurface>
        </div>

        {/* Active Editorial Media Collision: VID-HUMAN-01 */}
        <div className="mt-8">
          <VNextMediaFrame
            assetId="VID-HUMAN-01"
            alt="Bối cảnh học thuật thực địa trong không gian nghiên cứu"
            label="BỐI CẢNH HỌC THUẬT THỰC ĐỊA · VID-HUMAN-01"
            detail="POSTER FIRST // RESEARCH ARCHIVE"
            className="max-w-3xl mx-auto"
          />
        </div>
      </VNextLandingChapter>

      {/* Chapter 04: AI Verification Architecture */}
      <VNextLandingChapter
        id="ai-chapter"
        number="04"
        eyebrow="Explainable AI Core"
        title={
          <>
            AI phải giải thích nguyên nhân,{" "}
            <span className="font-serif italic font-normal text-cyan-300">
              không chỉ đưa ra con số.
            </span>
          </>
        }
        body="StudentHub kiên quyết không dùng một con số 98% tùy tiện để thay thế cho việc đối soát nguồn. Từng bước nói rõ tài liệu đã có, dữ liệu còn thiếu và ranh giới thẩm quyền của lần kiểm tra."
        tone="instrument"
      >
        <VNextSurface tone="instrument" className="vnext-ai-flow swiss-crosshair-card">
          {ANALYSIS_STEPS.map(([number, label, copy]) => (
            <div className="vnext-ai-step" key={number}>
              <span className="vnext-ai-step-number type-technical-v3 font-bold text-cyan-400">{number}</span>
              <div><strong className="text-slate-100">{label}</strong><span className="text-slate-300">{copy}</span></div>
              {number !== "05" && <ArrowRight className="vnext-ai-step-arrow text-slate-500" size={16} aria-hidden="true" />}
            </div>
          ))}
          <div className="vnext-ai-disclaimer text-xs text-amber-300/90 flex items-center gap-2 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <CircleHelp size={17} aria-hidden="true" />
            <span>Khi chưa đủ bằng chứng pháp lý, hệ thống luôn minh bạch công bố: <strong>CHƯA ĐỦ BẰNG CHỨNG.</strong></span>
          </div>
        </VNextSurface>
      </VNextLandingChapter>

      {/* Chapter 05: Community + Expert Council */}
      <VNextLandingChapter
        id="community-expert-chapter"
        number="05"
        eyebrow="Collective Verification"
        title={
          <>
            Nhiều góc nhìn hơn,{" "}
            <span className="font-serif italic font-normal text-cyan-300">
              ranh giới rõ ràng hơn.
            </span>
          </>
        }
        body="Cộng đồng sinh viên bổ sung kinh nghiệm thực tế. Hội đồng chuyên gia đánh giá trong phạm vi pháp lý được phân quyền. Cả hai kênh mở rộng không tự ý làm sai lệch dữ liệu gốc."
      >
        <div className="vnext-council-layout">
          <VNextSurface tone="paper" className="vnext-council-card swiss-crosshair-card">
            <Users size={24} aria-hidden="true" className="text-cyan-400" />
            <span className="type-technical-v3 text-cyan-400">COMMUNITY SIGNAL</span>
            <h3 className="type-product-heading text-lg text-slate-100 font-serif">Trải nghiệm & Đối chiếu thực địa</h3>
            <p className="text-slate-300">Chia sẻ từ sinh viên khóa trước giúp làm rõ quy trình nộp đơn thực tế và các tình huống đặc cách.</p>
            <EvidenceStateBadge state="info" label="Bổ sung ngữ cảnh" />
            <Link href="/community" className="vnext-inline-action inline-flex items-center gap-1.5 text-cyan-300 font-semibold text-sm">
              Đến Cộng đồng <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </VNextSurface>
          <div className="vnext-council-bridge text-slate-500" aria-hidden="true"><GitBranch size={22} /></div>
          <VNextSurface tone="instrument" className="vnext-council-card swiss-crosshair-card">
            <GraduationCap size={24} aria-hidden="true" className="text-cyan-400" />
            <span className="type-technical-v3 text-cyan-400">EXPERT SCOPE</span>
            <h3 className="type-product-heading text-lg text-slate-100 font-serif">Thẩm định giá trị quy chế</h3>
            <p className="text-slate-300">Chuyên gia giáo dục đánh giá dựa trên Nghị định và Công văn hướng dẫn chính thức.</p>
            <EvidenceStateBadge state="caution" label="Xác nhận độc lập" />
            <Link href="/expert" className="vnext-inline-action inline-flex items-center gap-1.5 text-purple-300 font-semibold text-sm">
              Đến Chuyên gia <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </VNextSurface>
        </div>
      </VNextLandingChapter>

      {/* Chapter 06: Safe Action Final Callout */}
      <VNextLandingChapter
        id="safe-action-chapter"
        number="06"
        eyebrow="Forensic Action"
        title={
          <>
            Kiểm chứng trước.{" "}
            <span className="font-serif italic font-normal text-cyan-300">
              Quyết định sau.
            </span>
          </>
        }
        body="Bắt đầu từ một URL, đoạn văn bản thông báo hoặc ảnh chụp circular. Khi dữ liệu chưa đủ, hãy dừng lại, mở nguồn gốc và hành động thận trọng hơn."
        tone="archive"
      >
        <VNextSurface tone="archive" className="vnext-safe-action swiss-crosshair-card">
          <BookOpenCheck size={30} aria-hidden="true" className="text-cyan-400" />
          <div>
            <h3 className="type-product-heading text-lg text-slate-100">Đọc nguồn. Hiểu phạm vi. Chọn hành động.</h3>
            <p className="text-slate-300">Poster, animation và AI chỉ là công cụ hỗ trợ. Mọi quyết định học tập của bạn cần dựa trên văn bản có thẩm quyền.</p>
          </div>
          <VNextButton href="/trust" size="lg">
            Bắt đầu kiểm chứng <ArrowRight size={17} aria-hidden="true" />
          </VNextButton>
        </VNextSurface>
      </VNextLandingChapter>
    </>
  );
}
