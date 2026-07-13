"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "financeflow:theme";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);

  const apply = useCallback((m: ThemeMode) => {
    const dark = m === "dark" || (m === "system" && systemDark());
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
    setModeState(saved);
    apply(saved);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const cur = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
      if (cur === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      localStorage.setItem(THEME_KEY, m);
      apply(m);
    },
    [apply]
  );

  const toggle = useCallback(() => {
    setMode(isDark ? "light" : "dark");
  }, [isDark, setMode]);

  return <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Script inline anti-FOUC (roda antes da hidratação) */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
