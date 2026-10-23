import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 text-sm text-muted-foreground">Sign in to continue studying.</p>
      {error === "confirm" && <p className="mb-4 text-sm text-destructive">That confirmation link is invalid or expired.</p>}
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link href="/signup" className="text-primary underline">Create an account</Link>
      </p>
    </>
  );
}
