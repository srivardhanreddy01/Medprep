"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const Credentials = z.object({
  email: z.email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function safeNext(next: FormDataEntryValue | null) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message };
  redirect(safeNext(form.get("next")));
}

const SignUp = Credentials.extend({
  display_name: z.string().trim().min(1, "Enter your name").max(80),
  accept: z.literal("on", { error: "You must accept the educational-use terms" }),
});

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignUp.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    display_name: form.get("display_name"),
    accept: form.get("accept"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
      emailRedirectTo: `${SITE_URL()}/auth/confirm?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your email to confirm your account, then sign in." };
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
