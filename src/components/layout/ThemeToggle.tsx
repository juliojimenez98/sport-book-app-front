"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui";
import { useEffect, useState, useContext } from "react";

// Import ThemeContext directly to handle missing provider gracefully
import { ThemeContext } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [localTheme, setLocalTheme] = useState<"light" | "dark">("light");
  
  // Try to get theme context, but don't throw if not available
  const themeContext = useContext(ThemeContext);

  useEffect(() => {
    setMounted(true);
    // If no context, check document class or localStorage
    if (!themeContext) {
      const saved = localStorage.getItem("booking-theme");
      if (saved === "dark" || saved === "light") {
        setLocalTheme(saved);
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        setLocalTheme(isDark ? "dark" : "light");
      }
    }
  }, [themeContext]);

  const handleToggle = () => {
    if (themeContext) {
      themeContext.toggleTheme();
    } else {
      // Fallback toggle without context
      const newTheme = localTheme === "light" ? "dark" : "light";
      setLocalTheme(newTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newTheme);
      localStorage.setItem("booking-theme", newTheme);
    }
  };

  const currentTheme = themeContext?.resolvedTheme ?? localTheme;

  // Evitar hidratación incorrecta mostrando un placeholder durante SSR
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {currentTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
