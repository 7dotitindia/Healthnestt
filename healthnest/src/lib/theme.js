// Light / dark theme logic, shared by the pre-paint script, the toggle button and the tests.
export const THEME_KEY = "hn_theme";
export const THEME_COLORS = { light: "#ffffff", dark: "#121214" };

// A saved choice wins. With no saved choice, follow the system setting.
export function resolveTheme(stored, systemPrefersDark) {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersDark ? "dark" : "light";
}

// Runs in <head> before the page paints, so there is no flash of the wrong theme.
// Kept as a string because it has to run before any JavaScript bundle loads. It repeats resolveTheme on purpose;
// a test runs this exact string and checks it agrees with resolveTheme.
export const THEME_BOOT_SCRIPT =
  "(function(){var d=document.documentElement,t='light';try{var s=localStorage.getItem('" + THEME_KEY + "');" +
  "t=(s==='light'||s==='dark')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){" +
  "try{t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e2){}}d.setAttribute('data-theme',t)})()";
