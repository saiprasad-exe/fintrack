// ─────────────────────────────────────────────────────────────────────────────
//  src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import { PRESETS, FONTS, MONO } from "../services/constants";

const ThemeCtx = createContext(null);

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }) {
  const [preset, setPreset]             = useState(() => localStorage.getItem("ft_preset") || "Dark");
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem("ft_accent") || "");
  const [font, setFont]                 = useState(() => localStorage.getItem("ft_font") || "Inter");
  const [radius, setRadius]             = useState(() => Number(localStorage.getItem("ft_radius") ?? 12));

  useEffect(() => { localStorage.setItem("ft_preset", preset); }, [preset]);
  useEffect(() => { localStorage.setItem("ft_accent", customAccent); }, [customAccent]);
  useEffect(() => { localStorage.setItem("ft_font", font); }, [font]);
  useEffect(() => { localStorage.setItem("ft_radius", radius); }, [radius]);

  const base = PRESETS[preset] || PRESETS["Dark"];
  const T = {
    ...base,
    accent: customAccent || base.accent,
    sans:   FONTS[font] || FONTS["Inter"],
    mono:   MONO,
    radius,
  };

  return (
    <ThemeCtx.Provider value={{ T, preset, setPreset, customAccent, setCustomAccent, font, setFont, radius, setRadius, PRESETS, FONTS }}>
      {children}
    </ThemeCtx.Provider>
  );
}
