import { redirect } from "next/navigation";

export default async function PublicProfileCompatibilityRoute({ params }) {
  const resolvedParams = await params;
  const id = typeof resolvedParams?.id === "object" ? resolvedParams.id?.id : resolvedParams?.id;

  redirect(id ? `/profile?profileId=${encodeURIComponent(id)}` : "/profile");
}
