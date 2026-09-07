"use client";

import React from "react";
import Image from "next/image";
import { UserCheck, Award, GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";

export default function ExpertCollective({ onOpenAdvisory }) {
  const experts = [
    {
      name: "GS. TS. Vũ Hoàng Nam",
      role: "Trưởng Cố Vấn Trí Tuệ Nhân Tạo",
      affiliation: "Khoa CNTT · HCMUTE",
      scope: "Deep Learning, LLM Verification, Epistemic Graphs",
      orcid: "ORCID: 0009-0004-8921-2311",
      status: "VERIFIED MENTOR",
      studentsCount: "120+ Thạc sĩ & Khóa luận xuất sắc",
    },
    {
      name: "PGS. TS. Lê Thu Hà",
      role: "Chuyên Gia Kỹ Thuật Dữ Liệu & Cloud",
      affiliation: "Viện Nghiên cứu Đổi mới Sáng tạo",
      scope: "Distributed Systems, MLOps, System Resilience",
      orcid: "ORCID: 0008-0002-1402-9981",
      status: "VERIFIED MENTOR",
      studentsCount: "95+ Sinh viên đạt học bổng quốc tế",
    },
    {
      name: "TS. Nguyễn Minh Triết",
      role: "Cố Vấn Điều Khiển & Hệ Thống Nhúng",
      affiliation: "Khoa Cơ khí Động lực & Robot",
      scope: "Autonomous Drones, SLAM, Industrial Automation",
      orcid: "ORCID: 0009-0001-7762-4310",
      status: "VERIFIED MENTOR",
      studentsCount: "14 Giải Nhất Sáng tạo Robot Toàn quốc",
    },
  ];

  return (
    <section className="relative py-24 border-t border-white/10 bg-[#060813]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-xs font-semibold text-teal-300">
              <GraduationCap className="h-3 w-3" />
              <span>HỘI ĐỒNG CHUYÊN GIA &amp; CỐ VẤN HỌC THUẬT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Đội Ngũ Giáo Sư &amp; <br />
              <span className="font-serif italic font-normal text-teal-300">
                Chuyên Gia Xác Thực Đúng Phạm Vi
              </span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-400 font-mono">
            Không xếp hạng dựa trên danh tiếng ảo — 100% chuyên gia được thẩm định chặt chẽ theo từng lĩnh vực đào tạo.
          </p>
        </div>

        {/* Feature Banner with Generated Mentorship Image */}
        <div className="mb-12 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-teal-950/40 via-[#0b112c]/80 to-black p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black relative">
              <Image
                src="/images/academic/academic_expert_mentorship.jpg"
                alt="Buổi thảo luận học thuật giữa giáo sư và nghiên cứu sinh"
                width={600}
                height={450}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 border border-teal-400/30 px-3 py-1 text-[11px] font-mono font-bold text-teal-300 uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>EXPERTISE ≠ AUTHORITY · ĐÚNG PHẠM VI CHUYÊN MÔN</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Cơ Chế Khớp Nối Cố Vấn 1-on-1 Thông Minh
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Khi sinh viên gặp bế tắc trong đề tài Khóa luận hoặc hướng nghiên cứu khoa học, StudentHub AI sẽ phân tích đồ thị tri thức để kết nối đúng giảng viên hướng dẫn có chuyên môn khớp nối cao nhất, trích xuất chính xác công trình nghiên cứu đã được công bố.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenAdvisory}
                  className="flex items-center gap-2 rounded-full bg-teal-400 px-6 py-3 font-mono text-xs font-black text-black hover:bg-teal-300 transition-all shadow-lg"
                >
                  <span>Đặt Lịch Tư Vấn Cùng Mentor</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Experts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {experts.map((exp, idx) => (
            <div
              key={idx}
              className="interactive-card flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-xl transition-all hover:border-teal-400/40"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 border border-teal-400/30 text-teal-300">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-gray-300">
                    {exp.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-white">{exp.name}</h4>
                  <p className="font-mono text-xs font-semibold text-teal-400 mt-0.5">{exp.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{exp.affiliation}</p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-1.5 font-mono text-[11px]">
                  <p className="text-gray-500">Phạm vi chuyên môn:</p>
                  <p className="text-gray-300 font-medium">{exp.scope}</p>
                  <p className="text-teal-400 text-[10px] pt-1">{exp.orcid}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{exp.studentsCount}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
