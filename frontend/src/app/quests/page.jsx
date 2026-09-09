import { redirect } from "next/navigation";

/** CUT-2: quests/gamification is retired from the public candidate. */
export default function RetiredQuestsRoute() {
  redirect("/dashboard");
}
