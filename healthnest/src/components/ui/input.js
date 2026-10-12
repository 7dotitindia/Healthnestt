import * as React from "react";
import { cn } from "@/lib/utils";

// 16px text on purpose: smaller text makes iOS Safari zoom the page when the field is focused.
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground shadow-xs outline-none " +
          "transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground " +
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 " +
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
