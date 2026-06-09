import { Moon, Sun } from "lucide-react";

import { useTheme } from "./themeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-ink-700 transition hover:border-rust-500 hover:text-rust-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rust-500 dark:hover:text-rust-500"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={18} />
      ) : (
        <Moon aria-hidden="true" size={18} />
      )}
    </button>
  );
}
