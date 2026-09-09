import { redirect } from "next/navigation";

export const metadata = {
  title: "StudentHub AI",
  description: "Kiểm chứng trước khi quyết định.",
};

/** CUT-2: the retired course surface is no longer a public candidate route. */
export default function RetiredLearnRoute() {
  redirect("/");
}
