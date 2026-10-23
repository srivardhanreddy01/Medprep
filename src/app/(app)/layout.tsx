import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DisclaimerFooter } from "@/components/layout/disclaimer";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("display_name, onboarded_at").eq("id", user.id).single();
  if (!profile?.onboarded_at) redirect("/onboarding");
  return (
    <AppShell userName={profile.display_name ?? user.email ?? "Student"}>
      {children}
      <div className="mt-12">
        <DisclaimerFooter />
      </div>
    </AppShell>
  );
}
