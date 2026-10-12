"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { subscribe } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterForm({ source = "site" }) {
  const [state, action, pending] = useActionState(subscribe, null);

  if (state?.ok) {
    return (
      <p className="alert alert-ok" role="status" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
      <input type="hidden" name="source" value={source} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label className="sr-only" htmlFor={`nl-${source}`}>Email address</label>
        <Input id={`nl-${source}`} className="flex-1 basis-56" type="email" name="email" placeholder="Email address" required autoComplete="email" />
        <Button type="submit" disabled={pending}>{pending ? "Subscribing..." : "Subscribe"}</Button>
      </div>
      <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text-2)" }}>
        <input type="checkbox" name="consent" required style={{ marginTop: 4, accentColor: "var(--primary)" }} />
        <span>I agree to receive the Healthnestt newsletter and understand I can unsubscribe at any time.</span>
      </label>
      {state && !state.ok && <p className="errmsg" role="alert">{state.message}</p>}
    </form>
  );
}
