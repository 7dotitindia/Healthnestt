"use client";

import { useEffect } from "react";

// Counts one view per browser session. Sends only the article slug, nothing personal.
export default function ViewTracker({ slug }) {
  useEffect(() => {
    const key = `hn_viewed_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
