import { describe, it, expect } from "vitest";
import { resolveTheme, THEME_BOOT_SCRIPT, THEME_KEY } from "@/lib/theme";

describe("resolveTheme", () => {
  it("uses a saved choice over the system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("follows the system setting when nothing is saved", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme(undefined, true)).toBe("dark");
  });
  it("ignores junk in storage", () => {
    for (const junk of ["", "system", "DARK", "blue", "{}", "undefined"]) {
      expect(resolveTheme(junk, false)).toBe("light");
      expect(resolveTheme(junk, true)).toBe("dark");
    }
  });
});

// Runs the exact script that goes in <head>, against a pretend browser.
function boot({ stored, systemDark, storageThrows = false, matchMediaThrows = false }) {
  const attrs = {};
  const documentElement = { setAttribute: (k, v) => { attrs[k] = v; } };
  const localStorage = {
    getItem: (k) => {
      if (storageThrows) throw new Error("blocked");
      return k === THEME_KEY ? stored ?? null : null;
    },
  };
  const matchMedia = (q) => {
    if (matchMediaThrows) throw new Error("unsupported");
    return { matches: q.includes("dark") ? systemDark : false };
  };
  new Function("document", "localStorage", "matchMedia", THEME_BOOT_SCRIPT)({ documentElement }, localStorage, matchMedia);
  return attrs["data-theme"];
}

describe("pre-paint boot script", () => {
  it("agrees with resolveTheme for every combination", () => {
    for (const stored of [null, "light", "dark", "junk"]) {
      for (const systemDark of [true, false]) {
        expect(boot({ stored, systemDark })).toBe(resolveTheme(stored, systemDark));
      }
    }
  });
  it("still picks the system theme when storage is blocked", () => {
    expect(boot({ storageThrows: true, systemDark: true })).toBe("dark");
    expect(boot({ storageThrows: true, systemDark: false })).toBe("light");
  });
  it("falls back to light if nothing works, and never throws", () => {
    expect(boot({ storageThrows: true, matchMediaThrows: true, systemDark: true })).toBe("light");
  });
  it("is a single self-contained script with no template leftovers", () => {
    expect(THEME_BOOT_SCRIPT).not.toMatch(/\$\{|undefined/);
    expect(THEME_BOOT_SCRIPT.startsWith("(function(){")).toBe(true);
  });
});
