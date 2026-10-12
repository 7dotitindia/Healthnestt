"use client";

import { useActionState } from "react";
import { createFreelancer } from "@/app/actions/users";

export default function NewFreelancerForm() {
  const [state, action, pending] = useActionState(createFreelancer, null);
  return (
    <form action={action} className="card" style={{ padding: 16, maxWidth: 480 }}>
      <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" className="input" required /></div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required /></div>
      <div className="field"><label htmlFor="password">Temporary password</label><input id="password" name="password" type="text" className="input" autoComplete="off" required />
        <span className="hint">At least 10 characters with a letter and a number. Share it securely.</span></div>
      {state && <p className={state.ok ? "alert alert-ok" : "alert alert-bad"} role="status" style={{ marginBottom: 12 }}>{state.message}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Creating..." : "Create freelancer"}</button>
    </form>
  );
}
