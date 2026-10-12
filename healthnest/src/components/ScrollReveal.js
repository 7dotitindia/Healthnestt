"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";

// Wrap a section; anything inside with className="reveal" fades and rises into place as it scrolls into view.
// Only transform and opacity animate. Runs once per element. Skipped entirely for reduced motion.
// The matching CSS (html.js-motion ... [data-reveal] .reveal) hides items before the first paint, so nothing flashes.
export default function ScrollReveal({ children, className, as: Tag = "div", ...rest }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray(".reveal", ref.current);
        if (!items.length) return;
        gsap.set(items, { autoAlpha: 0, y: 20 });
        document.documentElement.classList.add("gsap-ready");
        ScrollTrigger.batch(items, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, overwrite: true }),
        });
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-reveal className={className} {...rest}>
      {children}
    </Tag>
  );
}
