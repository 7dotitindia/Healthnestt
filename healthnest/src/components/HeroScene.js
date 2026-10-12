"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// A heartbeat (ECG) trace drawn as soft ribbons in 3D, with a little drifting dust.
// Rules followed: three.js is loaded only when the hero is on screen, rendering pauses when the hero is
// off-screen or the tab is hidden, the pixel ratio is capped, everything is disposed on unmount,
// and reduced-motion or weak devices get a single still frame instead of an animation.

const POINTS = 220; // samples along each ribbon
const HALF_WIDTH = 9; // world units from the centre to each side
const PERIOD = 7; // distance between heartbeats

const bump = (u, m, s) => Math.exp(-((u - m) * (u - m)) / (2 * s * s));
// One heartbeat, drawn with a few gaussian bumps: P wave, Q dip, R spike, S dip, T wave.
function beat(u) {
  return (
    0.16 * bump(u, 0.16, 0.035) -
    0.14 * bump(u, 0.3, 0.012) +
    1.0 * bump(u, 0.34, 0.011) -
    0.3 * bump(u, 0.385, 0.014) +
    0.26 * bump(u, 0.58, 0.055)
  );
}

export default function HeroScene({ className = "" }) {
  const hostRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let teardown = () => {};

    (async () => {
      let THREE;
      try {
        THREE = await import("three");
      } catch {
        return; // network failure: the static fallback line stays
      }
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const weakDevice = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
      const animate = !reduceMotion && !weakDevice;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: keep the static fallback
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.domElement.className = "hero-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
      camera.position.set(0, 0.2, 9.5);
      const group = new THREE.Group();
      scene.add(group);

      // Colours come from CSS variables on the tile that hosts the scene (--scene-line, --scene-accent).
      const css = getComputedStyle(host);
      const lineColor = new THREE.Color(css.getPropertyValue("--scene-line").trim() || "#cfcdf2");
      const accentColor = new THREE.Color(css.getPropertyValue("--scene-accent").trim() || "#ffffff");

      // --- ribbons: a thin triangle strip per layer, rebuilt every frame ---
      const layers = [
        { z: 0, width: 0.05, alpha: 0.95, color: accentColor, phase: 0, speed: 1, scale: 1, y: 0 },
        { z: -1.2, width: 0.03, alpha: 0.55, color: lineColor, phase: 1.7, speed: 0.8, scale: 0.8, y: 0.35 },
        { z: -2.6, width: 0.025, alpha: 0.35, color: lineColor, phase: 3.9, speed: 0.65, scale: 0.65, y: -0.45 },
        { z: -4.2, width: 0.02, alpha: 0.2, color: lineColor, phase: 5.6, speed: 0.5, scale: 0.5, y: 0.9 },
      ].map((cfg) => {
        const positions = new Float32Array(POINTS * 2 * 3);
        const colors = new Float32Array(POINTS * 2 * 4);
        const index = [];
        for (let i = 0; i < POINTS - 1; i++) {
          const a = i * 2;
          index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        for (let i = 0; i < POINTS; i++) {
          const edge = Math.sin((i / (POINTS - 1)) * Math.PI); // fades both ends to transparent
          const alpha = cfg.alpha * Math.pow(edge, 0.8);
          for (let k = 0; k < 2; k++) {
            const o = (i * 2 + k) * 4;
            colors[o] = cfg.color.r;
            colors[o + 1] = cfg.color.g;
            colors[o + 2] = cfg.color.b;
            colors[o + 3] = alpha;
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
        geometry.setIndex(index);
        const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = cfg.z;
        group.add(mesh);
        return { ...cfg, positions, geometry, material, mesh };
      });

      function updateRibbons(t) {
        for (const L of layers) {
          const p = L.positions;
          for (let i = 0; i < POINTS; i++) {
            const x = -HALF_WIDTH + (i / (POINTS - 1)) * HALF_WIDTH * 2;
            const u = (((x - t * L.speed * 1.4 - L.phase) % PERIOD) + PERIOD) % PERIOD / PERIOD;
            const drift = Math.sin(x * 0.35 + t * 0.4 + L.phase) * 0.06;
            const y = L.y + (beat(u) * 1.25 * L.scale) + drift;
            const o = i * 6;
            p[o] = x; p[o + 1] = y + L.width; p[o + 2] = 0;
            p[o + 3] = x; p[o + 4] = y - L.width; p[o + 5] = 0;
          }
          L.geometry.attributes.position.needsUpdate = true;
        }
      }

      // --- dust ---
      const DUST = 90;
      const dustPos = new Float32Array(DUST * 3);
      const dustSeed = new Float32Array(DUST * 2);
      for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * HALF_WIDTH * 2;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        dustPos[i * 3 + 2] = -Math.random() * 5;
        dustSeed[i * 2] = Math.random() * 6.28;
        dustSeed[i * 2 + 1] = 0.2 + Math.random() * 0.5;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({ color: lineColor, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
      const dust = new THREE.Points(dustGeo, dustMat);
      group.add(dust);

      function updateDust(t) {
        const p = dustGeo.attributes.position.array;
        for (let i = 0; i < DUST; i++) {
          p[i * 3 + 1] += Math.sin(t * dustSeed[i * 2 + 1] + dustSeed[i * 2]) * 0.0015;
          p[i * 3] += 0.0025 * dustSeed[i * 2 + 1];
          if (p[i * 3] > HALF_WIDTH) p[i * 3] = -HALF_WIDTH;
        }
        dustGeo.attributes.position.needsUpdate = true;
      }

      // --- sizing ---
      function resize() {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Pull the camera back just enough that about 14 world units of the trace fit, whatever shape the tile is.
        camera.position.z = Math.min(24, Math.max(9.5, 14 / (0.6887 * camera.aspect)));
        camera.updateProjectionMatrix();
        if (!animate) renderStill();
      }
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // --- mouse parallax (fine pointers only), smoothed with GSAP quickTo ---
      let rotY, rotX;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const onMove = (e) => {
        const r = host.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        rotY?.(nx * 0.18);
        rotX?.(ny * 0.08);
      };
      if (animate && fine) {
        rotY = gsap.quickTo(group.rotation, "y", { duration: 1, ease: "power3.out" });
        rotX = gsap.quickTo(group.rotation, "x", { duration: 1, ease: "power3.out" });
        window.addEventListener("pointermove", onMove, { passive: true });
      }

      // --- loop: runs only while visible ---
      let visible = true;
      const startedAt = performance.now();
      function frame() {
        const t = (performance.now() - startedAt) / 1000;
        updateRibbons(t);
        updateDust(t);
        renderer.render(scene, camera);
      }
      function renderStill() {
        updateRibbons(1.4);
        renderer.render(scene, camera);
      }
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
      io.observe(host);
      const onVisibility = () => sync();
      document.addEventListener("visibilitychange", onVisibility);
      function sync() {
        if (animate && visible && !document.hidden) renderer.setAnimationLoop(frame);
        else renderer.setAnimationLoop(null);
      }

      resize();
      if (animate) sync();
      else renderStill();

      // Fade the real scene in over the static fallback line.
      gsap.fromTo(renderer.domElement, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduceMotion ? 0 : 0.9, ease: "power2.out" });
      if (fallbackRef.current) gsap.to(fallbackRef.current, { autoAlpha: 0, duration: reduceMotion ? 0 : 0.9 });

      teardown = () => {
        renderer.setAnimationLoop(null);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pointermove", onMove);
        gsap.killTweensOf(group.rotation);
        gsap.killTweensOf(renderer.domElement);
        for (const L of layers) { L.geometry.dispose(); L.material.dispose(); }
        dustGeo.dispose();
        dustMat.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      };
      if (disposed) teardown();
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, []);

  return (
    <div ref={hostRef} className={`hero-scene ${className}`} aria-hidden="true">
      {/* Static line shown until the 3D scene is ready, or forever if WebGL is unavailable. */}
      <svg ref={fallbackRef} className="hero-fallback" viewBox="0 0 800 200" preserveAspectRatio="none">
        <path d="M0 110 H210 l16 -6 l14 6 H290 l14 14 l16 -92 l16 120 l14 -40 H420 l30 -12 l30 12 H800" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
