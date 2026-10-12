"use client";

import { useState } from "react";
import { Check, Link2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="share" aria-label="Share this article">
      <span className="label">Share</span>
      <Button asChild variant="outline" size="sm">
        <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${text}%20${link}`}><MessageCircle aria-hidden="true" />WhatsApp</a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${text}&url=${link}`}>X</a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={`mailto:?subject=${text}&body=${link}`}><Mail aria-hidden="true" />Email</a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <span className="sr-only" role="status">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}
