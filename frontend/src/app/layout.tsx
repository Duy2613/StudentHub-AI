import type { Metadata } from "next";
import {
    Instrument_Serif,
    Inter_Tight,
    JetBrains_Mono,
    Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import "@/components/margin/margin.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import KnowledgeCursor from "@/components/ui/KnowledgeCursor";
import { ReducedMotionBoundary } from "@/components/visual/ReducedMotionBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

// Machine Interface: JetBrains Mono (AI output, data, alerts, OCR)
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    display: "swap",
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: "400",
    style: ["normal", "italic"],
    display: "swap",
});

const interTight = Inter_Tight({
    variable: "--font-inter-tight",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "StudentHub AI | Academic operating system",
    description: "Theo dõi học vụ, kiểm tra rủi ro và ra quyết định dựa trên nguồn tin rõ ràng dành cho sinh viên.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            data-paper="night"
            className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${interTight.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-space-950 text-gray-100 selection:bg-teal-400 selection:text-space-950">
                <AuthProvider>
                    <BackgroundProvider>
                        <ReducedMotionBoundary>
                            <SmoothScrollProvider>
                                <KnowledgeCursor />
                                {children}
                            </SmoothScrollProvider>
                        </ReducedMotionBoundary>
                    </BackgroundProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
