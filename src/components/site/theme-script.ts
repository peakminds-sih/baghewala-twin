// The stored theme choice and the script that applies it before first paint,
// so the page never flashes the wrong theme. With no stored choice the page
// follows the system setting, and keeps following it when it changes.

export const THEME_STORAGE_KEY = "theme";

export const THEME_SCRIPT = `(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const stored = () => { try { return localStorage.getItem("${THEME_STORAGE_KEY}"); } catch { return null; } };
  const apply = () => {
    const choice = stored();
    root.classList.toggle("dark", choice === "dark" || (choice !== "light" && media.matches));
  };
  apply();
  media.addEventListener("change", apply);
})();`;
