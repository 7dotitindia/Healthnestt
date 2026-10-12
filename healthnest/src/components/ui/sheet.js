"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui Sheet (a Radix Dialog that slides in from the side). Radix traps focus, closes on Escape
// and restores focus, so none of that is hand-written. Motion is CSS only (see .sheet-* in globals.css).
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

function SheetContent({ className, children, side = "right", ...props }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/50" />
      <SheetPrimitive.Content
        data-side={side}
        className={cn(
          "sheet-content fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg outline-none",
          side === "right" && "inset-y-0 right-0 h-full w-[88%] max-w-sm border-l border-border",
          side === "left" && "inset-y-0 left-0 h-full w-[88%] max-w-sm border-r border-border",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-5" />
          <span className="sr-only">Close menu</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
