"use client";
import { Focus, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";

function useToggle(key: "theme" | "focus") {
  const toggle = React.useCallback(() => {
    const el = document.documentElement;
    if (key === "theme") {
      const dark = !el.classList.contains("dark");
      el.classList.toggle("dark", dark);
      try {
        localStorage.setItem("theme", dark ? "dark" : "light");
      } catch {}
    } else {
      const on = el.dataset.focus !== "true";
      el.dataset.focus = on ? "true" : "false";
      try {
        localStorage.setItem("focus", String(on));
      } catch {}
    }
  }, [key]);
  return toggle;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary-soft font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.phase2 && <span className="rounded bg-muted px-1.5 text-[10px] uppercase tracking-wide">Soon</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const [open, setOpen] = React.useState(false);
  const toggleTheme = useToggle("theme");
  const toggleFocus = useToggle("focus");

  const footer = (
    <div className="space-y-1 border-t pt-3">
      <p className="truncate px-3 pb-1 text-xs text-muted-foreground">Signed in as {userName}</p>
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleFocus}>
        <Focus aria-hidden /> Focus mode
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleTheme}>
        <Sun className="hidden dark:block" aria-hidden />
        <Moon className="dark:hidden" aria-hidden />
        Toggle theme
      </Button>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
          <LogOut aria-hidden /> Sign out
        </Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <div data-chrome className="hidden border-r bg-card lg:block">
        <aside className="sticky top-0 flex h-screen flex-col gap-6 p-4">
          <Logo href="/dashboard" />
          <nav aria-label="Main" className="flex-1 overflow-y-auto">
            <NavLinks />
          </nav>
          {footer}
        </aside>
      </div>

      <header data-chrome className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Logo href="/dashboard" />
        <Button variant="ghost" size="icon" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu />
        </Button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo href="/dashboard" />
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
            <nav aria-label="Main" className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            {footer}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <button
          type="button"
          onClick={toggleFocus}
          data-focus-exit
          className="fixed right-4 bottom-4 z-20 hidden items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs shadow-md hover:bg-muted"
        >
          <Focus className="size-4" aria-hidden /> Exit focus mode
        </button>
      </div>
    </div>
  );
}
