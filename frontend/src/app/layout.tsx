import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import KnowledgeCursor from "@/components/ui/KnowledgeCursor";

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

export const metadata: Metadata = {
    title: "StudentHub AI — Editorial Academic & Intelligent Verification Network",
    description: "Nền tảng phòng chống lừa đảo thực tế và mạng lưới xác thực dành cho sinh viên Việt Nam, kết hợp AI xác thực thông tin 4 lớp, mạng lưới chuyên gia uy tín và diễn đàn cộng đồng.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${cormorantGaramond.variable} h-full antialiased`}
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