"use client";

// app/register/page.jsx
//
// Trang Đăng Ký StudentHub AI (Saffron Finance x Meer Mohsin x uAvionix):
// - Vỏ bọc SaffronAuthContainer với Swiss Grid & Realtime Fluid Canvas (meermohsin.me)
// - Bảng điều khiển SaffronAuthDeck với Radar phát hiện email trường .edu (+30 điểm uy tín)
// - Xác thực 2 bước với Settigation Orbit OTP v3 (vòng quay thiên văn Saffron/Teal)
// - Aerospace Avionics Telemetry HUD (usavionix.com)

import React from "react";
import SaffronAuthContainer from "@/components/auth/SaffronAuthContainer";
import SaffronAuthDeck from "@/components/auth/SaffronAuthDeck";

export default function RegisterPage() {
  return (
    <SaffronAuthContainer>
      <SaffronAuthDeck initialMode="register" />
    </SaffronAuthContainer>
  );
}
