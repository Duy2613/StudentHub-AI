import LivingCampusAtlas from "@/components/landing/LivingCampusAtlas";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "StudentHub AI — Hiểu đúng. Đi xa.",
  description: "Hệ điều hành học tập biết kiểm chứng trước khi khuyên bạn — kết nối nguồn chính thức, trải nghiệm cộng đồng và chuyên gia đúng phạm vi.",
  openGraph: {
    title: "StudentHub AI — The Living Campus Atlas",
    description: "Kiểm chứng thông tin, hiểu thực tế vận hành và đưa ra bước đi học tập rõ ràng hơn.",
    images: [{ url: "/images/atlas/atlas-hero-library.webp", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudentHub AI — Hiểu đúng. Đi xa.",
    description: "Một hệ điều hành học tập biết kiểm chứng trước khi khuyên bạn.",
    images: ["/images/atlas/atlas-hero-library.webp"],
  },
};

export default function HomePage() {
  return <LivingCampusAtlas />;
}
