import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your question library and notes stay private to you.</p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered? <Link href="/login" className="text-primary underline">Sign in</Link>
      </p>
    </>
  );
}
