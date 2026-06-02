import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-full border border-primary/10 bg-white/85 px-4 py-2 text-sm text-charcoal shadow-sm transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
