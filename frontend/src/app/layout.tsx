import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import CustomMorphingCursor from "@/components/ui/custom-morphing-cursor";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "StudentHub AI - Hệ Sinh Thái Học Tập & Cố Vấn Học Thuật AI",
    description: "StudentHub AI - Nền tảng Trí tuệ Nhân tạo & Mạng lưới Cố vấn Học thuật hàng đầu cho sinh viên Việt Nam",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="vi"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-space-950 text-gray-100">
                <CustomMorphingCursor />
                <AuthProvider>
                    <SmoothScrollProvider>
                        {children}
                    </SmoothScrollProvider>
                </AuthProvider>
            </body>
        </html>
    );
}