// ─────────────────────────────────────────────────────────────────────────────
//  src/context/AppContext.jsx
//  Firestore-backed transaction state + derived analytics data
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getFirebase } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { CATEGORIES, INCOME_CATS, fmt } from "../services/constants";

const AppCtx = createContext(null);

export function useApp() {
  return useContext(AppCtx);
}

export function AppProvider({ children }) {
  const { T } = useTheme();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState({ search: "", category: "", type: "" });
  const [sort, setSort]                 = useState({ key: "date", dir: "desc" });
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((msg, color) => {
    setToast({ msg, color: color || T.green });
    setTimeout(() => setToast(null), 3200);
  }, [T.green]);

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setTransactions([]); setLoading(false); return; }
    let unsub;
    (async () => {
      setLoading(true);
      const { db } = await getFirebase();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("createdAt", "desc")
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        () => setLoading(false)
      );
    })();
    return () => unsub?.();
  }, [user]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addTransaction = useCallback(async (txn) => {
    if (!user) return;
    const { db } = await getFirebase();
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      ...txn,
      date: txn.date || new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const deleteTransaction = useCallback(async (id) => {
    if (!user) return;
    const { db } = await getFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  }, [user]);

  // ── CSV Import ────────────────────────────────────────────────────────────
  const importCSV = useCallback(async (text) => {
    const lines = text.trim().split("\n");
    const header = lines[0].toLowerCase();
    if (!header.includes("date") || !header.includes("amount")) {
      showToast("CSV must have Date, Description, Category, Amount columns.", T.red);
      return;
    }
    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const [date, description, category, amount] = lines[i]
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""));
      const amt = parseFloat(amount);
      if (!date || !description || !category || isNaN(amt)) continue;
      imported.push({
        date,
        description,
        category: CATEGORIES.includes(category) ? category : "Other",
        amount: amt,
      });
    }
    if (!imported.length) {
      showToast("No valid rows found in CSV.", T.red);
      return;
    }
    const { db } = await getFirebase();
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await Promise.all(
      imported.map((txn) =>
        addDoc(collection(db, "users", user.uid, "transactions"), {
          ...txn,
          createdAt: serverTimestamp(),
        })
      )
    );
    showToast(`Imported ${imported.length} transaction${imported.length !== 1 ? "s" : ""}.`);
  }, [user, showToast, T.red]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const rows = [
      ["Date", "Description", "Category", "Amount"],
      ...transactions.map((t) => [t.date, `"${t.description}"`, t.category, t.amount]),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" })
    );
    a.download = "fintrack_transactions.csv";
    a.click();
  }, [transactions]);

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    const win = window.open("", "_blank");
    const totals = transactions.reduce(
      (acc, t) => {
        if (INCOME_CATS.has(t.category)) acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
    const rows = transactions
      .map((t) => {
        const isInc = INCOME_CATS.has(t.category);
        return `<tr>
          <td>${t.date}</td><td>${t.description}</td><td>${t.category}</td>
          <td style="color:${isInc ? "#16a34a" : "#dc2626"};font-weight:600">
            ${isInc ? "+" : "-"}${fmt(t.amount)}
          </td>
        </tr>`;
      })
      .join("");
    win.document.write(`<!DOCTYPE html><html><head><title>FinTrack Report</title>
      <style>
        body{font-family:sans-serif;padding:32px;color:#1e293b}
        h1{color:${T.accent}}
        table{width:100%;border-collapse:collapse;margin-top:24px}
        th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase}
        td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
        .summary{display:flex;gap:24px;margin:20px 0}
        .stat{background:#f8fafc;border-radius:8px;padding:16px 20px}
        .stat-label{font-size:11px;color:#64748b;text-transform:uppercase}
        .stat-val{font-size:22px;font-weight:700;margin-top:4px}
        @media print{button{display:none}}
      </style></head><body>
      <h1>💰 FinTrack Report</h1>
      <p style="color:#64748b">
        Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}<br/>
        Account: ${user?.email || ""}
      </p>
      <div class="summary">
        <div class="stat">
          <div class="stat-label">Balance</div>
          <div class="stat-val" style="color:${totals.income - totals.expense >= 0 ? "#16a34a" : "#dc2626"}">
            ${fmt(totals.income - totals.expense)}
          </div>
        </div>
        <div class="stat"><div class="stat-label">Income</div><div class="stat-val" style="color:#16a34a">${fmt(totals.income)}</div></div>
        <div class="stat"><div class="stat-label">Expenses</div><div class="stat-val" style="color:#dc2626">${fmt(totals.expense)}</div></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = () => window.print();</script>
    </body></html>`);
    win.document.close();
  }, [transactions, T.accent, user]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const totals = transactions.reduce(
    (acc, t) => {
      if (INCOME_CATS.has(t.category)) acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  totals.balance = totals.income - totals.expense;

  const catBreakdown = Object.values(
    transactions
      .filter((t) => !INCOME_CATS.has(t.category))
      .reduce((acc, t) => {
        acc[t.category] = acc[t.category] || { name: t.category, value: 0 };
        acc[t.category].value += t.amount;
        return acc;
      }, {})
  ).sort((a, b) => b.value - a.value);

  const monthlyTrend = (() => {
    const map = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { month: d.toLocaleString("default", { month: "short" }), income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const k = t.date?.slice(0, 7);
      if (k && map[k]) {
        if (INCOME_CATS.has(t.category)) map[k].income += t.amount;
        else map[k].expense += t.amount;
      }
    });
    return Object.values(map);
  })();

  const filtered = transactions
    .filter((t) => {
      if (filter.search && !t.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.category && t.category !== filter.category) return false;
      if (filter.type === "income" && !INCOME_CATS.has(t.category)) return false;
      if (filter.type === "expense" && INCOME_CATS.has(t.category)) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (sort.key === "amount") { va = Number(va); vb = Number(vb); }
      return sort.dir === "asc"
        ? va < vb ? -1 : va > vb ? 1 : 0
        : va > vb ? -1 : va < vb ? 1 : 0;
    });

  return (
    <AppCtx.Provider value={{
      transactions, filtered, loading,
      addTransaction, deleteTransaction, importCSV, exportCSV, exportPDF,
      totals, catBreakdown, monthlyTrend,
      filter, setFilter, sort, setSort,
      toast,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
