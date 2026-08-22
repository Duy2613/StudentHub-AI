"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import TrustSocialProof from "@/components/landing/TrustSocialProof";
import FeatureBento from "@/components/landing/FeatureBento";
import InteractiveComparison from "@/components/landing/InteractiveComparison";
import ExpertShowcase from "@/components/landing/ExpertShowcase";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingAndFAQ from "@/components/landing/PricingAndFAQ";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  const { session, profile, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-space-950 text-gray-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Visual Ambiance & Grain Overlay */}
      <AmbientBackground />
      <NoiseOverlay />

      {/* Logged in User Quick Jump Banner */}
      {!isLoading && session && (
        <div className="relative z-50 bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90 border-b border-indigo-500/30 px-4 py-2 text-center text-xs font-medium text-white flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
          <span>Chào mừng trở lại, <strong>{profile?.full_name || "bạn"}</strong>! Bạn đang đăng nhập.</span>
          <Link
            href="/dashboard"
            className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors"
          >
            <span>Vào Dashboard</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Glass Header */}
      <LandingHeader />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <HeroSection />
        <TrustSocialProof />
        <FeatureBento />
        <InteractiveComparison />
        <ExpertShowcase />
        <TestimonialsSection />
        <PricingAndFAQ />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
