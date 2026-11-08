"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);
const STORAGE_KEY = "fleetdesk-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerTheme = (): Theme => "light";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggleTheme = useCallback(() => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

export const themeInitScript = `
try {
  var saved = localStorage.getItem("${STORAGE_KEY}");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (!saved && prefersDark)) document.documentElement.classList.add("dark");
} catch (e) {}
`;
