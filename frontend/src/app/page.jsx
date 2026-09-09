import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import VNextLanding from "@/components/landing/VNextLanding";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "StudentHub AI | Hiểu đúng. Đi xa.",
  description: "Kiểm tra nguồn tin, đối chiếu bối cảnh và xem điều còn thiếu trước khi bạn quyết định.",
};

export default function HomePage() {
  return (
    <div className="vnext-landing-page">
      <AcademicNavbar />
      <main id="main-content" className="vnext-landing-main">
        <VNextLanding />
      </main>
      <footer className="vnext-landing-footer">
        <div className="vnext-landing-footer-inner">
          <div className="vnext-landing-footer-brand">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>StudentHub AI</span>
            <span className="type-technical">Nguồn trước quyết định</span>
          </div>
          <nav aria-label="Điều hướng chân trang" className="vnext-landing-footer-nav">
            <Link href="/trust">Kiểm chứng</Link>
            <Link href="/community">Cộng đồng</Link>
            <Link href="/expert">Chuyên gia</Link>
            <Link href="/cases">Tình huống</Link>
          </nav>
          <span className="type-technical">Bản địa hóa tiếng Việt · poster-first</span>
        </div>
      </footer>
    </div>
  );
}
