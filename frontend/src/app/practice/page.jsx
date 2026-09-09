import { redirect } from "next/navigation";

/** CUT-2: the practice/LMS surface is retired from the public candidate. */
export default function RetiredPracticeRoute() {
  redirect("/trust");
}
