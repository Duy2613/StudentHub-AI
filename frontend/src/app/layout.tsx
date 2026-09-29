import type { Metadata } from "next";
import {
    Be_Vietnam_Pro,
    JetBrains_Mono,
    Lora,
} from "next/font/google";
import "./globals.css";
import "@/styles/index.css";
import "@/components/margin/margin.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import { AdaptiveQualityProvider } from "@/components/providers/AdaptiveQualityContext";
import { RealtimeProvider } from "@/components/providers/RealtimeContext";
import RealtimeNotificationToasts from "@/components/realtime/RealtimeNotificationToasts";
import { ReducedMotionBoundary } from "@/components/visual/ReducedMotionBoundary";
import PrimaryNavbar from "@/components/navigation/PrimaryNavbar";
import MobileNavRail from "@/components/navigation/MobileNavRail";

/**
 * MASTER FRONTEND CONSTITUTION v4.0 (three canonical font roles)
 * Exactly three canonical font roles:
 * - Editorial / Display: Lora Variable
 * - Product / UI / Reading: Be Vietnam Pro
 * - Technical: JetBrains Mono
 */
const beVietnamPro = Be_Vietnam_Pro({
    variable: "--font-be-vietnam-pro",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
    preload: true,
});

const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin", "vietnamese"],
    weight: "variable",
    style: ["normal", "italic"],
    display: "swap",
    preload: false,
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap",
    preload: false,
});

export const metadata: Metadata = {
    title: "StudentHub AI | Hiểu đúng. Đi xa.",
    description: "Kiểm chứng thông tin, thảo luận có dẫn chứng và hiểu đánh giá từ chuyên gia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            data-theme="midnight"
            data-paper="night"
            className={`${beVietnamPro.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                {/* Accessible Skip Link (M-51, C-28) */}
                <a href="#main-content" className="skip-to-main">
                    Bỏ qua đến nội dung chính
                </a>

                <div className="analog-grain-overlay" aria-hidden="true" />
                <AuthProvider>
                    <BackgroundProvider>
                        <RealtimeProvider>
                            <AdaptiveQualityProvider>
                                <ReducedMotionBoundary>
                                    <RealtimeNotificationToasts />
                                    <PrimaryNavbar />
                                    <main id="main-content" className="flex-1 pb-16 md:pb-0 focus:outline-none">
                                        {children}
                                    </main>
                                    <MobileNavRail />
                                </ReducedMotionBoundary>
                            </AdaptiveQualityProvider>
                        </RealtimeProvider>
                    </BackgroundProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
