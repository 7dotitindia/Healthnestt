"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const KEY = "hn_cookie_notice";

// Reads the "already seen" flag from localStorage without setting state in an effect.
// The server snapshot says "seen", so nothing is rendered on the server (no hydration mismatch).
const subscribe = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getSnapshot = () => {
  try {
    return localStorage.getItem(KEY) ? "seen" : "new";
  } catch {
    return "new";
  }
};
const getServerSnapshot = () => "seen";

// Healthnestt currently sets no tracking or advertising cookies, only the sign-in cookie for staff.
// This notice says so. If analytics or ads are added later, this is where a real choice belongs.
export default function CookieNotice() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hidden, setHidden] = useState(false);
  if (stored === "seen" || hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, "seen"); } catch { /* storage blocked: it will show again next visit */ }
    setHidden(true);
  };

  return (
    <div className="cookie" role="region" aria-label="Cookie notice">
      <p style={{ margin: "0 0 12px", fontSize: 14 }}>
        We only use essential cookies (for example, to keep our staff signed in). We don&apos;t use advertising or tracking cookies.{" "}
        <Link href="/privacy">Read our privacy policy</Link>.
      </p>
      <Button type="button" size="sm" onClick={dismiss}>Got it</Button>
    </div>
  );
}
