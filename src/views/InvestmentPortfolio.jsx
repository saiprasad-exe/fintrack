// ─────────────────────────────────────────────────────────────────────────────
//  src/views/InvestmentPortfolio.jsx
//  Track stocks, mutual funds, and crypto holdings with P&L calculations
//  Uses Yahoo Finance (via allorigins proxy) for live prices where available
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getFirebase } from "../services/firebase";
import { fmt } from "../services/constants";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const ASSET_TYPES = ["Stock", "Mutual Fund", "Crypto", "ETF", "Bond", "Other"];
const PALETTE = ["#6c63ff","#22c55e","#f59e0b","#ef4444","#38bdf8","#a78bfa"];

// Fetch price via Yahoo Finance (works for NSE: RELIANCE.NS, crypto: BTC-USD, US: AAPL)
async function fetchPrice(symbol) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/stock/${encodeURIComponent(symbol)}`
    );

    const data = await res.json();

    if (data.success) {
      return data.price;
    }

    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default function InvestmentPortfolio() {
  const { T } = useTheme();
  const { user } = useAuth();

  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices] = useState({});      // { symbol: currentPrice }
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({ name: "", symbol: "", type: "Stock", units: "", avgCost: "", currency: "INR" });

  const R = Math.min(T.radius * 0.6, 10);
  const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: R, color: T.text, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  // ── Load holdings ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { db } = await getFirebase();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(collection(db, "users", user.uid, "holdings"), orderBy("createdAt", "desc"));
      onSnapshot(q, (snap) => {
        setHoldings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    })();
  }, [user]);

  // ── Fetch live prices for all symbols ───────────────────────────────────
  const refreshPrices = async () => {
    const symbols = [...new Set(holdings.filter((h) => h.symbol).map((h) => h.symbol))];
    if (!symbols.length) return;
    setFetching(true);
    const results = await Promise.all(symbols.map(async (s) => [s, await fetchPrice(s)]));
    setPrices(Object.fromEntries(results.filter(([, p]) => p !== null)));
    setFetching(false);
  };

  useEffect(() => {
    if (holdings.length) refreshPrices();
  }, [holdings.length]);

  // ── Add holding ──────────────────────────────────────────────────────────
  const addHolding = async () => {
    if (!form.name || !form.units || !form.avgCost) return;
    const { db } = await getFirebase();
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "users", user.uid, "holdings"), {
      name: form.name,
      symbol: form.symbol.toUpperCase(),
      type: form.type,
      units: parseFloat(form.units),
      avgCost: parseFloat(form.avgCost),
      currency: form.currency,
      createdAt: serverTimestamp(),
    });
    setForm({ name: "", symbol: "", type: "Stock", units: "", avgCost: "", currency: "INR" });
    setShowAdd(false);
  };

  const deleteHolding = async (id) => {
    const { db } = await getFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", user.uid, "holdings", id));
  };

  // ── P&L calculations ─────────────────────────────────────────────────────
  const withPnl = holdings.map((h) => {
    const currentPrice = prices[h.symbol] || null;
    const invested = h.units * h.avgCost;
    const currentValue = currentPrice ? h.units * currentPrice : invested;
    const pnl = currentValue - invested;
    const pnlPct = ((pnl / invested) * 100).toFixed(2);
    return { ...h, invested, currentValue, pnl, pnlPct, currentPrice, hasLive: !!currentPrice };
  });

  const totalInvested = withPnl.reduce((a, h) => a + h.invested, 0);
  const totalValue = withPnl.reduce((a, h) => a + h.currentValue, 0);
  const totalPnl = totalValue - totalInvested;

  // Allocation by type for pie
  const allocation = Object.values(
    withPnl.reduce((acc, h) => {
      acc[h.type] = acc[h.type] || { name: h.type, value: 0 };
      acc[h.type].value += h.currentValue;
      return acc;
    }, {})
  );

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Investment Portfolio</h2>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{holdings.length} holding{holdings.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={refreshPrices} disabled={fetching} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: R, color: T.textDim, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
            {fetching ? "Fetching…" : "🔄 Refresh Prices"}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add Holding
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Total Invested", value: totalInvested, color: T.text },
          { label: "Current Value", value: totalValue, color: T.accent },
          { label: "Total P&L", value: totalPnl, color: totalPnl >= 0 ? T.green : T.red,
            sub: `${totalPnl >= 0 ? "+" : ""}${((totalPnl / totalInvested) * 100 || 0).toFixed(2)}%` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...card, flex: 1, minWidth: 160 }}>
            <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ color, fontSize: 24, fontWeight: 700, fontFamily: T.mono }}>{fmt(value)}</div>
            {sub && <div style={{ color, fontSize: 13, marginTop: 4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Allocation pie */}
      {allocation.length > 0 && (
        <div style={card}>
          <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Portfolio Allocation</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <ResponsiveContainer width={200} height={160}>
              <PieChart>
                <Pie data={allocation} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                  {allocation.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allocation.map((a, i) => (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                  <span style={{ color: T.text, fontSize: 13 }}>{a.name}</span>
                  <span style={{ color: T.muted, fontSize: 12 }}>({((a.value / totalValue) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div style={card}>
        <div style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Holdings</div>
        {loading ? (
          <div style={{ color: T.muted, textAlign: "center", padding: 40 }}>Loading…</div>
        ) : withPnl.length === 0 ? (
          <div style={{ color: T.muted, textAlign: "center", padding: 40 }}>No holdings yet. Add your first investment!</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name / Symbol","Type","Units","Avg Cost","Current Price","Invested","Value","P&L",""].map((h) => (
                    <th key={h} style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", padding: "10px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withPnl.map((h, i) => (
                  <tr key={h.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? "rgba(128,128,128,0.03)" : "transparent" }}>
                    <td style={{ padding: "12px", color: T.text, fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{h.name}</div>
                      {h.symbol && <div style={{ color: T.muted, fontSize: 11, fontFamily: "monospace" }}>{h.symbol}{h.hasLive && " 🟢"}</div>}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 8px", color: T.textDim, fontSize: 11 }}>{h.type}</span>
                    </td>
                    <td style={{ padding: "12px", color: T.text, fontFamily: T.mono, fontSize: 13 }}>{h.units}</td>
                    <td style={{ padding: "12px", color: T.textDim, fontFamily: T.mono, fontSize: 13 }}>{fmt(h.avgCost)}</td>
                    <td style={{ padding: "12px", fontFamily: T.mono, fontSize: 13, color: h.hasLive ? T.text : T.muted }}>
                      {h.hasLive ? fmt(h.currentPrice) : <span style={{ fontSize: 11 }}>No live data</span>}
                    </td>
                    <td style={{ padding: "12px", color: T.textDim, fontFamily: T.mono, fontSize: 13 }}>{fmt(h.invested)}</td>
                    <td style={{ padding: "12px", color: T.accent, fontFamily: T.mono, fontSize: 13, fontWeight: 600 }}>{fmt(h.currentValue)}</td>
                    <td style={{ padding: "12px", fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: h.pnl >= 0 ? T.green : T.red }}>
                      {h.pnl >= 0 ? "+" : ""}{fmt(h.pnl)}
                      <div style={{ fontSize: 11, fontWeight: 400 }}>{h.pnl >= 0 ? "+" : ""}{h.pnlPct}%</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button onClick={() => deleteHolding(h.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14 }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {Object.keys(prices).length > 0 && (
          <div style={{ color: T.muted, fontSize: 11, marginTop: 12 }}>🟢 Live price available · Grey = using purchase price as estimate</div>
        )}
      </div>

      {/* Add holding modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 28, width: 460, maxWidth: "95vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ color: T.text, margin: 0, fontSize: 17 }}>Add Investment</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Name</div>
                <input style={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Reliance Industries" />
              </div>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Ticker Symbol</div>
                <input style={inp} value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} placeholder="RELIANCE.NS / BTC-USD" />
              </div>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Type</div>
                <select style={{ ...inp, cursor: "pointer" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Units / Qty</div>
                <input style={inp} type="number" value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Avg Buy Price (₹)</div>
                <input style={inp} type="number" value={form.avgCost} onChange={(e) => setForm((f) => ({ ...f, avgCost: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div style={{ color: T.muted, fontSize: 11, marginTop: 12, marginBottom: 20 }}>
              💡 For NSE stocks add <code>.NS</code> (e.g. <code>INFY.NS</code>), for BSE add <code>.BO</code>, crypto: <code>BTC-USD</code>
            </div>

            <button onClick={addHolding} style={{ width: "100%", background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Add to Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
