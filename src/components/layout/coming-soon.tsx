import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ title, icon: Icon, description, points }: { title: string; icon: LucideIcon; description: string; points: string[] }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Icon className="size-6" aria-hidden />
          </div>
          <div>
            <Badge variant="accent">Planned for Phase 2</Badge>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              The database already stores the data these features need, so your history will carry over when they launch.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
