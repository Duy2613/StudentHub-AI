"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ShieldAlert, ShieldCheck, Star, Sparkles, ArrowRight, UserCheck } from "lucide-react";
import Interactive3DBlockCard from "@/components/ui/Interactive3DBlockCard";

const DILEMMAS = [
  {
    id: 1,
    studentName: "Hoàng Long",
    university: "ĐH Bách Khoa Hà Nội",
    avatar: "HL",
    avatarBg: "bg-teal-500",
    question: "Chủ trọ ngõ 27 Tạ Quang Bửu bắt cọc 2 triệu qua Zalo để giữ chỗ phòng, có đáng tin không?",
    status: "warning",
    statusText: "Nghi vấn lừa đảo (88%)",
    expertAnswer: "Luật sư Thu Hà: Tuyệt đối không cọc khi chưa xem thực tế và ký biên nhận chính chủ.",
    category: "Thuê Trọ",
  },
  {
    id: 2,
    studentName: "Thu Trang",
    university: "ĐH Kinh Tế Quốc Dân (NEU)",
    avatar: "TT",
    avatarBg: "bg-indigo-500",
    question: "Tuyển CTV làm nhiệm vụ Shopee nạp cọc 200k nhận hoa hồng 20% sau 5 phút là thật hay bẫy?",
    status: "danger",
    statusText: "Bẫy tài chính Ponzi (94%)",
    expertAnswer: "Chuyên gia Minh Đức: 100% bẫy lừa tiền cọc đánh vào tâm lý cần việc nhẹ lương cao.",
    category: "Việc Làm",
  },
  {
    id: 3,
    studentName: "Minh Quân",
    university: "ĐHQG TP.HCM",
    avatar: "MQ",
    avatarBg: "bg-purple-500",
    question: "Nhận được email thông báo học bổng trao đổi Nhật Bản từ đuôi @gmail.com yêu cầu nộp 500k phí hồ sơ?",
    status: "danger",
    statusText: "Giả mạo học bổng (92%)",
    expertAnswer: "Cố vấn Tuấn Anh: Mọi học bổng chính thống chỉ gửi từ email .edu.vn của nhà trường.",
    category: "Học Bổng",
  },
  {
    id: 4,
    studentName: "Khánh Linh",
    university: "ĐH Ngoại Thương (FTU)",
    avatar: "KL",
    avatarBg: "bg-amber-500",
    question: "Có người gọi tự xưng công an bảo CCCD bị dính vào đường dây rửa tiền và yêu cầu chuyển tiền xác minh?",
    status: "danger",
    statusText: "Deepfake & Mạo danh (99%)",
    expertAnswer: "An ninh mạng VNCERT: Cơ quan chức năng không bao giờ làm việc và yêu cầu chuyển tiền qua điện thoại.",
    category: "Mạo Danh",
  },
];

export default function StudentDilemmaChatCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DILEMMAS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeDilemma = DILEMMAS[activeIndex];

  return (
    <div className="w-full max-w-5xl mx-auto my-12">
      <Interactive3DBlockCard
        glowColor="rgba(99, 102, 241, 0.35)"
        maxTilt={10}
        depth={30}
      >
        <div className="p-6 sm:p-8 rounded-3xl bg-space-900/90 border border-white/12 backdrop-blur-3xl shadow-[0_12px_45px_rgba(0,0,0,0.65)] space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Tình Huống Nghi Vấn Thực Tế Từ Sinh Viên</span>
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-gray-400">
                  Phản hồi và đối soát tức thì bởi AI Engine &amp; Mạng lưới Cố vấn
                </p>
              </div>
            </div>

            {/* Quick Indicators */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {DILEMMAS.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`transition-all rounded-full ${
                    activeIndex === idx
                      ? "w-6 h-2 bg-teal-400 shadow-[0_0_10px_#34e7c4]"
                      : "w-2 h-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Chat Dialogue Bubble */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Student Question Card */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${activeDilemma.avatarBg} text-space-950 font-black text-xs flex items-center justify-center shadow-md`}>
                    {activeDilemma.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{activeDilemma.studentName}</p>
                    <p className="text-[10px] text-gray-400">{activeDilemma.university}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono">
                  {activeDilemma.category}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed italic">
                "{activeDilemma.question}"
              </p>
            </div>

            {/* Verified AI & Expert Feedback Card */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-space-950/90 border border-teal-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  {activeDilemma.statusText}
                </span>

                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Thẩm định 2 chiều
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-normal">
                {activeDilemma.expertAnswer}
              </p>
            </div>

          </div>

        </div>
      </Interactive3DBlockCard>
    </div>
  );
}
