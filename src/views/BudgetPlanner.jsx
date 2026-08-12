// ─────────────────────────────────────────────────────────────────────────────
//  src/views/BudgetPlanner.jsx
//  Set monthly budgets per category, track spending, get alerts when near limit
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getFirebase } from "../services/firebase";
import { CATEGORIES, INCOME_CATS, fmt } from "../services/constants";

const EXPENSE_CATS = CATEGORIES.filter((c) => !INCOME_CATS.has(c));

export default function BudgetPlanner() {
  const { T } = useTheme();
  const { transactions } = useApp();
  const { user } = useAuth();

  const [budgets, setBudgets] = useState({});        // { category: amount }
  const [editing, setEditing] = useState(null);      // category being edited
  const [draftVal, setDraftVal] = useState("");
  const [saving, setSaving] = useState(false);

  const R = Math.min(T.radius * 0.6, 10);

  // ── Load budgets from Firestore ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { db } = await getFirebase();
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "users", user.uid, "settings", "budgets"));
      if (snap.exists()) setBudgets(snap.data());
    })();
  }, [user]);

  // ── Save budgets to Firestore ────────────────────────────────────────────
  const saveBudget = async (category, value) => {
    const num = parseFloat(value);
    const updated = { ...budgets };
    if (!num || num <= 0) delete updated[category];
    else updated[category] = num;
    setSaving(true);
    setBudgets(updated);
    const { db } = await getFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "users", user.uid, "settings", "budgets"), updated);
    setSaving(false);
    setEditing(null);
  };

  // ── Current month spending per category ──────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);
  const spent = transactions
    .filter((t) => t.date?.startsWith(currentMonth) && !INCOME_CATS.has(t.category))
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0);
  const alerts = EXPENSE_CATS.filter((c) => budgets[c] && (spent[c] || 0) / budgets[c] >= 0.8);

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20 };
  const lbl = { color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header summary */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Total Budget", value: totalBudget, color: T.accent },
          { label: "Spent This Month", value: totalSpent, color: totalSpent > totalBudget ? T.red : T.text },
          { label: "Remaining", value: Math.max(0, totalBudget - totalSpent), color: T.green },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...card, flex: 1, minWidth: 160 }}>
            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ color, fontSize: 24, fontWeight: 700, fontFamily: T.mono }}>{fmt(value)}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid ${T.red}`, borderRadius: T.radius, padding: 16 }}>
          <div style={{ color: T.red, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚠ Budget Alerts</div>
          {alerts.map((c) => {
            const pct = Math.round(((spent[c] || 0) / budgets[c]) * 100);
            return (
              <div key={c} style={{ color: T.text, fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: pct >= 100 ? T.red : "#f59e0b", fontWeight: 600 }}>
                  {pct >= 100 ? "🔴 Over budget" : "🟡 Near limit"}
                </span>
                {" — "}{c}: {fmt(spent[c] || 0)} / {fmt(budgets[c])} ({pct}%)
              </div>
            );
          })}
        </div>
      )}

      {/* Per-category budget rows */}
      <div style={card}>
        <div style={lbl}>Monthly Budgets — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</div>
        {saving && <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>Saving…</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {EXPENSE_CATS.map((cat) => {
            const budget = budgets[cat] || 0;
            const spentAmt = spent[cat] || 0;
            const pct = budget > 0 ? Math.min((spentAmt / budget) * 100, 100) : 0;
            const over = budget > 0 && spentAmt > budget;
            const barColor = pct >= 100 ? T.red : pct >= 80 ? "#f59e0b" : T.green;

            return (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{cat}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: over ? T.red : T.textDim, fontSize: 13, fontFamily: T.mono }}>
                      {fmt(spentAmt)}{budget > 0 ? ` / ${fmt(budget)}` : ""}
                    </span>
                    {editing === cat ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          autoFocus
                          type="number" min="0"
                          value={draftVal}
                          onChange={(e) => setDraftVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveBudget(cat, draftVal); if (e.key === "Escape") setEditing(null); }}
                          style={{ width: 90, background: T.bg, border: `1px solid ${T.accent}`, borderRadius: R, color: T.text, padding: "4px 8px", fontSize: 13, outline: "none", fontFamily: T.mono }}
                          placeholder="₹ amount"
                        />
                        <button onClick={() => saveBudget(cat, draftVal)} style={{ background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                        <button onClick={() => setEditing(null)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: R, color: T.muted, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditing(cat); setDraftVal(budget || ""); }}
                        style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: R, color: T.textDim, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                      >
                        {budget ? "Edit" : "Set"}
                      </button>
                    )}
                  </div>
                </div>
                {budget > 0 && (
                  <div style={{ height: 6, background: T.surface, borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
