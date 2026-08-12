// ─────────────────────────────────────────────────────────────────────────────
//  src/views/SavingsGoals.jsx
//  Create savings goals with targets + deadlines, add contributions, track progress
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getFirebase } from "../services/firebase";
import { fmt } from "../services/constants";

const GOAL_ICONS = ["🏠","🚗","✈️","🎓","💍","🏥","💻","📱","🎮","🌴","💰","🎯"];

export default function SavingsGoals() {
  const { T } = useTheme();
  const { user } = useAuth();

  const [goals, setGoals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [contribGoal, setContribGoal] = useState(null); // goal id
  const [contribAmt, setContribAmt] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", target: "", deadline: "", icon: "🎯", color: "#6c63ff" });

  const R = Math.min(T.radius * 0.6, 10);

  // ── Firestore helpers ────────────────────────────────────────────────────
  const col = async () => {
    const { db } = await getFirebase();
    const { collection } = await import("firebase/firestore");
    return collection(db, "users", user.uid, "goals");
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { db } = await getFirebase();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return unsub;
    })();
  }, [user]);

  const addGoal = async () => {
    if (!form.name || !form.target) return;
    const { db } = await getFirebase();
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "users", user.uid, "goals"), {
      name: form.name,
      target: parseFloat(form.target),
      saved: 0,
      deadline: form.deadline || null,
      icon: form.icon,
      color: form.color,
      createdAt: serverTimestamp(),
    });
    setForm({ name: "", target: "", deadline: "", icon: "🎯", color: "#6c63ff" });
    setShowAdd(false);
  };

  const addContribution = async (goalId, current) => {
    const amt = parseFloat(contribAmt);
    if (!amt || amt <= 0) return;
    const { db } = await getFirebase();
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", user.uid, "goals", goalId), { saved: current + amt });
    setContribGoal(null);
    setContribAmt("");
  };

  const deleteGoal = async (id) => {
    const { db } = await getFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", user.uid, "goals", id));
  };

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    return diff;
  };

  const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: R, color: T.text, padding: "9px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: T.sans };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Savings Goals</h2>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{goals.length} goal{goals.length !== 1 ? "s" : ""} active</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + New Goal
        </button>
      </div>

      {/* Add goal modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 28, width: 440, maxWidth: "95vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: T.text, margin: 0, fontSize: 17 }}>New Savings Goal</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            {/* Icon picker */}
            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Icon</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {GOAL_ICONS.map((ic) => (
                <button key={ic} onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  style={{ fontSize: 20, background: form.icon === ic ? T.accent + "33" : T.bg, border: `2px solid ${form.icon === ic ? T.accent : T.border}`, borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>

            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Goal Name</div>
            <input style={{ ...inp, marginBottom: 14 }} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Target Amount (₹)</div>
                <input style={inp} type="number" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Deadline (optional)</div>
                <input style={inp} type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>

            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Color</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["#6c63ff","#22c55e","#f59e0b","#ef4444","#38bdf8","#fb7185","#a78bfa","#34d399"].map((c) => (
                <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{ width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${form.color === c ? T.text : "transparent"}`, boxSizing: "border-box" }} />
              ))}
            </div>

            <button onClick={addGoal} style={{ width: "100%", background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>Loading…</div>
      ) : goals.length === 0 ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60, fontSize: 14 }}>No goals yet. Create your first savings goal!</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {goals.map((g) => {
            const pct = Math.min((g.saved / g.target) * 100, 100);
            const remaining = g.target - g.saved;
            const days = daysLeft(g.deadline);
            const done = g.saved >= g.target;

            return (
              <div key={g.id} style={{ background: T.card, border: `1px solid ${done ? g.color : T.border}`, borderRadius: T.radius, padding: 20, position: "relative" }}>
                {/* Delete */}
                <button onClick={() => deleteGoal(g.id)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14 }}>🗑</button>

                {/* Icon + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 28 }}>{g.icon}</div>
                  <div>
                    <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>{g.name}</div>
                    {days !== null && (
                      <div style={{ color: days < 0 ? T.red : days < 30 ? "#f59e0b" : T.muted, fontSize: 12, marginTop: 2 }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: T.textDim, fontSize: 12 }}>Saved</span>
                  <span style={{ color: T.textDim, fontSize: 12 }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: T.surface, borderRadius: 99, marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: done ? T.green : g.color, borderRadius: 99, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ color: g.color, fontWeight: 700, fontFamily: T.mono, fontSize: 15 }}>{fmt(g.saved)}</span>
                  <span style={{ color: T.textDim, fontFamily: T.mono, fontSize: 13 }}>of {fmt(g.target)}</span>
                </div>

                {done ? (
                  <div style={{ background: T.green + "22", border: `1px solid ${T.green}`, borderRadius: R, padding: "8px", textAlign: "center", color: T.green, fontWeight: 700, fontSize: 13 }}>
                    🎉 Goal Achieved!
                  </div>
                ) : contribGoal === g.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input autoFocus type="number" value={contribAmt} onChange={(e) => setContribAmt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addContribution(g.id, g.saved); if (e.key === "Escape") setContribGoal(null); }}
                      style={{ flex: 1, background: T.bg, border: `1px solid ${T.accent}`, borderRadius: R, color: T.text, padding: "8px 10px", fontSize: 13, outline: "none" }}
                      placeholder="Add amount (₹)" />
                    <button onClick={() => addContribution(g.id, g.saved)} style={{ background: g.color, border: "none", borderRadius: R, color: "#fff", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>Add</button>
                  </div>
                ) : (
                  <button onClick={() => { setContribGoal(g.id); setContribAmt(""); }}
                    style={{ width: "100%", background: "none", border: `1px solid ${g.color}`, borderRadius: R, color: g.color, padding: "8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    + Add {remaining > 0 ? `(${fmt(remaining)} to go)` : "contribution"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
