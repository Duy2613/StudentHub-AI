"use client";

// frontend/src/components/auth/SaffronPasswordEntropy.jsx
//
// Real-time Cryptographic Password Entropy & Cipher Strength Meter
// - Đánh giá độ bảo mật mật khẩu chuẩn mã hóa quân sự / fintech
// - Hiển thị tỷ lệ Entropy (Bits), phân đoạn thanh trạng thái phát sáng Saffron/Emerald

import React from "react";
import { KeyRound } from "lucide-react";

export default function SaffronPasswordEntropy({ password = "" }) {
  if (!password) return null;

  // Tính toán entropy cơ bản
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropy = password.length > 0 ? Math.round(password.length * Math.log2(Math.max(2, poolSize))) : 0;

  let level = "Cần tăng cường";
  let color = "text-red-400";
  let barColor = "bg-red-500";
  let score = 1;

  if (password.length >= 6 && entropy >= 30) {
    level = "Độ an toàn trung bình";
    color = "text-amber-400";
    barColor = "bg-amber-500";
    score = 2;
  }
  if (password.length >= 8 && entropy >= 50) {
    level = "Mật khẩu an toàn";
    color = "text-[#ffbc09]";
    barColor = "bg-[#ffbc09]";
    score = 3;
  }
  if (password.length >= 10 && entropy >= 65) {
    level = "Bảo mật cấp cao (Tối ưu)";
    color = "text-emerald-400";
    barColor = "bg-emerald-400";
    score = 4;
  }

  return (
    <div className="space-y-1.5 pt-1.5 text-xs font-human select-none">
      <div className="flex items-center justify-between text-[#ece7e0]/80">
        <span className="flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#ffbc09]" />
          <span className="text-[11px] text-gray-300">Độ phức tạp mã hóa:</span>
          <span className="text-[11px] font-mono font-bold text-[#ffd15c]">{entropy} BITS</span>
        </span>
        <span className={`text-[11px] font-semibold tracking-tight ${color}`}>{level}</span>
      </div>

      {/* 4-Segmented Glow Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`rounded-full transition-all duration-300 ${
              seg <= score
                ? `${barColor} shadow-[0_0_8px_currentColor]`
                : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
