import { redirect } from "next/navigation";

// Compatibility entry point for verification links. The live registration
// flow owns the OTP state in /register, so this route must not create a
// second verification authority or accept an arbitrary return destination.
export default function VerifyPage() {
  redirect("/register");
}
