// ─────────────────────────────────────────────────────────────────────────────
//  src/views/Transactions.jsx
//  Full table with search, filter, sort, CSV import/export, PDF export
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { CATEGORIES, INCOME_CATS, fmt } from "../services/constants";

export default function Transactions() {
  const { T } = useTheme();
  const { filtered, deleteTransaction, filter, setFilter, sort, setSort, exportCSV, exportPDF, importCSV, loading } = useApp();

  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importCSV(ev.target.result);
    reader.readAsText(file);
    e.target.value = "";
  };

  const col = (key, label) => (
    <th
      onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
      style={{ color: T.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 16px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label}{" "}
      {sort.key === key
        ? sort.dir === "asc" ? "↑" : "↓"
        : <span style={{ opacity: 0.3 }}>↕</span>
      }
    </th>
  );

  const inp = {
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: T.radius * 0.6, color: T.text,
    padding: "8px 12px", fontSize: 13, outline: "none",
  };
  const btn = {
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: T.radius * 0.6, color: T.text,
    padding: "8px 16px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filters + action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inp, flex: 1, minWidth: 180 }}
          placeholder="🔍  Search description…"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
        />

        <select style={{ ...inp, cursor: "pointer" }} value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select style={{ ...inp, cursor: "pointer" }} value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn} onClick={exportCSV}>⬇ CSV</button>
          <button style={btn} onClick={exportPDF}>🖨 PDF</button>
          <button
            style={{ ...btn, background: T.accent, border: "none", color: "#fff" }}
            onClick={() => fileRef.current.click()}
          >
            ⬆ Import
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
      </div>

      <div style={{ color: T.muted, fontSize: 12 }}>
        Import format:{" "}
        <span style={{ fontFamily: T.mono, color: T.textDim }}>Date, Description, Category, Amount</span>
      </div>

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "auto" }}>
        {loading ? (
          <div style={{ color: T.muted, textAlign: "center", padding: "60px 0" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: T.muted, textAlign: "center", padding: "60px 0" }}>No transactions found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ borderBottom: `1px solid ${T.border}` }}>
              <tr>
                {col("date", "Date")}
                {col("description", "Description")}
                {col("category", "Category")}
                {col("amount", "Amount")}
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const isInc = INCOME_CATS.has(t.category);
                return (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 ? "rgba(128,128,128,0.04)" : "transparent" }}>
                    <td style={{ padding: "12px 16px", color: T.textDim, fontSize: 13, fontFamily: T.mono }}>{t.date}</td>
                    <td style={{ padding: "12px 16px", color: T.text, fontSize: 14 }}>{t.description}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 10px", color: T.textDim, fontSize: 12 }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: T.mono, fontWeight: 700, color: isInc ? T.green : T.red, fontSize: 14 }}>
                      {isInc ? "+" : "-"}{fmt(t.amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ color: T.muted, fontSize: 12, textAlign: "right" }}>
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
