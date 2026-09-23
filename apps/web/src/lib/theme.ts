import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const stored = (): Theme | null => {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
};

const system = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const apply = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

// Runs before React renders so the first paint is already the right colour.
export const initTheme = () => apply(stored() ?? system());

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? system());

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return { theme, toggle };
};
