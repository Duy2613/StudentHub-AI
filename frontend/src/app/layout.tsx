import type { Metadata } from "next";
import {
    Be_Vietnam_Pro,
    JetBrains_Mono,
    Lora,
} from "next/font/google";
import "./globals.css";
import "@/components/margin/margin.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BackgroundProvider } from "@/components/providers/BackgroundContext";
import { RealtimeProvider } from "@/components/providers/RealtimeContext";
import RealtimeNotificationToasts from "@/components/realtime/RealtimeNotificationToasts";
import RealtimeLiveConsole from "@/components/realtime/RealtimeLiveConsole";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import KnowledgeCursor from "@/components/ui/KnowledgeCursor";
import { ReducedMotionBoundary } from "@/components/visual/ReducedMotionBoundary";

const beVietnamPro = Be_Vietnam_Pro({
    variable: "--font-be-vietnam-pro",
    subsets: ["latin", "vietnamese"],
    // Keep only body and display weights on the critical shared font. Intermediate
    // weights are synthesized by the browser so below-the-fold cards do not add
    // twelve extra font requests to every route.
    weight: ["400", "700"],
    // Avoid late font swaps invalidating the LCP candidate on slow mobile links.
    // Fast clients still use Be Vietnam Pro; slower clients keep the metric-safe
    // system fallback until the next navigation.
    display: "optional",
    // Let the browser fetch only the glyph/weight actually used above the fold.
    // Preloading every weight and subset creates eight high-priority requests.
    preload: false,
});

const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "600"],
    style: ["normal"],
    display: "optional",
    preload: false,
});

// Machine Interface: JetBrains Mono (AI output, data, alerts, OCR)
const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    weight: ["400", "600"],
    display: "optional",
    preload: false,
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
            className={`${beVietnamPro.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-transparent text-gray-100 selection:bg-teal-400 selection:text-space-950">
                <AuthProvider>
                    <BackgroundProvider>
                        <RealtimeProvider>
                            <ReducedMotionBoundary>
                                <SmoothScrollProvider>
                                    <KnowledgeCursor />
                                    <RealtimeNotificationToasts />
                                    <RealtimeLiveConsole />
                                    {children}
                                </SmoothScrollProvider>
                            </ReducedMotionBoundary>
                        </RealtimeProvider>
                    </BackgroundProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
