"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Name</Label>
          <Input id="display_name" name="display_name" autoComplete="name" required maxLength={80} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
        />
      </div>
      {mode === "signup" && (
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="accept" required className="mt-1 accent-[var(--primary)]" />
          <span>
            I understand MedPrep is for education only, AI explanations can be wrong, and I will not submit identifiable
            patient information. <Link href="/disclaimer" className="underline" target="_blank">Disclaimer</Link>
          </span>
        </label>
      )}
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      {state?.message && <Alert variant="success">{state.message}</Alert>}
      <SubmitButton className="w-full" pendingText={mode === "login" ? "Signing in…" : "Creating account…"}>
        {mode === "login" ? "Sign in" : "Create account"}
      </SubmitButton>
    </form>
  );
}
