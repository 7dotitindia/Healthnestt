"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }) {
  return (
    <div className="wrap-narrow section">
      <p className="kicker">Error</p>
      <h1 className="article-title" style={{ marginTop: 4 }}>Something went wrong</h1>
      <p className="muted" style={{ fontSize: 18 }}>We couldn&apos;t load this page. Please try again, or head back home.</p>
      <p style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <Button type="button" onClick={() => reset()}><RotateCw aria-hidden="true" />Try again</Button>
        <Button asChild variant="outline"><Link href="/">Home</Link></Button>
      </p>
    </div>
  );
}
