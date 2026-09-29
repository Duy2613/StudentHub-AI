"use client";

// components/auth/AuthUI.jsx
//
// Shared UI components for /login and /register (Vibrant Cosmic Purple/Magenta Constellation & 3D Geometric Neural Mesh).
// Awwwards-tier Double-Bezel architecture with hardware-accelerated 60fps ambient glow,
// GeometricConstellationCanvas, Robin Payot Fluid waves, and Astrolabe Rings.

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Loader2, ArrowRight, AlertCircle, GraduationCap, CheckCircle2 } from "lucide-react";
import AuthSurroundings from "@/components/auth/AuthSurroundings";
import { Meteors } from "@/components/ui/meteors";
import GeometricConstellationCanvas from "@/components/canvas/GeometricConstellationCanvas";
import SparklingStardustCanvas from "@/components/ui/SparklingStardustCanvas";
import PageTransitionWrapper from "@/components/ui/page-transition-wrapper";
import { BorderBeam } from "@/components/ui/border-beam";
import { Input } from "@/components/ui/input";

export const NoiseOverlay = () => (
  <div
    className="fixed inset-0 z-[2] opacity-[0.03] mix-blend-overlay pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);

export const AmbientBackground = ({ mode = "cosmic-wave" }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 w-full h-full bg-[#05070e]">
      {/* 4K Auth Monolith Background Video Loop (Hobro/Overworld Cinematic Style) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/media/v3/auth/login-poster.webp"
        src="/media/v3/auth/login-loop.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-40 filter contrast-125 saturate-120 scale-105 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-[#05070e]/80 to-[#05070e]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#05070e_90%)]" />

      {/* 1. Subtle mineral-mint architectural lighting */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] rounded-full bg-gradient-to-b from-[#79d8bd]/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-[#6ea8fe]/08 via-transparent to-transparent blur-[140px] pointer-events-none" />
      {/* 2. Architectural hairline coordinate grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(241, 238, 230, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(241, 238, 230, 0.4) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem"
        }}
      />
    </div>
  );
};

export const InputField = ({ label, id, name, type = "text", icon: Icon, helperText, onFocus, onBlur, className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2 relative group/input">
      <label htmlFor={id} className="ui-label block pl-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-mint-400" : "text-text-tertiary"}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <Input
          id={id}
          name={name || id}
          type={type}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          className={`${Icon ? "ui-input-icon-leading" : ""} ${className}`.trim()}
          {...props}
        />
      </div>
      {helperText && <p className="ui-helper pl-1">{helperText}</p>}
    </div>
  );
};

export const PasswordInput = ({ id, name, label, onFocus, onBlur, className = "", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2 relative group/input">
      <label htmlFor={id} className="ui-label block pl-1">
        {label}
      </label>
      <div className="relative z-10">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-mint-400" : "text-text-tertiary"}`}>
          <Lock className="h-5 w-5" />
        </div>
        <Input
          id={id}
          name={name || id}
          type={showPassword ? "text" : "password"}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          className={`ui-input-icon-leading ui-input-icon-trailing ${className}`.trim()}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={showPassword}
          className="ui-button ui-button-quiet ui-button-icon absolute right-0 top-1/2 -translate-y-1/2"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export const CheckboxField = ({ id, checked, onChange, label, helperText, ...props }) => (
  <div className="flex items-center justify-between type-caption py-1 select-none">
    <label htmlFor={id} className="flex min-h-11 items-center gap-2.5 cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="ui-checkbox"
        {...props}
      />
      <span className="type-ui text-text-secondary">{label}</span>
    </label>
    {helperText && (
      <span className="ui-helper">{helperText}</span>
    )}
  </div>
);

export const Button = ({ children, isLoading, disabled, className = "", ...props }) => (
  <div className="relative z-20">
    <button
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      className={`ui-button ui-button-primary ui-button-lg w-full ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {children} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </>
      )}
    </button>
  </div>
);

export const GoogleButton = ({ isLoading, isDisabled, onClick, capability }) => {
  const isGoogleDisabled = Boolean(capability && capability.google !== "READY");
  const effectivelyDisabled = isLoading || isDisabled || isGoogleDisabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={effectivelyDisabled}
      title={isGoogleDisabled ? capability?.googleMessage || "Google OAuth chưa được kích hoạt trên hệ thống máy chủ" : "Đăng nhập bằng tài khoản Google"}
      aria-busy={isLoading || undefined}
      className="ui-button ui-button-secondary ui-button-md relative w-full flex-col sm:flex-row text-xs font-medium"
    >
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <path d="M 22.56 12.25 C 22.56 11.47 22.49 10.72 22.36 10 L 12 10 L 12 14.26 L 17.92 14.26 C 17.66 15.63 16.88 16.79 15.71 17.57 L 15.71 20.34 L 19.28 20.34 C 21.36 18.42 22.56 15.6 22.56 12.25 Z" fill="#4285F4" />
            <path d="M 12 23 C 14.97 23 17.46 22.02 19.28 20.34 L 15.71 17.57 C 14.73 18.23 13.48 18.63 12 18.63 C 9.14 18.63 6.71 16.7 5.84 14.1 L 2.18 14.1 L 2.18 16.94 C 3.99 20.53 7.7 23 12 23 Z" fill="#34A853" />
            <path d="M 5.84 14.1 C 5.62 13.44 5.49 12.74 5.49 12 C 5.49 11.26 5.62 10.56 5.84 9.9 L 5.84 7.07 L 2.18 7.07 C 1.43 8.55 1 10.22 1 12 C 1 13.78 1.43 15.45 2.18 16.94 L 5.84 14.1 Z" fill="#FBBC05" />
            <path d="M 12 5.38 C 13.62 5.38 15.06 5.94 16.21 7.02 L 19.36 3.87 C 17.45 2.09 14.97 1 12 1 C 7.7 1 3.99 3.47 2.18 7.07 L 5.84 9.9 C 6.71 7.3 9.14 5.38 12 5.38 Z" fill="#EA4335" />
          </svg>
        )}
        <span className="truncate">Google</span>
      </div>
      {isGoogleDisabled && (
        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 sm:ml-2 mt-1 sm:mt-0">
          Chưa kích hoạt
        </span>
      )}
    </button>
  );
};

export const GithubIcon = ({ className = "w-5 h-5" }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24" width="24" height="24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const GithubButton = ({ isLoading, isDisabled, onClick, capability }) => {
  const isGithubDisabled = Boolean(capability && capability.github !== "READY");
  const effectivelyDisabled = isLoading || isDisabled || isGithubDisabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={effectivelyDisabled}
      title={isGithubDisabled ? capability?.githubMessage || "GitHub OAuth chưa được kích hoạt trên hệ thống máy chủ" : "Đăng nhập bằng tài khoản GitHub"}
      aria-busy={isLoading || undefined}
      className="ui-button ui-button-secondary ui-button-md relative w-full flex-col sm:flex-row text-sm font-medium"
    >
      <span className="flex items-center">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        ) : (
          <GithubIcon className="h-5 w-5 mr-2 text-gray-200" />
        )}
        <span>Continue with GitHub</span>
      </span>
      {isGithubDisabled && (
        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 sm:ml-2 mt-1 sm:mt-0">
          Chưa kích hoạt
        </span>
      )}
    </button>
  );
};

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div role="alert" aria-live="assertive" className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-red-200">{message}</p>
        <Link href="/" className="mt-2 inline-block text-xs font-semibold text-teal-300 hover:text-teal-200 underline underline-offset-2">
          Trang chủ
        </Link>
      </div>
    </div>
  );
};

export const NoticeMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-sm text-emerald-200">{message}</p>
    </div>
  );
};

// Regex nhận diện email học thuật (.edu, .edu.vn, .ac.uk, v.v.)
export const ACADEMIC_EMAIL_REGEX = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i;
export const StudentBenefitBanner = ({ email }) => {
  const hasInstitutionalEmailShape = ACADEMIC_EMAIL_REGEX.test((email || "").trim().toLowerCase());
  return (
    <div
      className="mb-8 relative overflow-hidden rounded-2xl border bg-space-950/60 border-white/10"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 blur-md opacity-50" />
      <div className="relative z-10 flex items-start p-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-white/15 text-gray-300">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="ml-4 transition-all duration-500">
          <h3 className="text-sm font-semibold text-gray-200">Xác minh email tổ chức</h3>
          <p className="mt-1 text-xs text-gray-300">
            {hasInstitutionalEmailShape
              ? "Định dạng email gợi ý một tổ chức; hộp thư và tư cách chưa được xác nhận."
              : "Nếu có email do trường cấp, hãy dùng địa chỉ đó để xác minh hộp thư."}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * AuthCard: Double-bezel concentric enclosure with calm polar BorderBeam and Obsidian Glacial backdrop.
 */
export const AuthCard = ({ children, mode = "cosmic-wave" }) => (
  <PageTransitionWrapper>
    <div className="min-h-screen relative overflow-hidden font-sans bg-[#05070e] select-none">
      <AmbientBackground mode={mode} />
      <NoiseOverlay />
      <AuthSurroundings>
        <div className="max-w-[460px] w-full perspective-1000 animate-card-in">
          {/* Outer Shell: Machine-tooled bezel with BorderBeam laser effect & glowing shadow */}
          <div className="relative p-1.5 rounded-[32px] bg-white/[0.05] border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-3xl transition-all duration-500 hover:border-teal-400/30 hover:shadow-[0_0_35px_rgba(52,231,196,0.12)] overflow-hidden">
            <BorderBeam size={260} duration={8} colorFrom="#38bdf8" colorTo="#34e7c4" />
            
            {/* Inner Core: Deep Space Obsidian Cyber Canvas */}
            <div className="relative rounded-[calc(32px-0.375rem)] bg-space-950/95 backdrop-blur-3xl py-8 px-6 sm:py-10 sm:px-10 border border-white/10 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-80" />
              {children}
            </div>
          </div>
        </div>
      </AuthSurroundings>
    </div>
  </PageTransitionWrapper>
);
