import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "secondary";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "border border-border bg-muted text-muted-foreground",
        variant === "outline" && "border border-border bg-transparent text-foreground",
        variant === "secondary" && "border border-transparent bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
