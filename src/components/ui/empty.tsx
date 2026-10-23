import type { LucideIcon } from "lucide-react";
import * as React from "react";

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <div className="rounded-full bg-primary-soft p-3 text-primary">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
