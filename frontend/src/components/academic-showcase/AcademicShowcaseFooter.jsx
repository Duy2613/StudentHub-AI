"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AcademicShowcaseFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#04060f] py-16 text-xs font-mono text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Branding & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <span className="font-bold text-sm tracking-wider">STUDENTHUB AI</span>
              <span className="text-gray-600">·</span>
              <span className="text-teal-400">V9.0.0 REALITY-FIRST</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md font-sans">
              Hệ điều hành học tập thông minh bảo vệ sinh viên trước thông tin sai lệch, đồng hành cá nhân hóa trên từng tín chỉ, và chứng thực năng lực thực chiến qua Living Evidence Passport.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="rounded bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-teal-300">
                100% NO DEMO FICTION
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-indigo-300">
                ZERO FABRICATION
              </span>
            </div>
          </div>

          {/* Quick Academic Navigation */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
              TRỤ CỘT TRÍ TUỆ
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/trust" className="hover:text-teal-300 transition-colors">
                  AI Trust Engine V2
                </Link>
              </li>
              <li>
                <Link href="/academic" className="hover:text-teal-300 transition-colors">
                  Academic Command Center
                </Link>
              </li>
              <li>
                <Link href="/cases" className="hover:text-teal-300 transition-colors">
                  Evidence Case Lab
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-teal-300 transition-colors">
                  Student Collective Intel
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">
              CHUẨN MỰC HỌC THUẬT
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-gray-300">QĐ 3116/QĐ-ĐHSPKT (2025)</span>
              </li>
              <li>
                <span className="text-gray-300">ABET Engineering Criteria</span>
              </li>
              <li>
                <span className="text-gray-300">OWASP GenAI Security 2025</span>
              </li>
              <li>
                <span className="text-gray-300">SHA-256 Provenance Proof</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Baseline Statement */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © 2026 StudentHub AI. Bản quyền thuộc về Đội ngũ Kỹ thuật Hệ thống Trí tuệ Học thuật.
          </div>
          <div className="flex items-center gap-4">
            <span>HCMUTE CAMPUS ALLIANCE</span>
            <span>·</span>
            <span className="text-teal-400">LOCKED BASELINE RELEASE</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
