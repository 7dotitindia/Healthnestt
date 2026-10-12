"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleBookmark } from "@/app/actions/readers";
import { Button } from "@/components/ui/button";

// Save / saved toggle. A signed-out visitor is sent to sign in and brought back to the article afterwards.
export default function BookmarkButton({ articleId, initialSaved, loginHref }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError("");
    startTransition(async () => {
      const res = await toggleBookmark(articleId);
      if (res?.needsLogin) return router.push(loginHref);
      if (res?.ok) setSaved(res.saved);
      else setError(res?.message || "Couldn't save. Please try again.");
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={pending} aria-pressed={saved}>
        {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
        {saved ? "Saved" : "Save"}
      </Button>
      <span className="sr-only" role="status">{error || (saved ? "Article saved" : "")}</span>
      {error && <span className="meta">{error}</span>}
    </>
  );
}
