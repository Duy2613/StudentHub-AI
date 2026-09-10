import type { Metadata } from "next";
import {
    Be_Vietnam_Pro,
    Cormorant_Garamond,
    JetBrains_Mono,
    Lora,
    Newsreader,
} from "next/font/google";
import "./globals.css";
import "@/components/margin/margin.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import { RealtimeProvider } from "@/components/providers/RealtimeContext";
import RealtimeNotificationToasts from "@/components/realtime/RealtimeNotificationToasts";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { ReducedMotionBoundary } from "@/components/visual/ReducedMotionBoundary";
import PrimaryNavbar from "@/components/navigation/PrimaryNavbar";
import MobileNavRail from "@/components/navigation/MobileNavRail";

const beVietnamPro = Be_Vietnam_Pro({
    variable: "--font-be-vietnam-pro",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
    preload: true,
});

// Monumental & Editorial Display: Cormorant Garamond (Classical tension, academic authority)
const cormorantGaramond = Cormorant_Garamond({
    variable: "--font-cormorant-garamond",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
    display: "swap",
    preload: true,
});

// Editorial Reading & Quotes: Newsreader
const newsreader = Newsreader({
    variable: "--font-newsreader",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600"],
    style: ["normal", "italic"],
    display: "swap",
    preload: false,
});

const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin", "vietnamese"],
    weight: ["500", "600"],
    style: ["normal", "italic"],
    display: "swap",
    preload: false,
});

// Machine Interface: JetBrains Mono (Data, code, hash, timestamps, alerts, OCR)
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap",
    preload: false,
});


export const metadata: Metadata = {
    title: "StudentHub AI | Hiểu đúng. Đi xa.",
    description: "Kiểm tra nguồn tin, đối chiếu bối cảnh và xem điều còn thiếu trước khi bạn quyết định.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            data-paper="night"
            className={`${beVietnamPro.variable} ${cormorantGaramond.variable} ${newsreader.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-transparent text-gray-100 selection:bg-teal-400 selection:text-space-950">
                <div className="analog-grain-overlay" aria-hidden="true" />
                <AuthProvider>
                    <BackgroundProvider>
                        <RealtimeProvider>
                            <ReducedMotionBoundary>
                                <SmoothScrollProvider>
                                    <RealtimeNotificationToasts />
                                    <PrimaryNavbar />
                                    <div className="flex-1 pb-16 md:pb-0">
                                        {children}
                                    </div>
                                    <MobileNavRail />
                                </SmoothScrollProvider>
                            </ReducedMotionBoundary>
                        </RealtimeProvider>
                    </BackgroundProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
