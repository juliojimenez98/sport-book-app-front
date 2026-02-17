"use client";

import { useEffect } from "react";
import { Tenant } from "@/lib/types";

// Convert hex to RGB values for CSS variables (matches globals.css format: "R G B")
function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || !hex.startsWith("#")) return null;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

interface TenantThemeProviderProps {
  tenant?: Tenant | null;
  children: React.ReactNode;
}

export function TenantThemeProvider({
  tenant,
  children,
}: TenantThemeProviderProps) {
  useEffect(() => {
    if (!tenant) {
      // Remove custom styles when no tenant
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--secondary");
      document.documentElement.style.removeProperty("--accent");
      return;
    }

    // Apply primary color
    if (tenant.primaryColor) {
      const rgb = hexToRGB(tenant.primaryColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--primary",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }

    // Apply secondary color
    if (tenant.secondaryColor) {
      const rgb = hexToRGB(tenant.secondaryColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--secondary",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }

    // Apply accent color
    if (tenant.accentColor) {
      const rgb = hexToRGB(tenant.accentColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--accent",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }

    // Cleanup on unmount or tenant change
    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--secondary");
      document.documentElement.style.removeProperty("--accent");
    };
  }, [tenant]);

  return <>{children}</>;
}

// Hook to apply tenant theme imperatively
export function useTenantTheme() {
  const applyTheme = (tenant: Tenant | null) => {
    if (!tenant) {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--secondary");
      document.documentElement.style.removeProperty("--accent");
      return;
    }

    if (tenant.primaryColor) {
      const rgb = hexToRGB(tenant.primaryColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--primary",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }

    if (tenant.secondaryColor) {
      const rgb = hexToRGB(tenant.secondaryColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--secondary",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }

    if (tenant.accentColor) {
      const rgb = hexToRGB(tenant.accentColor);
      if (rgb) {
        document.documentElement.style.setProperty(
          "--accent",
          `${rgb.r} ${rgb.g} ${rgb.b}`,
        );
      }
    }
  };

  const clearTheme = () => {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--secondary");
    document.documentElement.style.removeProperty("--accent");
  };

  return { applyTheme, clearTheme };
}
