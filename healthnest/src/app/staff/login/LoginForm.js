"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [show, setShow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Submitting through a transition keeps the email after a failed sign-in (React would otherwise clear the form).
  // The password field is re-created on every attempt, so it is always emptied.
  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
    setAttempt((n) => n + 1);
  };

  return (
    // method="post" so that, even before the page's scripts load, credentials can never end up in the address bar.
    <form method="post" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <Input id="email" name="email" type="email" autoComplete="username" required aria-invalid={state?.error ? true : undefined} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="password-wrap">
          <Input
            key={attempt}
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus={attempt > 0}
            required
            aria-invalid={state?.error ? true : undefined}
          />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
      </div>
      {state?.error && (
        <p className="alert alert-bad" role="alert" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}
