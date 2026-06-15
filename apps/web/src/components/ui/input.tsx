import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[6px] border-2 border-border/60 bg-background/50 px-3 text-[13px] font-mono font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/50",
        "focus:border-primary focus:shadow-[3px_3px_0_rgba(var(--primary),0.15)] hover:border-primary/40",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
