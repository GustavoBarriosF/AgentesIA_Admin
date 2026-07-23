"use client";

import { useEffect } from "react";
import { useWorkspace } from "@/lib/hooks/useWorkspace";

/** Convert a 6-digit hex color to HSL components string "H S% L%" */
function hexToHSL(hex: string): string | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyVar(name: string, hex: string | undefined | null) {
  if (!hex) return;
  const hsl = hexToHSL(hex);
  if (hsl) document.documentElement.style.setProperty(name, hsl);
}

/**
 * Reads workspace branding and injects CSS custom properties into :root.
 * Must be rendered inside a component that has access to the workspace query.
 */
export function WorkspaceTheme() {
  const { data: workspace } = useWorkspace();

  useEffect(() => {
    if (!workspace?.branding) return;
    const { primary_color, secondary_color, text_color, icon_color } = workspace.branding;

    applyVar("--primary", primary_color);
    applyVar("--ring", primary_color);
    applyVar("--icon", icon_color ?? primary_color);
    applyVar("--secondary", secondary_color);
    applyVar("--foreground", text_color);
    applyVar("--card-foreground", text_color);
    applyVar("--popover-foreground", text_color);

    // accent tint = primary at very low opacity (keep accent readable)
    if (primary_color) {
      const hsl = hexToHSL(primary_color);
      if (hsl) {
        const [h, s] = hsl.split(" ");
        document.documentElement.style.setProperty("--accent", `${h} ${s} 97%`);
        document.documentElement.style.setProperty("--accent-foreground", hsl);
      }
    }
  }, [workspace?.branding]);

  return null;
}
