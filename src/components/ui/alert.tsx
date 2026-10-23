import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border p-3 text-sm [&_svg]:size-4 [&_svg]:mt-0.5 [&_svg]:shrink-0", {
  variants: {
    variant: {
      info: "border-accent/30 bg-accent-soft text-foreground [&_svg]:text-accent",
      warning: "border-warning/40 bg-warning-soft text-foreground [&_svg]:text-warning",
      destructive: "border-destructive/40 bg-destructive-soft text-foreground [&_svg]:text-destructive",
      success: "border-success/40 bg-success-soft text-foreground [&_svg]:text-success",
      ai: "border-ai/30 bg-ai-soft text-foreground [&_svg]:text-ai",
    },
  },
  defaultVariants: { variant: "info" },
});

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role={variant === "destructive" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props} />;
}
