"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginReader, signup } from "@/app/actions/readers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Sign-in and sign-up share one form. `next` is a same-site path the server re-checks before redirecting.
export default function AuthForm({ mode, next }) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(isSignup ? signup : loginReader, null);
  const [show, setShow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Submitting through a transition keeps what was typed after an error; the password field is re-created each time.
  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
    setAttempt((n) => n + 1);
  };

  return (
    // method="post" so credentials can never end up in the address bar, even before scripts load.
    <form method="post" onSubmit={onSubmit}>
      <input type="hidden" name="next" value={next || ""} />
      {isSignup && (
        <div className="field">
          <label htmlFor="name">Your name</label>
          <Input id="name" name="name" type="text" autoComplete="name" required maxLength={80} />
        </div>
      )}
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
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            autoFocus={attempt > 0}
            required
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={isSignup ? "pw-hint" : undefined}
          />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
        {isSignup && <p id="pw-hint" className="meta" style={{ marginTop: 6 }}>At least 8 characters, with a letter and a number.</p>}
      </div>
      {state?.error && (
        <p className="alert alert-bad" role="alert" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
