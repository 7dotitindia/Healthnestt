"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bookmark, LayoutDashboard, LogOut, User } from "lucide-react";
import { logoutReader } from "@/app/actions/readers";

// Round profile button with a small menu. Built on <details>, so it opens without any script and
// closes on outside click or Escape.
export default function ProfileMenu({ name, dashboard }) {
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.open) return;
      if (e.type === "keydown" ? e.key === "Escape" : !ref.current.contains(e.target)) ref.current.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <details className="profile-menu" ref={ref}>
      <summary className="profile-btn" aria-label={`Account menu for ${name}`}>{initial}</summary>
      <div className="profile-pop">
        <p className="profile-name">{name}</p>
        <Link href="/account"><User aria-hidden="true" />My account</Link>
        <Link href="/account#saved"><Bookmark aria-hidden="true" />Saved articles</Link>
        {dashboard && <Link href={dashboard.href}><LayoutDashboard aria-hidden="true" />{dashboard.label}</Link>}
        <form action={logoutReader}>
          <button type="submit"><LogOut aria-hidden="true" />Sign out</button>
        </form>
      </div>
    </details>
  );
}
