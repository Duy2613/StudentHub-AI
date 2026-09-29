"use client";

import React from "react";
import { FileCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import HobroTiltCard from "@/components/cinematic/HobroTiltCard";

const MANIFESTO_TENETS = [
  {
    num: "01",
    title: "NGUỒN PHẢI HIỂN THỊ ĐƯỢC",
    subtitle: "Chỉ dẫn nguồn xuất hiện trong phản hồi thực tế. Không biến nội dung chưa có căn cứ thành sự thật.",
    quote: "Có thể kiểm tra nguồn thì mới có thể xem xét nguồn.",
  },
  {
    num: "02",
    title: "GIỚI HẠN PHẢI ĐƯỢC GIỮ LẠI",
    subtitle: "Thiếu dữ liệu, trích dẫn hoặc bối cảnh thì phần chưa rõ cần tiếp tục được thể hiện.",
    quote: "Không chắc chắn cũng là thông tin quan trọng.",
  },
  {
    num: "03",
    title: "QUYỀN HẠN PHẢI CÓ PHẠM VI",
    subtitle: "Kết quả của Trust, thảo luận Community và nhiệm vụ Expert có vai trò riêng.",
    quote: "Một vai trò không tự tạo ra thẩm quyền cho hồ sơ khác.",
  },
];

const REVIEW_NOTES = [
  {
    title: "Nội dung đầu vào",
    description: "Xem lại nội dung và bối cảnh mà người dùng gửi.",
  },
  {
    title: "Dữ liệu được trả về",
    description: "Đọc mệnh đề, nguồn và kết quả khi chúng có trong phản hồi.",
  },
  {
    title: "Phần còn chưa rõ",
    description: "Giữ nguyên các thiếu sót và giới hạn trước khi quyết định hành động.",
  },
];

export default function WhyZeroManifestoSection() {
  return (
    <section className="relative w-full py-32 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-semibold">
              NGUYÊN TẮC MINH BẠCH
            </span>
            <span className="w-12 h-px bg-emerald-400/40" />
            <span className="text-xs font-mono text-slate-500 uppercase">EVIDENCE FIRST</span>
          </div>

          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black text-white font-sans uppercase tracking-tighter leading-[0.92]">
            ĐỌC KỸ{" "}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
              TRƯỚC KHI TIN.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {MANIFESTO_TENETS.map((tenet) => (
            <HobroTiltCard
              key={tenet.num}
              maxTilt={6}
              className="p-8 flex flex-col justify-between min-h-[300px]"
              cursorText="NGUYÊN TẮC"
            >
              <div>
                <span className="text-4xl font-mono font-black text-emerald-400/40 block mb-6">
                  {tenet.num}
                </span>
                <h3 className="text-xl font-black text-white font-sans tracking-tight uppercase mb-3">
                  {tenet.title}
                </h3>
                <p className="text-sm text-slate-300 font-serif leading-relaxed mb-6">
                  {tenet.subtitle}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <blockquote className="text-xs font-serif italic text-emerald-300/80">
                  “{tenet.quote}”
                </blockquote>
              </div>
            </HobroTiltCard>
          ))}
        </div>

        <div className="relative rounded-3xl border border-white/15 bg-space-900/90 backdrop-blur-xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono tracking-widest text-cyan-300 uppercase font-semibold">
                CÁCH ĐỌC MỘT KẾT QUẢ
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-4">
                Căn cứ trước, hành động sau.
              </h3>
              <p className="text-sm text-slate-300 font-serif leading-relaxed">
                Màn hình giới thiệu không phải hồ sơ hay kết luận thực tế. Hãy mở Trust để xem phản hồi gắn với nội dung bạn gửi.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REVIEW_NOTES.map((note, index) => (
                <div key={note.title} className="p-4 rounded-2xl bg-space-950/70 border border-white/10 min-h-36">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-3">
                    BƯỚC 0{index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white mb-2">{note.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{note.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-white/10">
            <Link
              href="/trust"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all"
            >
              <FileCheck size={16} />
              <span>MỞ TRUST</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
