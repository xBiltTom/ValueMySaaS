import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" &&
          "bg-destructive text-white shadow-sm hover:opacity-90",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
