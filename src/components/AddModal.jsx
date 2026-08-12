// ─────────────────────────────────────────────────────────────────────────────
//  src/components/AddModal.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { CATEGORIES } from "../services/constants";

export default function AddModal({ open, onClose }) {
  const { T } = useTheme();
  const { addTransaction } = useApp();

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });
  const [err, setErr] = useState("");

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.description.trim()) return setErr("Description is required.");
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return setErr("Enter a valid positive amount.");
    setErr("");
    await addTransaction({ ...form, amount: amt });
    setForm({ description: "", amount: "", category: "Food", date: new Date().toISOString().slice(0, 10) });
    onClose();
  };

  const inp = {
    width: "100%", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: T.radius * 0.6, color: T.text, padding: "10px 12px",
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: T.sans,
  };

  const lbl = (text) => (
    <div style={{ color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, marginTop: 16 }}>
      {text}
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 32, width: 420, maxWidth: "95vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, color: T.text, fontSize: 18 }}>Add Transaction</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {err && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}`, borderRadius: 8, padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>
            {err}
          </div>
        )}

        {lbl("Description")}
        <input style={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Grocery run" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
          <div>
            {lbl("Amount (₹)")}
            <input style={inp} type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />
          </div>
          <div>
            {lbl("Date")}
            <input style={inp} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
        </div>

        {lbl("Category")}
        <select style={{ ...inp, cursor: "pointer" }} value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <button
          onClick={submit}
          style={{ marginTop: 24, width: "100%", background: T.accent, border: "none", borderRadius: T.radius * 0.6, color: "#fff", padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
        >
          Save Transaction
        </button>
      </div>
    </div>
  );
}
