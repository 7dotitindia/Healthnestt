import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return <div data-slot="card" className={cn("flex flex-col gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs", className)} {...props} />;
}
function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn("grid gap-1", className)} {...props} />;
}
function CardTitle({ className, ...props }) {
  return <h3 data-slot="card-title" className={cn("font-serif text-lg font-semibold leading-snug", className)} {...props} />;
}
function CardDescription({ className, ...props }) {
  return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
