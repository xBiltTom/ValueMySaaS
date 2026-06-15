import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border-2 px-4 text-[11px] font-black uppercase tracking-widest font-mono transition-all active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground shadow-[3px_3px_0_rgba(var(--primary),0.3)] hover:shadow-[1px_1px_0_rgba(var(--primary),0.3)]",
        variant === "secondary" &&
          "border-border/60 bg-card text-foreground hover:border-border hover:bg-muted",
        variant === "ghost" &&
          "border-transparent text-muted-foreground hover:border-border/40 hover:bg-muted hover:text-foreground",
        variant === "danger" &&
          "border-red-500/60 bg-red-500/10 text-red-400 shadow-[3px_3px_0_rgba(239,68,68,0.15)] hover:bg-red-500/20 hover:shadow-[1px_1px_0_rgba(239,68,68,0.15)]",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
