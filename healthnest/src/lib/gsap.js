"use client";

// One place that registers GSAP plugins. Import gsap, ScrollTrigger and useGSAP from here, never from the packages.
// GSAP only runs in the browser: every use of it lives inside useGSAP or an effect, never during server rendering.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.6 });

export { gsap, ScrollTrigger, useGSAP };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
