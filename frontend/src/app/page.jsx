import React from "react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import AcademicHeroSection from "@/components/landing/AcademicHeroSection";
import ContinueLearningBar from "@/components/landing/ContinueLearningBar";
import InteractiveKnowledgeAtlas from "@/components/atlas/InteractiveKnowledgeAtlas";
import LearningDomainsSection from "@/components/landing/LearningDomainsSection";
import FullStackLayersSection from "@/components/landing/FullStackLayersSection";
import FeaturedCoursesSection from "@/components/landing/FeaturedCoursesSection";
import AiTutorSection from "@/components/landing/AiTutorSection";
import PracticeProjectLabSection from "@/components/landing/PracticeProjectLabSection";
import CommunityExpertsSection from "@/components/landing/CommunityExpertsSection";
import OutcomesSection from "@/components/landing/OutcomesSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "StudentHub AI — Learn Beyond The Classroom",
  description:
    "An intelligent learning environment that turns knowledge, practice, projects and people into one connected journey.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col antialiased">
      {/* 1. Navigation */}
      <AcademicNavbar />

      <main className="flex-1 w-full">
        {/* 2. Cinematic Hero */}
        <AcademicHeroSection />

        {/* 3. Continue Learning Bar */}
        <ContinueLearningBar />

        {/* 4. Knowledge Atlas */}
        <InteractiveKnowledgeAtlas />

        {/* 5. Learning Domains */}
        <LearningDomainsSection />

        {/* 6. Full-Stack Production Layers */}
        <FullStackLayersSection />

        {/* 7. Featured Courses */}
        <FeaturedCoursesSection />

        {/* 8. AI Tutor Showcase */}
        <AiTutorSection />

        {/* 9. Practice & Project Lab */}
        <PracticeProjectLabSection />

        {/* 10. Community & Experts Pillars */}
        <CommunityExpertsSection />

        {/* 11. Outcomes & Transformation */}
        <OutcomesSection />

        {/* 12. Final Cinematic CTA */}
        <FinalCtaSection />
      </main>

      {/* 13. Global Academic Footer */}
      <footer className="border-t border-border-subtle bg-bg-primary py-12 px-4 sm:px-6 lg:px-8 text-xs font-mono text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-text-secondary">
            <ShieldCheck size={16} className="text-accent-knowledge" />
            <span className="font-semibold text-text-primary">StudentHub AI</span>
            <span>·</span>
            <span>Academic Operating System</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/learn" className="hover:text-text-primary transition-colors">
              Learn
            </Link>
            <Link href="/roadmap" className="hover:text-text-primary transition-colors">
              Roadmap
            </Link>
            <Link href="/practice" className="hover:text-text-primary transition-colors">
              Practice
            </Link>
            <Link href="/projects" className="hover:text-text-primary transition-colors">
              Projects
            </Link>
            <Link href="/trust" className="hover:text-text-primary transition-colors">
              Trust Engine
            </Link>
            <Link href="/community" className="hover:text-text-primary transition-colors">
              Community
            </Link>
            <Link href="/expert" className="hover:text-text-primary transition-colors">
              Experts
            </Link>
          </div>

          <div>© 2026 StudentHub AI. Chuẩn học thuật & Kiểm chứng thực tế.</div>
        </div>
      </footer>
    </div>
  );
}
