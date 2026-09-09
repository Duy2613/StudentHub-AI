import { redirect } from "next/navigation";

/** CUT-2: deep lesson links resolve to the public product entrypoint. */
export default function RetiredLessonRoute() {
  redirect("/");
}
