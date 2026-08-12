// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ThemePanel.jsx
//  Slide-in panel: preset picker, accent color, font, border radius
// ─────────────────────────────────────────────────────────────────────────────

import { useTheme } from "../context/ThemeContext";

export default function ThemePanel({ open, onClose }) {
  const { T, preset, setPreset, customAccent, setCustomAccent, font, setFont, radius, setRadius, PRESETS, FONTS } = useTheme();
  if (!open) return null;

  const sec = (label) => (
    <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "20px 0 10px" }}>
      {label}
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.surface, borderLeft: `1px solid ${T.border}`, width: 300, minHeight: "100vh", padding: "28px 24px", overflowY: "auto", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>🎨 Theme</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ color: T.muted, fontSize: 12 }}>Saved automatically</div>

        {/* Presets */}
        {sec("Preset")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(PRESETS).map(([name, p]) => (
            <button
              key={name}
              onClick={() => { setPreset(name); setCustomAccent(""); }}
              style={{ background: p.card, border: `2px solid ${preset === name ? T.accent : p.border}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "left", transition: "border .15s" }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[p.accent, p.green, p.red, p.bg].map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: `1px solid ${p.border}` }} />
                ))}
              </div>
              <div style={{ color: p.text, fontSize: 12, fontWeight: 600 }}>{name}</div>
            </button>
          ))}
        </div>

        {/* Accent color */}
        {sec("Accent Color")}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="color"
            value={customAccent || PRESETS[preset]?.accent || "#6c63ff"}
            onChange={(e) => setCustomAccent(e.target.value)}
            style={{ width: 44, height: 44, border: "none", borderRadius: 8, cursor: "pointer", background: "none", padding: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{customAccent || PRESETS[preset]?.accent}</div>
            <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>Click swatch to pick</div>
          </div>
          {customAccent && (
            <button onClick={() => setCustomAccent("")} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.textDim, fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>
              Reset
            </button>
          )}
        </div>

        {/* Font */}
        {sec("Font")}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.keys(FONTS).map((f) => (
            <button
              key={f}
              onClick={() => setFont(f)}
              style={{ background: font === f ? T.card : "none", border: `1px solid ${font === f ? T.accent : T.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", color: T.text, fontSize: 14, fontFamily: FONTS[f], transition: "border .15s" }}
            >
              {f} <span style={{ color: T.muted, fontSize: 12, fontFamily: "sans-serif" }}>— Aa Bb 123</span>
            </button>
          ))}
        </div>

        {/* Border radius */}
        {sec("Border Radius")}
        <input
          type="range" min={0} max={24} step={2} value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ accentColor: T.accent, width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", color: T.muted, fontSize: 11, margin: "4px 0 10px" }}>
          <span>Sharp</span>
          <span style={{ color: T.textDim }}>{radius}px</span>
          <span>Rounded</span>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: radius, padding: "10px 16px", color: T.textDim, fontSize: 13, textAlign: "center" }}>
          Preview
        </div>

        {/* Reset */}
        <button
          onClick={() => { setPreset("Dark"); setCustomAccent(""); setFont("Inter"); setRadius(12); }}
          style={{ marginTop: 28, width: "100%", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, padding: "10px", fontSize: 13, cursor: "pointer" }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
