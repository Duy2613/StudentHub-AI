import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile | StudentHub AI",
  description: "Hồ sơ cá nhân và lịch sử được phép truy cập của StudentHub AI.",
};

/** Compatibility entry: academic identity is owned by the canonical Profile route. */
export default function AcademicProfileCompatibilityRoute() {
  redirect("/profile");
}
