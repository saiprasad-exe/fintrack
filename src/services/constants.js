// ─────────────────────────────────────────────────────────────────────────────
//  src/services/constants.js
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Food", "Transport", "Housing", "Health",
  "Entertainment", "Shopping", "Salary", "Freelance", "Other",
];

export const INCOME_CATS = new Set(["Salary", "Freelance"]);

export const PALETTE = [
  "#6c63ff", "#22c55e", "#f59e0b", "#ef4444",
  "#38bdf8", "#a78bfa", "#fb7185", "#34d399", "#fbbf24",
];

export const PRESETS = {
  "Dark":      { bg:"#0f1117", surface:"#1a1d27", card:"#20243a", border:"#2a2f4a", accent:"#6c63ff", green:"#22c55e", red:"#ef4444", muted:"#64748b", text:"#e2e8f0", textDim:"#94a3b8" },
  "Light":     { bg:"#f8fafc", surface:"#ffffff", card:"#f1f5f9", border:"#e2e8f0", accent:"#6c63ff", green:"#16a34a", red:"#dc2626", muted:"#94a3b8", text:"#0f172a",  textDim:"#475569" },
  "Ocean":     { bg:"#0a1628", surface:"#0f2040", card:"#162a50", border:"#1e3a6a", accent:"#38bdf8", green:"#34d399", red:"#f87171", muted:"#4a6080", text:"#e0f2fe",  textDim:"#7fb5d5" },
  "Solarized": { bg:"#002b36", surface:"#073642", card:"#0a4050", border:"#144552", accent:"#2aa198", green:"#859900", red:"#dc322f", muted:"#586e75", text:"#fdf6e3",  textDim:"#93a1a1" },
  "Rose":      { bg:"#1a0a0f", surface:"#2a1018", card:"#3a1a25", border:"#5a2a3a", accent:"#fb7185", green:"#4ade80", red:"#f43f5e", muted:"#7a4a55", text:"#ffe4e6",  textDim:"#fda4af" },
  "Forest":    { bg:"#0a1a0f", surface:"#0f2a18", card:"#163a20", border:"#1e5230", accent:"#4ade80", green:"#86efac", red:"#f87171", muted:"#3a6045", text:"#dcfce7",  textDim:"#86efac" },
};

export const FONTS = {
  "Inter":     "'Inter', system-ui, sans-serif",
  "Poppins":   "'Poppins', system-ui, sans-serif",
  "DM Sans":   "'DM Sans', system-ui, sans-serif",
  "Roboto":    "'Roboto', system-ui, sans-serif",
  "Fira Code": "'Fira Code', monospace",
};

export const MONO = "'JetBrains Mono', 'Fira Code', monospace";

export const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential":   "Invalid email or password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
