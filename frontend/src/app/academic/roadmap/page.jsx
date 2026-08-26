import React from "react";
import { AcademicRoadmapView } from "@/components/academic/AcademicRoadmapView.jsx";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";

export const metadata = {
  title: "Academic Roadmap | StudentHub AI",
  description: "Lộ trình học vụ cá nhân — hiện trạng, hành trình, mục tiêu và kế hoạch tốt nghiệp dành riêng cho bạn."
};

export default function AcademicRoadmapPage() {
  const initialData = getAuthoritativeCommandCenterData();

  return (
    <main className="min-h-screen bg-background text-foreground antialiased pt-4">
      <AcademicRoadmapView initialData={initialData} />
    </main>
  );
}
