import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-[6px] border-2 border-border/60 bg-background/50 px-3 py-2.5 text-[13px] font-mono font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 resize-y",
        "focus:border-primary focus:shadow-[3px_3px_0_rgba(var(--primary),0.15)] hover:border-primary/40",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
