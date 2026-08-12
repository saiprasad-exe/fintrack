// ─────────────────────────────────────────────────────────────────────────────
//  src/components/UI.jsx
//  Shared primitive components: Toast, StatCard, ChartCard
// ─────────────────────────────────────────────────────────────────────────────

import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { fmt } from "../services/constants";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1300,
      background: toast.color, color: "#fff",
      borderRadius: 10, padding: "12px 20px",
      fontSize: 14, fontWeight: 600,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    }}>
      {toast.msg}
    </div>
  );
}

export function StatCard({ label, value, color, sub }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: "20px 24px",
      flex: 1, minWidth: 160,
    }}>
      <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: color || T.text, fontSize: 24, fontWeight: 700, fontFamily: T.mono }}>
        {fmt(value)}
      </div>
      {sub && <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function ChartCard({ title, children, empty }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: T.radius, padding: 20,
    }}>
      <div style={{ color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
        {title}
      </div>
      {empty
        ? <div style={{ color: T.muted, textAlign: "center", padding: "40px 0" }}>{empty}</div>
        : children
      }
    </div>
  );
}
