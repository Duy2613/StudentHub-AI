import type { Metadata } from "next";
import {
    Geist,
    Geist_Mono,
    Cormorant_Garamond,
    Instrument_Serif,
    Inter,
    JetBrains_Mono,
    Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import KnowledgeCursor from "@/components/ui/KnowledgeCursor";

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    weight: "400",
    subsets: ["latin"],
    style: ["normal", "italic"],
});

const cormorantGaramond = Cormorant_Garamond({
    variable: "--font-cormorant-garamond",
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["latin"],
    style: ["normal", "italic"],
});

// === DIGITAL GUARDIAN TYPOGRAPHY ===
// Human Interface: Inter / Plus Jakarta Sans (hướng dẫn, body, headings)
const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "900"],
    display: "swap",
});

// Machine Interface: JetBrains Mono (AI output, data, alerts, OCR)
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "StudentHub AI — Editorial Academic & Intelligent Verification Network",
    description: "Nền tảng phòng chống lừa đảo thực tế và mạng lưới xác thực dành cho sinh viên Việt Nam, kết hợp AI xác thực thông tin 4 lớp, mạng lưới chuyên gia uy tín và diễn đàn cộng đồng.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            className={`${plusJakartaSans.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${cormorantGaramond.variable} ${jetbrainsMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-space-950 text-gray-100 selection:bg-teal-400 selection:text-space-950">
                <AuthProvider>
                    <BackgroundProvider>
                        <SmoothScrollProvider>
                            <KnowledgeCursor />
                            {children}
                        </SmoothScrollProvider>
                    </BackgroundProvider>
                </AuthProvider>
            </body>
        </html>
    );
}