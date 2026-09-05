import React from "react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import { AcademicRoadmapView } from "@/components/academic/AcademicRoadmapView.jsx";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";

export const metadata = {
  title: "Roadmap | StudentHub AI",
  description: "Bản đồ lộ trình học tập, điều kiện tiên quyết và tiến trình học phần.",
};

export default function CanonicalRoadmapPage() {
  const initialData = getAuthoritativeCommandCenterData();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <AcademicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AcademicRoadmapView initialData={initialData} />
      </main>
    </div>
  );
}
