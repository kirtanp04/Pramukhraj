import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      "h-12 w-full rounded-xl border bg-ivory px-4 text-sm! text-ink shadow-sm outline-none transition placeholder:text-ink-soft/60",
      error ? "border-oxblood focus:ring-2 focus:ring-oxblood/15" : "border-ink/15 focus:border-turmeric-deep focus:ring-2 focus:ring-turmeric/20",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
