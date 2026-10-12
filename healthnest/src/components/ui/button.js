import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Button, tuned for Healthnestt: 200ms ease-out colour changes and a small press-down.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold " +
    "transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] " +
    "disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [@media(hover:hover)]:hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground [@media(hover:hover)]:hover:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground [@media(hover:hover)]:hover:bg-secondary/70",
        outline: "border border-input bg-transparent text-foreground [@media(hover:hover)]:hover:bg-muted",
        ghost: "text-foreground [@media(hover:hover)]:hover:bg-muted",
        link: "text-primary underline-offset-4 [@media(hover:hover)]:hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
