import React from "react";
import { AcademicCommandCenter } from "@/components/academic/AcademicCommandCenter.jsx";

export const metadata = {
  title: "Academic Command Center | StudentHub AI",
  description: "Bản sao số học vụ cá nhân hóa và trung tâm điều phối thông báo, quy chế, hạn chót đào tạo HCMUTE."
};

export default function AcademicPage() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased pt-4">
      <AcademicCommandCenter />
    </main>
  );
}
