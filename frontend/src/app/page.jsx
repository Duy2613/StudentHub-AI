import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import EvidenceWorldLanding from "@/components/landing/EvidenceWorldLanding";
import { getCoreNavItems } from "@/config/navigation";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "StudentHub AI | Hiểu đúng. Đi xa.",
  description: "Kiểm tra nguồn tin, đối chiếu bối cảnh và xem điều còn thiếu trước khi bạn quyết định.",
};

const LANDING_FOOTER_LINKS = getCoreNavItems();

export default function HomePage() {
  return (
    <div className="vnext-landing-page">
      <AcademicNavbar />
      <div className="vnext-landing-main">
        <EvidenceWorldLanding />
      </div>
      <footer className="vnext-landing-footer">
        <div className="vnext-landing-footer-inner">
          <div className="vnext-landing-footer-brand">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>StudentHub AI</span>
            <span className="type-technical">Nguồn trước quyết định</span>
          </div>
          <nav aria-label="Điều hướng chân trang" className="vnext-landing-footer-nav">
            {LANDING_FOOTER_LINKS.map((item) => (
              <Link key={item.id} href={item.route}>{item.label}</Link>
            ))}
          </nav>
          <span className="type-technical">Bản địa hóa tiếng Việt · poster-first</span>
        </div>
      </footer>
    </div>
  );
}
