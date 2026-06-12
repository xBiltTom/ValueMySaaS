import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground shadow-sm transition placeholder:text-muted-foreground",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
