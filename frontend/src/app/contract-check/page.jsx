import { redirect } from "next/navigation";

export default function ContractCheckCompatibilityRoute() {
  redirect("/trust?tab=contract");
}
