import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[6px] border-2 border-border/60 bg-background/50 px-3 text-[12px] font-mono font-bold uppercase tracking-wider text-foreground outline-none transition-all",
        "focus:border-primary focus:shadow-[3px_3px_0_rgba(var(--primary),0.15)] hover:border-primary/40",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
