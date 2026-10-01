import { notFound } from "next/navigation";

export default function PublicProfileCompatibilityRoute() {
  // Student profiles are owner-only. Expert public profiles have their own
  // redacted route; a legacy student ID must never resolve to the viewer's DTO.
  notFound();
}
