"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body className="bg-[#040508] text-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 rounded-3xl bg-[#090b14] border border-white/10 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-6">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Đã xảy ra sự cố hệ thống</h2>
          <p className="text-xs text-gray-400 mb-6">
            Vui lòng nhấn &apos;Tải lại&apos; hoặc truy cập lại trang chủ.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Tải lại
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Trang Chủ
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
