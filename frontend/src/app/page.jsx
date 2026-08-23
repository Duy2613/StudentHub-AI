"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  LayoutDashboard,
  Bot,
  FileText,
  Sliders,
  User,
  GraduationCap,
  Home
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import TrustSocialProof from "@/components/landing/TrustSocialProof";
import TrinitySuiteShowcase from "@/components/landing/TrinitySuiteShowcase";
import IsometricScrollSection from "@/components/home/IsometricScrollSection";
import InteractiveSlider from "@/components/home/InteractiveSlider";
import FeatureBento from "@/components/landing/FeatureBento";
import InteractiveComparison from "@/components/landing/InteractiveComparison";

import ExpertShowcase from "@/components/landing/ExpertShowcase";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingAndFAQ from "@/components/landing/PricingAndFAQ";
import LandingFooter from "@/components/landing/LandingFooter";
import { TextRevealByWord } from "@/components/ui/text-reveal";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function HomePage() {
  const { session, profile, isLoading } = useAuth();

  const dockItems = [
    {
      title: "Trang Chủ",
      icon: <Home className="h-full w-full" />,
      href: "/",
    },
    {
      title: "AI Mentor Space",
      icon: <Bot className="h-full w-full text-indigo-400" />,
      href: "/ai-mentor",
    },
    {
      title: "Notion Workspace",
      icon: <FileText className="h-full w-full text-purple-400" />,
      href: "/workspace",
    },
    {
      title: "Digital Whiteboard",
      icon: <Sliders className="h-full w-full text-cyan-400" />,
      href: "/whiteboard",
    },
    {
      title: "Bảng Điều Khiển",
      icon: <LayoutDashboard className="h-full w-full text-emerald-400" />,
      href: session ? "/dashboard" : "/login",
    },
    {
      title: "Đổi Avatar & Vai trò",
      icon: <User className="h-full w-full text-indigo-400" />,
      href: session ? "/onboarding" : "/register",
    },
  ];

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white pb-20">
      {/* Visual Ambiance & Grain Overlay */}
      <AmbientBackground />
      <NoiseOverlay />

      {/* Main Glass Header */}
      <LandingHeader />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <HeroSection />
        <TrustSocialProof />
        
        {/* Kinetic Scroll Text Reveal */}
        <div className="max-w-5xl mx-auto px-4">
          <TextRevealByWord text="Trợ lý trí tuệ nhân tạo toàn năng kết hợp mạng lưới cố vấn chuyên gia thực chứng, tối ưu hóa điểm số và khai phóng tiềm năng học thuật của sinh viên Việt Nam." />
        </div>

        {/* Studio 3D Visual Trinity Suite Showcase */}
        <TrinitySuiteShowcase />

        {/* 3D Isometric Scrollytelling Section */}
        <IsometricScrollSection />

        {/* Interactive Career & Academic Level Slider */}
        <InteractiveSlider />

        <FeatureBento />
        <InteractiveComparison />
        <ExpertShowcase />
        <TestimonialsSection />
        <PricingAndFAQ />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Bottom Floating macOS-style Dock */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-auto">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
}
