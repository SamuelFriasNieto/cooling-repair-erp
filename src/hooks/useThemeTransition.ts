"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function useThemeTransition() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-smooth-transition");
    
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    setTimeout(() => {
      document.documentElement.classList.remove("theme-smooth-transition");
    }, 250);
  };

  return { theme, toggleTheme };
}
