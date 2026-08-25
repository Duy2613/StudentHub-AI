"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

export function TactileButton({
  children,
  href,
  onClick,
  variant = "primary", // "primary" (teal), "indigo", "secondary", "danger", "outline", "scan"
  size = "md", // "sm", "md", "lg"
  icon: Icon = ArrowRight,
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  showArrow = true,
  techSuffix,
  ...props
}) {
  const sizeStyles = {
    sm: "py-2 px-3.5 text-xs rounded-xl",
    md: "py-3 px-5 text-sm rounded-xl font-bold",
    lg: "py-4 px-7 text-base rounded-2xl font-extrabold",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-space-950 shadow-[0_8px_25px_rgba(52,231,196,0.35)] hover:shadow-[0_14px_35px_rgba(52,231,196,0.5)] border border-teal-300/40 font-human",
    scan:
      "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_8px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_14px_35px_rgba(37,99,235,0.5)] border border-blue-400/30 font-human",
    indigo:
      "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_14px_35px_rgba(99,102,241,0.5)] border border-indigo-400/30 font-human",
    secondary:
      "bg-white/10 text-white hover:bg-white/15 border border-white/15 backdrop-blur-xl shadow-glass-deep font-human",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_8px_25px_rgba(239,68,68,0.35)] border border-red-500/40 font-human",
    outline:
      "bg-transparent text-gray-200 hover:text-white border border-white/20 hover:border-teal-400/60 hover:bg-white/5 font-human",
  };

  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 transition-all duration-300 ease-premium hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 select-none cursor-pointer";

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <span className="font-human">{children}</span>
          {techSuffix && (
            <span className="tech-suffix font-machine text-[10px] font-normal opacity-80 bg-white/15 px-1.5 py-0.5 rounded ml-0.5 tracking-wider">
              {techSuffix}
            </span>
          )}
          {showArrow && Icon && (
            <Icon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`group ${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group ${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {buttonContent}
    </button>
  );
}

export default TactileButton;
