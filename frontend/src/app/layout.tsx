import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "StudentHub AI — Nền tảng Phòng chống Lừa đảo & Mạng lưới Xác thực cho Sinh viên",
    description: "Nền tảng phòng chống lừa đảo thực tế dành cho sinh viên Việt Nam, kết hợp AI xác thực thông tin 4 lớp, mạng lưới chuyên gia uy tín và diễn đàn cộng đồng. Dự án tham gia Cuộc thi Sáng tạo trẻ Quốc gia AI 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-space-950 text-gray-100">
                <AuthProvider>
                    <SmoothScrollProvider>
                        {children}
                    </SmoothScrollProvider>
                </AuthProvider>
            </body>
        </html>
    );
}