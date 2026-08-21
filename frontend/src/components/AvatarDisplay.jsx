"use client";

// components/AvatarDisplay.jsx
//
// Component hiển thị Avatar cao cấp: hỗ trợ cả Preset Avatar SVG, Custom Upload,
// cùng viền sáng phát quang (glow) và Huy hiệu vai trò (Verified Badge).

import React from "react";
import {
  Code,
  Sparkles,
  BookOpen,
  Palette,
  Star,
  Rocket,
  Award,
  Cpu,
  GraduationCap,
  Shield,
  TrendingUp,
  ShieldAlert,
  User,
  CheckCircle,
} from "lucide-react";
import { getAvatarById } from "@/lib/avatars";

const ICON_MAP = {
  code: Code,
  sparkles: Sparkles,
  book: BookOpen,
  palette: Palette,
  star: Star,
  rocket: Rocket,
  award: Award,
  cpu: Cpu,
  mortarboard: GraduationCap,
  shield: Shield,
  "trending-up": TrendingUp,
  "shield-alert": ShieldAlert,
};

export const AvatarDisplay = ({
  avatarId,
  avatarUrl,
  role = "student",
  size = "md", // sm, md, lg, xl, 2xl
  showBadge = false,
  isInteractive = false,
  className = "",
}) => {
  const avatarData = getAvatarById(avatarId);
  const IconComponent = ICON_MAP[avatarData?.iconType] || User;

  const sizeClasses = {
    xs: "w-8 h-8 text-xs",
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-20 h-20 text-xl",
    xl: "w-28 h-28 text-2xl",
    "2xl": "w-36 h-36 text-3xl",
  };

  const iconSizes = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
    "2xl": "w-18 h-18",
  };

  const isExpert = role === "expert" || avatarData?.role === "expert";

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Outer Glow Ring */}
      <div
        className={`absolute -inset-1 rounded-2xl blur-md opacity-60 transition-all duration-300 ${
          isExpert
            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400"
            : "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
        } ${isInteractive ? "group-hover:opacity-100 group-hover:scale-105" : ""}`}
      />

      {/* Main Avatar Container */}
      <div
        className={`relative ${
          sizeClasses[size] || sizeClasses.md
        } rounded-2xl overflow-hidden flex items-center justify-center border ${
          isExpert ? "border-amber-400/50" : "border-white/20"
        } shadow-lg backdrop-blur-md transition-transform duration-300 ${
          isInteractive ? "hover:scale-105" : ""
        } ${avatarUrl ? "bg-space-900" : `bg-gradient-to-br ${avatarData?.bgGradient || "from-indigo-600 to-purple-600"}`}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={avatarData?.name || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white relative">
            <span className="text-xl mb-0.5 filter drop-shadow select-none">{avatarData?.emoji}</span>
            <IconComponent className={`${iconSizes[size] || iconSizes.md} text-white/90 drop-shadow`} />
          </div>
        )}
      </div>

      {/* Verified Role Badge on Corner */}
      {showBadge && (
        <div
          className={`absolute -bottom-1.5 -right-1.5 p-1 rounded-full border shadow-md flex items-center justify-center ${
            isExpert
              ? "bg-amber-500 border-amber-300 text-black shadow-amber-500/50"
              : "bg-indigo-600 border-indigo-300 text-white shadow-indigo-500/50"
          }`}
          title={isExpert ? "Chuyên gia uy tín" : "Sinh viên xác thực"}
        >
          {isExpert ? (
            <Star className="w-3.5 h-3.5 fill-current text-black" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 fill-current text-white" />
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarDisplay;
