"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_KEY, THEME_COLORS, resolveTheme } from "@/lib/theme";

// The page's theme lives on <html data-theme="...">. This button reads it, flips it, and remembers the choice.
const subscribe = (cb) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};
const getSnapshot = () => document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
const getServerSnapshot = () => "light";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Keep the mobile browser's address-bar colour in step with the chosen theme.
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute("media");
    m.setAttribute("content", THEME_COLORS[theme]);
  });
}

export default function ThemeToggle({ className }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Until the visitor makes a choice, keep following the system setting if it changes.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let stored = null;
      try { stored = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
      if (!stored) applyTheme(resolveTheme(null, mq.matches));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next = theme === "dark" ? "light" : "dark";
  function toggle() {
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked: the choice lasts for this visit only */ }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
