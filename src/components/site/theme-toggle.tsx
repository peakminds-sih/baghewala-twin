"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./theme-script";

// Switches between light and dark and stores the choice. The icon comes from
// the .dark class, so the server and client render the same markup.
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Storage can be blocked. The switch still works for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[4px] text-ink transition-colors duration-100 ease-out hover:bg-panel",
        className,
      )}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-[18px] dark:block" aria-hidden="true" />
    </button>
  );
}
