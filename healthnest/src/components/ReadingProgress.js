"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

// A thin bar across the top of the screen that fills as you read down the article (scroll-linked, transform only).
// Decorative, so it is hidden from assistive technology, and absent for reduced motion.
export default function ReadingProgress({ targetSelector = "#article-body" }) {
  const bar = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const target = document.querySelector(targetSelector);
        if (!target || !bar.current) return;
        gsap.set(bar.current, { scaleX: 0, autoAlpha: 1, transformOrigin: "0 50%" });
        gsap.to(bar.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: target, start: "top 80%", end: "bottom 60%", scrub: 0.2 },
        });
      });
    },
    { scope: bar },
  );

  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}
