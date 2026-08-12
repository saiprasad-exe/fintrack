// ─────────────────────────────────────────────────────────────────────────────
//  src/views/Dashboard.jsx
//  Analytics: stat cards, line chart, pie chart, bar chart, recent activity
// ─────────────────────────────────────────────────────────────────────────────

import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";

import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { StatCard, ChartCard } from "../components/UI";
import { INCOME_CATS, PALETTE, fmt } from "../services/constants";

export default function Dashboard() {
  const { T } = useTheme();
  const { totals, catBreakdown, monthlyTrend, transactions, loading } = useApp();

  const savingsRate =
    totals.income > 0
      ? (((totals.income - totals.expense) / totals.income) * 100).toFixed(1)
      : null;

  const ttip = {
    contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text },
    formatter: (v) => fmt(v),
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: T.muted, padding: "80px 0", fontSize: 14 }}>
        Loading your data…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard
          label="Balance"
          value={totals.balance}
          color={totals.balance >= 0 ? T.green : T.red}
          sub={savingsRate !== null ? `${savingsRate}% savings rate` : null}
        />
        <StatCard label="Total Income" value={totals.income} color={T.green} />
        <StatCard
          label="Total Expenses"
          value={totals.expense}
          color={T.red}
          sub={catBreakdown[0] ? `Top: ${catBreakdown[0].name}` : null}
        />
      </div>

      {/* Line + Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard
          title="Monthly Trend"
          empty={monthlyTrend.every((m) => !m.income && !m.expense) ? "No data yet" : null}
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...ttip} />
              <Legend wrapperStyle={{ color: T.textDim, fontSize: 12 }} />
              <Line type="monotone" dataKey="income" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Expense Breakdown"
          empty={catBreakdown.length === 0 ? "No expenses yet" : null}
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={catBreakdown} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {catBreakdown.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...ttip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bar chart */}
      <ChartCard
        title="Spending by Category"
        empty={catBreakdown.length === 0 ? "No expenses yet" : null}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={catBreakdown}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...ttip} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {catBreakdown.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Recent activity */}
      {transactions.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20 }}>
          <div style={{ color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Recent Activity
          </div>
          {transactions.slice(0, 5).map((t, i) => {
            const isInc = INCOME_CATS.has(t.category);
            return (
              <div
                key={t.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}
              >
                <div>
                  <div style={{ color: T.text, fontSize: 14 }}>{t.description}</div>
                  <div style={{ color: T.muted, fontSize: 12 }}>{t.category} · {t.date}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontWeight: 700, color: isInc ? T.green : T.red }}>
                  {isInc ? "+" : "-"}{fmt(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
