"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/readers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileForm({ name, email }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} style={{ maxWidth: 420 }}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <Input id="name" name="name" type="text" defaultValue={name} required maxLength={80} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" value={email} readOnly aria-describedby="email-note" />
        <p id="email-note" className="meta" style={{ marginTop: 6 }}>Your email can&apos;t be changed here yet.</p>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
      <span role="status" className="meta" style={{ marginLeft: 12 }}>{state?.message}</span>
    </form>
  );
}
